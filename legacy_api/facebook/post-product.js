import crypto from 'crypto';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { productName, productDescription, productImage, productUrl } = req.body;
    const { FB_PAGE_ID, FB_ACCESS_TOKEN, FB_APP_SECRET } = process.env;

    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Missing FB env vars' });
    }

    if (!productName || !productImage) {
        return res.status(400).json({ error: 'Missing product name or image' });
    }

    const appSecretProof = FB_APP_SECRET ?
        crypto.createHmac('sha256', FB_APP_SECRET).update(FB_ACCESS_TOKEN).digest('hex') : null;

    try {
        // Create post message
        const message = `🆕 New Product Alert!\n\n${productName}\n\n${productDescription || ''}\n\n${productUrl ? `Shop now: ${productUrl}` : ''}`.trim();

        // Post to Facebook Page
        const postUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/photos`;

        const formData = new URLSearchParams();
        formData.append('url', productImage);
        formData.append('message', message);
        formData.append('access_token', FB_ACCESS_TOKEN);
        if (appSecretProof) formData.append('appsecret_proof', appSecretProof);

        const fbRes = await fetch(postUrl, {
            method: 'POST',
            body: formData
        });

        const fbData = await fbRes.json();

        if (fbData.error) {
            throw new Error(`Facebook API Error: ${fbData.error.message}`);
        }

        return res.status(200).json({
            success: true,
            postId: fbData.id,
            message: 'Posted to Facebook successfully'
        });

    } catch (error) {
        console.error('Auto-post error:', error);
        return res.status(500).json({ error: error.message });
    }
}
