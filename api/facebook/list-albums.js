import axios from 'axios';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production security if needed
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const accessToken = req.query.accessToken || process.env.FACEBOOK_ACCESS_TOKEN;
        const pageId = req.query.pageId || process.env.FACEBOOK_PAGE_ID;

        if (!accessToken || !pageId) {
            return res.status(500).json({
                error: 'Configuration Error',
                message: 'Server missing FACEBOOK_ACCESS_TOKEN or FACEBOOK_PAGE_ID',
                details: 'Please add these to Vercel Environment Variables.'
            });
        }

        const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/albums`, {
            params: { access_token: accessToken, fields: 'id,name,count,cover_photo{source},created_time' }
        });

        res.status(200).json({ albums: response.data.data });
    } catch (error) {
        console.error('FB List Albums Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch albums', details: error.response?.data?.error?.message || error.message });
    }
}
