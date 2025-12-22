// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- DEBUG LOGGING ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

console.log("--- Server Configuration Check ---");
console.log("Vision Key Configured:", !!(process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY));
console.log("Cloudinary Configured:", !!(process.env.CLOUDINARY_CLOUD_NAME));
if (!process.env.GOOGLE_AI_KEY && !process.env.VITE_GEMINI_API_KEY) {
  console.log("⚠️  WARNING: AI Scanner will fail locally. Please add GOOGLE_AI_KEY to your .env file.");
}
console.log("----------------------------------");

// --- AI Chat endpoint using Ollama/Llama3 (Local only) ---
app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit!");
  res.json({ message: "Server is working!" });
});

app.post("/api/chat", async (req, res) => {
  try {
    // Check if running locally with Ollama
    if (process.env.OLLAMA_API_URL) {
      const { messages } = req.body;
      const prompt = messages.map(m =>
        `${m.role === "user" ? "User" : "AI"}: ${m.content}`
      ).join('\n') + "\nAI:";

      const response = await axios.post(
        `${process.env.OLLAMA_API_URL}/api/generate`,
        {
          model: "llama3",
          prompt,
          stream: false
        }
      );
      res.json({ answer: response.data.response.trim() });
    } else {
      res.json({ answer: "AI Chat is currently in cloud-mode. Please use the Stylist Chat." });
    }
  } catch (err) {
    console.error("Ollama API Chat Error:", err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Cloudinary Upload Endpoint ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dw86lrpv6',
  api_key: process.env.CLOUDINARY_API_KEY || '121943449379972',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'uVWGCQ4jKjQWo5xZMCdRMs7rdLo'
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Cloudinary Signature Endpoint (for client-side upload) ---
app.get("/api/sign-upload", (req, res) => {
  try {
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'uVWGCQ4jKjQWo5xZMCdRMs7rdLo';
    if (!apiSecret) {
      throw new Error("Missing CLOUDINARY_API_SECRET");
    }

    const timestamp = Math.round((new Date()).getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp
    }, apiSecret);

    res.json({
      timestamp,
      signature,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dw86lrpv6',
      api_key: process.env.CLOUDINARY_API_KEY || '121943449379972'
    });
  } catch (error) {
    console.error("Sign-Upload Error:", error.message);
    res.status(500).json({ error: "Failed to sign upload: " + error.message });
  }
});

app.post("/api/upload-image", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'okasina-products',
      transformation: [
        { quality: "auto", fetch_format: "auto" },
        { effect: "improve:outdoor" },
        { effect: "sharpen:100" }
      ]
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });

  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- Supabase Admin Endpoints ---
// --- Supabase Setup ---
// --- Supabase Setup (Lazy Init) ---
let supabaseInstance = null;
let supabaseAdminInstance = null;

const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    }
  } catch (e) {
    console.error("Supabase Init Err:", e);
  }
  return null;
};

const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) return supabaseAdminInstance;
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      supabaseAdminInstance = createClient(url, key);
      return supabaseAdminInstance;
    }
  } catch (e) {
    console.error("Supabase Admin Init Err:", e);
  }
  // Return dummy if missing to prevent crash on property access
  return {
    from: () => ({ select: () => ({ limit: () => ({ data: null, error: { message: "DB Not Configured" } }) }), insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: "DB Not Configured" } }) }) }) }),
    rpc: () => ({})
  };
};

