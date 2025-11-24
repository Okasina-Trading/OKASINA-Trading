import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { albumId, albumName, useAI = false, createProducts = true } = req.body;
    const {
        FB_ACCESS_TOKEN,
        SUPABASE_STORAGE_BUCKET,
        VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY, // Add this
    } = process.env;

    const logs = [];
    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    // Validate required environment variables
    if (!SUPABASE_STORAGE_BUCKET) {
        return res.status(500).json({
            error: 'Missing SUPABASE_STORAGE_BUCKET environment variable. Please configure it in your environment.',
            logs
        });
    }

    // Diagnostic: Check which project we are connecting to
    const projectRef = VITE_SUPABASE_URL ? VITE_SUPABASE_URL.split('.')[0].split('//')[1] : 'UNKNOWN';
    log(`Connecting to Supabase Project: ${projectRef}`);
    log(`Using Storage Bucket: ${SUPABASE_STORAGE_BUCKET}`);

    log(`Starting import for album: ${albumId} (${albumName})`);

    if (!albumId) return res.status(400).json({ error: 'Missing albumId', logs });
    if (!FB_ACCESS_TOKEN) return res.status(500).json({ error: 'Missing FB_ACCESS_TOKEN', logs });

    // Use Service Role Key if available to bypass RLS, otherwise fall back to Anon Key
    const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || VITE_SUPABASE_ANON_KEY;
    const supabase = createClient(VITE_SUPABASE_URL, supabaseKey);

    try {
        // 1. Fetch photos from Facebook (limit to 10 to avoid timeout)
        const limit = 10;
        const fbUrl = `https://graph.facebook.com/v19.0/${albumId}/photos?fields=images,id,created_time&limit=${limit}&access_token=${FB_ACCESS_TOKEN}`;
        log('Fetching photos from FB...');
        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();

        if (fbData.error) {
            throw new Error(`FB API Error: ${fbData.error.message}`);
        }

        const photos = fbData.data || [];
        log(`Found ${photos.length} photos.`);

        if (photos.length === 0) {
            return res.status(200).json({ message: 'No photos found in this album.', productsCreated: 0, logs });
        }

        const uploadedProducts = [];
        const errors = [];

        // 2. Process each photo
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            log(`Processing photo ${i + 1}/${photos.length}: ${photo.id}`);

            try {
                const largestImage = photo.images?.[0];
                if (!largestImage?.source) {
                    log(`Skipping ${photo.id}: No image source`);
                    continue;
                }

                // Download image
                const imgRes = await fetch(largestImage.source);
                if (!imgRes.ok) {
                    log(`Failed to download image: ${imgRes.status}`);
                    continue;
                }
                const imgBuffer = await imgRes.arrayBuffer();
                const buffer = Buffer.from(imgBuffer);
                const filename = `fb-${albumId}-${photo.id}.jpg`;

                // Upload to Supabase Storage
                const { error: uploadError } = await supabase.storage
                    .from(SUPABASE_STORAGE_BUCKET)
                    .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true });
                if (uploadError) {
                    log(`Upload failed: ${uploadError.message}`);
                    errors.push({ photo: photo.id, error: uploadError.message });
                    continue;
                }

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from(SUPABASE_STORAGE_BUCKET)
                    .getPublicUrl(filename);
                const imageUrl = urlData.publicUrl;

                // Generate product data (fallback if AI not used)
                const productData = generateFallbackProduct(filename, albumName, imageUrl);

                // Insert into Supabase DB
                const { data: product, error: dbError } = await supabase
                    .from('products')
                    .insert({
                        name: productData.name,
                        description: productData.description,
                        price: productData.suggestedPrice,
                        price_mur: productData.suggestedPrice * 45, // Convert to MUR
                        category: productData.category,
                        image_url: imageUrl,
                        stock_qty: 10,
                        is_active: false, // Draft status
                        status: 'draft',
                    })
                    .select()
                    .single();

                if (dbError) {
                    log(`DB Insert failed: ${dbError.message}`);
                    errors.push({ photo: photo.id, error: dbError.message });
                } else {
                    uploadedProducts.push({ ...productData, id: product.id, imageUrl });
                    log(`Created product: ${productData.name}`);
                }
            } catch (photoError) {
                log(`Error processing photo ${photo.id}: ${photoError.message}`);
                errors.push({ photo: photo.id, error: photoError.message });
            }
        }

        // 5. Generate CSV for reference
        const csvRows = ['image_url,name,description,category,price,tags'];
        uploadedProducts.forEach(p => {
            const tags = Array.isArray(p.tags) ? p.tags.join(';') : '';
            csvRows.push(`${p.imageUrl},"${p.name}","${p.description}",${p.category},${p.suggestedPrice},"${tags}"`);
        });

        return res.status(200).json({
            message: `Successfully processed ${uploadedProducts.length} photos.`,
            productsCreated: uploadedProducts.length,
            aiUsed: false,
            products: uploadedProducts,
            csv: csvRows.join('\n'),
            logs,
            errors: errors.length > 0 ? errors : undefined,
            projectRef, // Diagnostic info
        });
    } catch (error) {
        log(`Fatal Error: ${error.message}`);
        return res.status(500).json({ error: error.message, logs });
    }
}

// Smart Fallback Generation (Rule‑Based)
function generateFallbackProduct(filename, albumName, imageUrl) {
    const hints = extractHints(filename, albumName);
    return {
        name: generateProductName(hints),
        description: generateDescription(hints, albumName),
        category: categorizeProduct(hints),
        suggestedPrice: estimatePrice(hints),
        tags: hints.slice(0, 5),
    };
}

function extractHints(filename = '', albumName = '') {
    const hints = [];
    const text = `${filename} ${albumName}`.toLowerCase();
    const keywords = {
        clothing: ['dress', 'shirt', 'pants', 'skirt', 'jacket', 'coat', 'top', 'blouse', 'jeans', 'sweater', 'hoodie', 'tshirt'],
        accessories: ['bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry', 'necklace', 'bracelet', 'earring', 'watch'],
        colors: ['red', 'blue', 'black', 'white', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'beige'],
        styles: ['casual', 'formal', 'elegant', 'vintage', 'modern', 'classic', 'trendy', 'chic', 'bohemian'],
    };
    Object.values(keywords).flat().forEach(keyword => {
        if (text.includes(keyword)) hints.push(keyword);
    });
    return hints.length > 0 ? hints : ['fashion', 'stylish', 'quality'];
}

function categorizeProduct(hints) {
    const clothingKeywords = ['dress', 'shirt', 'pants', 'skirt', 'jacket', 'top', 'blouse', 'jeans', 'sweater'];
    return hints.some(h => clothingKeywords.includes(h.toLowerCase())) ? 'Clothing' : 'Accessories';
}

function generateProductName(hints) {
    const adjectives = ['Elegant', 'Stylish', 'Classic', 'Modern', 'Chic', 'Trendy', 'Premium', 'Luxury'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const item = hints[0] || 'Fashion Item';
    return `${adj} ${item.charAt(0).toUpperCase() + item.slice(1)}`;
}

function generateDescription(hints, albumName) {
    const category = categorizeProduct(hints);
    const style = hints.slice(0, 3).join(', ') || 'stylish';
    const collection = albumName ? ` From our ${albumName} collection.` : '';
    return `Beautiful ${category.toLowerCase()} piece featuring ${style} design. Perfect for any occasion. High-quality materials and excellent craftsmanship.${collection}`.trim();
}

function estimatePrice(hints) {
    const category = categorizeProduct(hints);
    const base = category === 'Clothing' ? 45 : 25;
    return base + Math.floor(Math.random() * 30);
}
