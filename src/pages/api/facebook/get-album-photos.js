import crypto from 'crypto';

export default async function handler(req, res) {
    // Ensure we always return JSON
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { FB_PAGE_ID, FB_ACCESS_TOKEN, FB_APP_SECRET } = process.env;

    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN || !FB_APP_SECRET) {
        return res.status(500).json({ error: 'Missing FB env vars in Vercel' });
    }

    const { albumId } = req.body;

    if (!albumId) {
        return res.status(400).json({ error: 'Missing albumId' });
    }

    // Generate appsecret_proof
    const appSecretProof = crypto
        .createHmac('sha256', FB_APP_SECRET)
        .update(FB_ACCESS_TOKEN)
        .digest('hex');

    // Fetch up to 100 photos at once (pagination can be added later if needed)
    const url = `https://graph.facebook.com/v19.0/${albumId}/photos?fields=id,name,images,created_time&limit=100&access_token=${FB_ACCESS_TOKEN}&appsecret_proof=${appSecretProof}`;

    try {
        const fbRes = await fetch(url);
        const data = await fbRes.json();

        if (data.error) {
            console.error('FB API Error:', data.error);
            // Handle token expiration specifically
            if (data.error.code === 190) {
                return res.status(401).json({ error: 'Facebook Token Expired. Please refresh in Vercel.' });
            }
            return res.status(400).json({ error: data.error.message });
        }

        const photos = (data.data || []).map(p => ({
            id: p.id,
            caption: p.name || '', // FB uses 'name' capability for caption
            // Get largest image (source)
            url: p.images?.[0]?.source,
            created_time: p.created_time
        })).filter(p => p.url); // Ensure URL exists

        return res.status(200).json({
            success: true,
            count: photos.length,
            photos
        });

    } catch (e) {
        console.error('Handler Crash:', e);
        return res.status(500).json({ error: 'Internal Server Error', details: e.message });
    }
}