// Helper to check DB
const getDbStatus = async () => {
  const supabase = getSupabase();
  if (!supabase) return { status: 'offline', error: 'Missing Configuration' };
  const start = Date.now();
  try {
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return { status: 'connected', latency: Date.now() - start };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
};

// Update product categories
app.post('/api/update-category', async (req, res) => {
  try {
    const { productIds, category } = req.body;
    const { data, error, count } = await getSupabaseAdmin()
      .from('products')
      .update({ category }, { count: 'exact' })
      .in('id', productIds);

    if (error) throw error;
    res.json({ success: true, count, message: `Updated ${count} products` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.post('/api/delete-product', async (req, res) => {
  try {
    const { productId } = req.body;
    const { error, count } = await getSupabaseAdmin()
      .from('products')
      .delete({ count: 'exact' })
      .eq('id', productId);

    if (error) throw error;
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product
app.post('/api/create-product', async (req, res) => {
  try {
    const productData = req.body;
    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, product: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.post('/api/update-product', async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    console.log('Update product request:', { id, fields: Object.keys(updateData) });

    const { data, error } = await getSupabaseAdmin()
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    console.log('Product updated successfully:', id);
    res.json({ success: true, product: data });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: error.message, details: error });
  }
});

// Update order status
app.post('/api/update-order-status', async (req, res) => {
  try {
    const { orderId, status } = req.body;

    console.log(`Updating order ${orderId} to ${status}`);

    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    // Send email notification (optional/future)
    if (status === 'shipped' || status === 'completed') {
      // Logic to email customer would go here
    }

    res.json({ success: true, order: data });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- AI Agent Endpoints (Cloud Compatible) ---

// AI Stylist Chat Endpoint
app.post('/api/stylist-chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    // 1. Construct prompt with context
    const systemPrompt = `You are the AI Stylist for Okasina Fashion, a premium store for modern Indian wear. 
    Your tone is helpful, chic, and professional. 
    Recommend products based on the user's query. 
    If they ask for "Lehenga", "Saree", "Kurta", or "Sherwani", suggest relevant items.
    Keep responses concise (under 50 words unless detailed advice is needed).`;

    // 2. Call Gemini API
    const apiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('AI Key missing. Returning fallback.');
      return res.json({
        replyText: "I'm currently in 'Offline Mode' as my AI brain key is missing. I recommend checking out our 'New Arrivals' section!",
        suggestedProductIds: []
      });
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt + "\n\nUser: " + message }] }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Gemini API Error details:', data);
        // Fallback on API error
        return res.json({
          replyText: "I'm having a brief connection hiccup with the fashion cloud. However, I think you'd look great in our latest Silk Saree collection!",
          suggestedProductIds: []
        });
      }

      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I didn't catch that.";

      res.json({
        replyText,
        suggestedProductIds: []
      });

    } catch (fetchError) {
      console.error('Gemini Fetch Error:', fetchError);
      res.json({
        replyText: "My connection is a bit spotty. While I reconnect, please enjoy browsing our Accessories.",
        suggestedProductIds: []
      });
    }

  } catch (error) {
    console.error('Stylist Chat Error:', error);
    res.status(500).json({ error: 'Failed to process chat request', details: error.message });
  }
});

// Vision Agent - Powered by Gemini 1.5 Flash
app.post('/api/ai-agent/jarvis/vision', async (req, res) => {
  try {
    const { rawDetails, imageUrl } = req.body;
    const apiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ success: false, error: "AI Service Unavailable (Missing Key)" });
    }

    console.log(`[Vision] Analyzing image: ${imageUrl}`);

    // Fetch the image and convert to base64
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `You are an expert fashion merchandiser. Analyze this product image and output a JSON object with these fields:
    - name: A catchy, SEO-friendly product name.
    - description: A compelling description (paragraph format).
    - category: One of [Clothing, Shoes, Accessories, Bags].
    - subcategory: Specific type (e.g., 'Maxi Dress', 'Sneakers').
    - color: Primary color.
    - tags: Array of 3 key hashtags (e.g., #Summer, #Cotton).
    - estimated_price_mur: Estimate price in Mauritian Rupees (Number only).
    
    Return ONLY raw JSON, no markdown formatting.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
          ]
        }]
      })
    });

    const data = await response.json();

    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Clean markdown code blocks if present
    if (aiText && aiText.includes('```json')) {
      aiText = aiText.replace(/```json/g, '').replace(/```/g, '');
    }

    let productData = {};
    try {
      productData = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse AI JSON", aiText);
      // Fallback partial data
      productData = { name: "New Arrival", description: aiText };
    }

    // Merge with defaults
    const finalProduct = {
      name: productData.name || "New Fashion Item",
      description: productData.description || "Fresh arrival at Okasina.",
      price: productData.estimated_price_mur || 1500,
      price_mur: productData.estimated_price_mur || 1500,
      category: productData.category || "Clothing",
      subcategory: productData.subcategory || "General",
      stock_qty: 10,
      status: "draft",
      image_url: imageUrl,
      sizes: ["S", "M", "L"] // Default sizes
    };

    res.json({
      success: true,
      product: finalProduct
    });

  } catch (error) {
    console.error('Vision Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sentinel - Health Check
app.post('/api/ai-agent/az/sentinel', async (req, res) => {
  // In cloud, we just check Supabase connection
  const { error } = await getSupabaseAdmin().from('products').select('id').limit(1);
  if (error) {
    res.status(500).json({ success: false, status: 'critical', error: error.message });
  } else {
    res.json({ success: true, status: 'healthy', message: 'Cloud Sentinel: System Operational' });
  }
});

// Analyst - Sales Insights (Stub)
app.post('/api/ai-agent/jarvis/analyst', async (req, res) => {
  res.json({ success: true, insights: "Analyst is gathering data...", message: "Cloud Analyst Active" });
});

// Marketing Agent (Stub)
app.post('/api/ai-agent/jarvis/marketing', async (req, res) => {
  res.json({ success: true, content: "#OkasinaFashion #Style", message: "Cloud Marketing Active" });
});

// Customer Service (Stub)
app.post('/api/ai-agent/jarvis/customer-service', async (req, res) => {
  res.json({ success: true, response: "Thank you for your inquiry. Our team will get back to you shortly.", message: "Cloud Support Active" });
});

// Inventory Agent (Stub)
app.post('/api/ai-agent/jarvis/inventory', async (req, res) => {
  res.json({ success: true, predictions: "Inventory levels are stable.", message: "Cloud Inventory Active" });
});

// --- JARVIS Feedback Endpoint ("The Mouth") ---
app.post('/api/jarvis/feedback', async (req, res) => {
  try {
    const { message, type, url, path, userAgent, timestamp } = req.body;

    console.log(`[JARVIS MOUTH] New Report: [${type}] ${message.substring(0, 50)}...`);

    // 1. Log to Supabase "jarvis_feedback" table
    const { data, error } = await getSupabaseAdmin()
      .from('jarvis_feedback')
      .insert([{
        message,
        type,
        url,
        path,
        user_agent: userAgent,
        created_at: timestamp || new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase Feedback Insert Error:', error);
      // Fallback: Just log it to console if DB fails
    }

    // 2. Email Admin if it's a BUG
    if (type === 'bug' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Async email (don't await)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });

      transporter.sendMail({
        from: `"JARVIS System" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER, // Send to self/admin
        subject: `[JARVIS ISSUE] ${type.toUpperCase()}: ${message.substring(0, 30)}...`,
        html: `<h3>New Feedback Report</h3>
               <p><strong>Type:</strong> ${type}</p>
               <p><strong>Message:</strong> ${message}</p>
               <p><strong>Path:</strong> ${path}</p>
               <p><strong>URL:</strong> ${url}</p>
               <p><strong>User Agent:</strong> ${userAgent}</p>`
      }).catch(err => console.error('Feedback Email Failed:', err));
    }

    res.json({ success: true, id: data?.id || 'backup-log-id' });

  } catch (error) {
    console.error('Feedback Endpoint Error:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

// --- System Log Endpoint ---
app.post('/api/log', async (req, res) => {
  const { level, message, context, url, user_agent } = req.body;
  // Optional: Log to server console
  console.log(`[CLIENT-${level?.toUpperCase()}] ${message}`);

  // We rely on client-side Supabase logging, but this can be a backup
  res.json({ success: true });
});

// --- Admin Agent Action Engine ---
app.post('/api/admin-agent', async (req, res) => {
  try {
    const { command, context } = req.body;
    console.log(`[AdminAgent] Received command: ${command}`);

    // Simple Regex Intent Classifier (v1)
    const lowerCmd = command.toLowerCase();
    let action = null;
    let responseText = "I didn't understand that command.";
    let confirmationNeeded = false;
    let data = {};

    if (lowerCmd.includes('publish') && lowerCmd.includes('draft')) {
      // Intent: Publish Drafts
      const { count } = await getSupabaseAdmin()
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      action = 'confirm_publish_drafts';
      responseText = `I found ${count} draft products. Do you want me to publish them all to the store?`;
      confirmationNeeded = true;
      data = { count };

    } else if (lowerCmd.includes('confirm') && context?.lastAction === 'confirm_publish_drafts') {
      // Intent: Execute Publish
      const { data: updated, error } = await getSupabaseAdmin()
        .from('products')
        .update({ status: 'active' })
        .eq('status', 'draft')
        .select();

      if (error) throw error;
      responseText = `Success! I have published ${updated.length} products.`;
      action = 'completed';

    } else if (lowerCmd.includes('delete') && lowerCmd.includes('draft')) {
      // Intent: Delete Drafts
      const { count } = await getSupabaseAdmin()
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      action = 'confirm_delete_drafts';
      responseText = `I found ${count} draft products. Are you sure you want to DELETE them permanently?`;
      confirmationNeeded = true;
      data = { count };

    } else if (lowerCmd.includes('confirm') && context?.lastAction === 'confirm_delete_drafts') {
      // Intent: Execute Delete
      const { count, error } = await getSupabaseAdmin()
        .from('products')
        .delete({ count: 'exact' })
        .eq('status', 'draft');

      if (error) throw error;
      responseText = `Done. I have deleted ${count} draft products.`;
      action = 'completed';

    } else if (lowerCmd.includes('stock') || lowerCmd.includes('inventory')) {
      // Intent: Check Stock
      const { data: lowStock } = await getSupabaseAdmin()
        .from('products')
        .select('name, stock_qty')
        .lt('stock_qty', 5)
        .limit(5);

      if (lowStock && lowStock.length > 0) {
        const items = lowStock.map(i => `- ${i.name} (${i.stock_qty})`).join('\n');
        responseText = `Here are some items running low on stock:\n${items}`;
      } else {
        responseText = "Stock levels look good! No items are critically low.";
      }
    }

    res.json({
      responseText,
      action,
      confirmationNeeded,
      data
    });

  } catch (error) {
    console.error('Admin Agent Error:', error);
    res.status(500).json({ error: error.message, responseText: "I encountered an error executing that command." });
  }
});

// --- Facebook Album Import Stubs ---
app.get('/api/facebook/list-albums', async (req, res) => {
  try {
    const accessToken = req.query.accessToken || process.env.FACEBOOK_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || process.env.VITE_FB_ACCESS_TOKEN;
    const pageId = req.query.pageId || process.env.FACEBOOK_PAGE_ID;

    if (!accessToken || !pageId) {
      return res.status(500).json({ error: 'Server configuration missing: FACEBOOK_ACCESS_TOKEN or FACEBOOK_PAGE_ID not set.' });
    }

    const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/albums`, {
      params: { access_token: accessToken, fields: 'id,name,count,cover_photo{source},created_time' }
    });

    res.json({ albums: response.data.data });
  } catch (error) {
    console.error('FB List Albums Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch albums: ' + (error.response?.data?.error?.message || error.message) });
  }
});

app.post('/api/facebook/import-album', async (req, res) => {
  try {
    // Merge body params with env defaults
    const accessToken = req.body.accessToken || process.env.FACEBOOK_ACCESS_TOKEN || process.env.FB_ACCESS_TOKEN || process.env.VITE_FB_ACCESS_TOKEN;
    const { albumId, useAI, createProducts } = req.body;

    if (!accessToken) {
      return res.status(500).json({ error: 'Missing FACEBOOK_ACCESS_TOKEN configuration.' });
    }

    // 1. Fetch Photos
    const photosResp = await axios.get(`https://graph.facebook.com/v18.0/${albumId}/photos`, {
      params: { access_token: accessToken, fields: 'id,source,name,created_time', limit: 20 } // Reduced limit to prevent timeouts with AI
    });

    const photos = photosResp.data.data;
    const createdProducts = [];
    let failureCount = 0;
    let aiUsedCount = 0;

    // 2. Process Photos
    for (const photo of photos) {
      try {
        let imageUrl = photo.source;
        let productData = {
          name: photo.name ? (photo.name.length > 50 ? photo.name.substring(0, 47) + '...' : photo.name) : 'Imported Item',
          description: photo.name || 'Imported from Facebook',
          category: 'New Arrivals',
          price_mur: 0,
          tags: []
        };

        // AI ENHANCEMENT
        if (useAI && (process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY)) {
          try {
            const apiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
            const imageResp = await fetch(imageUrl);
            const arrayBuffer = await imageResp.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString('base64');

            const prompt = `Analyze this fashion product. Return JSON:
                {
                    "name": "Short catchy title (max 50 chars)",
                    "description": "Engaging sales description",
                    "category": "Clothing/Shoes/Accessories",
                    "price_mur": estimated_price_in_mauritian_rupees_number
                }`;

            const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                  ]
                }]
              })
            });

            const aiData = await aiResponse.json();
            let aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (aiText) {
              aiText = aiText.replace(/```json/g, '').replace(/```/g, '');
              const parsed = JSON.parse(aiText);
              productData = { ...productData, ...parsed };
              aiUsedCount++;
            }
          } catch (aiErr) {
            console.error("AI Analysis Failed for photo:", photo.id, aiErr.message);
          }
        }

        if (createProducts) {
          const { data, error } = await getSupabaseAdmin().from('products').insert([{
            name: productData.name,
            description: productData.description,
            image_url: imageUrl,
            price: 0, // Legacy field
            price_mur: productData.price_mur || 0,
            stock_qty: 1,
            category: productData.category || 'New Arrivals',
            status: 'draft'
          }]).select().single();

          if (data) createdProducts.push(data);
        }
      } catch (e) {
        console.error("Product creation failed:", e);
        failureCount++;
      }
    }

    res.json({
      success: true,
      productsCreated: createdProducts.length,
      failures: failureCount,
      aiUsed: aiUsedCount > 0,
      products: createdProducts // Return full list for preview
    });

  } catch (error) {
    console.error('FB Import Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Import failed: ' + (error.response?.data?.error?.message || error.message) });
  }
});

