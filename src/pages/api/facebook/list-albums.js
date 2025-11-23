import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { FB_PAGE_ID, FB_ACCESS_TOKEN } = process.env;
    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Missing FB env vars' });
    }

    const url = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/albums?fields=id,name,count,cover_photo{picture}&access_token=${FB_ACCESS_TOKEN}`;

    try {
        const fbRes = await fetch(url);
        const data = await fbRes.json();
        if (data.error) {
            return res.status(400).json({ error: data.error.message });
        }
        const albums = data.data.map(a => ({
            id: a.id,
            name: a.name,
            count: a.count,
            coverUrl: a.cover_photo?.picture?.data?.url || null,
        }));
        return res.status(200).json({ albums });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Failed to fetch albums' });
    }
}
