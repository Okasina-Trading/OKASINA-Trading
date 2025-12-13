import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Init Supabase Admin
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Service Role Key for Admin write access, fall back to Anon (which won't work for RLS protected tables usually, but we try)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const accessToken = req.body.accessToken || process.env.FACEBOOK_ACCESS_TOKEN;
        const { albumId, createProducts } = req.body;

        if (!accessToken) {
            return res.status(500).json({ error: 'Configuration Error: Missing FACEBOOK_ACCESS_TOKEN' });
        }
        if (!albumId) {
            return res.status(400).json({ error: 'Missing albumId' });
        }

        // 1. Fetch Photos
        const photosResp = await axios.get(`https://graph.facebook.com/v18.0/${albumId}/photos`, {
            params: { access_token: accessToken, fields: 'id,source,name,created_time', limit: 50 }
        });

        const photos = photosResp.data.data;
        const createdProducts = [];
        let failureCount = 0;

        // 2. Process Photos
        for (const photo of photos) {
            try {
                let imageUrl = photo.source;

                if (createProducts) {
                    const { data, error } = await supabaseAdmin.from('products').insert([{
                        name: photo.name ? (photo.name.length > 50 ? photo.name.substring(0, 47) + '...' : photo.name) : 'Imported Item',
                        description: photo.name || 'Imported from Facebook',
                        image_url: imageUrl,
                        price: 0,
                        stock_qty: 1,
                        category: 'New Arrivals',
                        status: 'draft'
                    }]).select().single();

                    if (error) throw error;
                    if (data) createdProducts.push(data);
                }
            } catch (e) {
                console.error('Save error for photo:', e.message);
                failureCount++;
            }
        }

        res.status(200).json({ success: true, productsCreated: createdProducts.length, failures: failureCount });

    } catch (error) {
        console.error('FB Import Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Import failed', details: error.response?.data?.error?.message || error.message });
    }
}