app.post('/api/facebook/import-photo', async (req, res) => {
  try {
    const { id, url, caption, useAI, createProducts } = req.body;

    // Validate inputs
    if (!id || !url) {
      return res.status(400).json({ error: 'Missing required fields (id, url)' });
    }

    console.log(`[Import-Photo] Processing photo ${id.substring(0, 8)}...`);

    let finalProduct = {
      name: caption ? (caption.length > 50 ? caption.substring(0, 47) + '...' : caption) : 'Imported Item',
      description: caption || 'Imported from Facebook',
      category: 'New Arrivals',
      price_mur: 0,
      tags: [],
      image_url: url,
      facebook_photo_id: id,
      status: 'draft',
      stock_qty: 1
    };

    // 1. AI Analysis (if enabled)
    if (useAI && (process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY)) {
      try {
        const apiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;

        // Fetch image for AI
        const imageResp = await fetch(url);
        const arrayBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        const prompt = `Analyze this fashion product. Return JSON:
              {
                  "name": "Short catchy title (max 50 chars)",
                  "description": "Engaging sales description",
                  "category": "Clothing/Shoes/Accessories",
                  "price_mur": <estimated_price_number>
              }`;

        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: "image/jpeg", data: base64Image } }
              ]
            }]
          })
        });

        const aiData = await aiResponse.json();
        let aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (aiText) {
          aiText = aiText.replace(/```json/g, '').replace(/```/g, '');
          const parsed = JSON.parse(aiText);
          // Merge AI data
          finalProduct = { ...finalProduct, ...parsed };
        }
      } catch (aiErr) {
        console.error("[Import-Photo] AI Analysis Failed:", aiErr.message);
        // Continue without AI data
      }
    }

    // 2. Create Product in DB (if enabled)
    if (createProducts) {
      const { data, error } = await getSupabaseAdmin().from('products').insert([finalProduct]).select().single();

      if (error) {
        throw error;
      }

      return res.json({
        success: true,
        product: data,
        message: 'Product imported successfully'
      });
    }

    // Dry run
    res.json({
      success: true,
      product: finalProduct,
      message: 'Dry run complete (Product not saved)'
    });

  } catch (error) {
    console.error('[Import-Photo] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// --- Vision AI - Extract Text from Images ---
app.post('/api/extract-image-text', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

    const geminiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) return res.status(501).json({ error: 'Vision AI not configured' });

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();
    const base64Image = imageBuffer.toString('base64');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Extract ALL text from this image. Include product names, prices, sizes, colors, materials, and descriptions. Format as structured data.' },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ success: true, extractedText, imageUrl });

  } catch (error) {
    console.error('Vision AI error:', error);
    res.status(500).json({ error: 'Failed to extract text from image', details: error.message });
  }
});

// --- NEW: AI Product Scanner (Structured) ---
app.post('/api/analyze-product-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });

    const geminiKey = process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) return res.status(501).json({ error: 'Vision AI not configured' });

    console.log(`[AI Scanner] Analyzing: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();
    const base64Image = imageBuffer.toString('base64');

    const prompt = `
      Analyze this product image and extract the following details into a valid JSON object:
      - name: A short, descriptive product name (e.g. "Cotton Dress with Pockets").
      - price: The price as a number (remove currency symbols).
      - sizes: A string of available sizes (e.g. "S, M, L").
      - fabric: The material/fabric if mentioned.
      - color: The primary color.
      - category: Suggested category (e.g. Kurtis, Suits, Dresses).
      - sku_suggestion: A short SKU code based on the name (e.g. COT-DRS-001).
      
      Return ONLY the JSON. Do not include markdown formatting.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Clean markdown if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const productData = JSON.parse(text);
    res.json({ success: true, product: productData });

  } catch (error) {
    console.error('AI Scanner Error:', error);
    res.status(500).json({ error: 'AI Analysis Failed', details: error.message });
  }
});

// --- Email Service ---
// --- Email Service ---
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials missing. Logging email instead.');
      console.log(`[EMAIL STUB] To: ${to}, Subject: ${subject}`);
      return res.json({ success: true, message: 'Email logged (Credentials missing)' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `"Okasina Fashion" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email sent:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email Error:', error);
    // Don't fail the client completely, just log it
    res.status(200).json({ success: false, error: error.message, message: 'Failed to send email' });
  }
});



// --- CITADEL SYSTEM VITALS ---
app.get('/api/citadel/vitals', async (req, res) => {
  const start = Date.now();
  let dbStatus = 'disconnected';
  let dbLatency = 0;

  try {
    // Check Supabase connection
    const { data, error } = await getSupabaseAdmin().from('products').select('id').limit(1);
    if (!error) {
      dbStatus = 'connected';
      dbLatency = Date.now() - start;
    }
  } catch (e) {
    console.error('Citadel DB Check Failed', e);
  }

  const memUsage = process.memoryUsage();

  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      memory_rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      memory_heap: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
      node_version: process.version
    },
    services: {
      database: { status: dbStatus, latency_ms: dbLatency },
      ai_vision: { status: (process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY) ? 'ready' : 'offline' },
      cloudinary: { status: (process.env.CLOUDINARY_CLOUD_NAME) ? 'configured' : 'missing_config' }
    }
  });
});

const PORT = process.env.PORT || 3001;

// Only listen if run directly (not imported)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
