export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { FB_PAGE_ID, FB_ACCESS_TOKEN } = process.env;

    console.log('Env check:', {
        hasPageId: !!FB_PAGE_ID,
        hasToken: !!FB_ACCESS_TOKEN,
        pageId: FB_PAGE_ID
    });

    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
        return res.status(500).json({
            error: 'Missing FB env vars',
            has: {
                pageId: !!FB_PAGE_ID,
                token: !!FB_ACCESS_TOKEN
            }
        });
    }

    try {
        let albums = [];

        // 1. Fetch Facebook Albums (simple, no appsecret_proof)
        const fbUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/albums?fields=id,name,count,cover_photo{picture}&access_token=${FB_ACCESS_TOKEN}`;

        console.log('Fetching albums from:', fbUrl.replace(FB_ACCESS_TOKEN, 'TOKEN_HIDDEN'));

        const fbRes = await fetch(fbUrl);
        const fbData = await fbRes.json();

        console.log('FB Response:', fbData);

        if (fbData.error) {
            console.error('FB API Error:', fbData.error);
            return res.status(400).json({ error: fbData.error.message, fbError: fbData.error });
        }

        albums = (fbData.data || []).map(a => ({
            id: a.id,
            name: `[FB] ${a.name}`,
            count: a.count,
            coverUrl: a.cover_photo?.picture?.data?.url || null,
            source: 'facebook'
        }));

        console.log(`Found ${albums.length} Facebook albums`);

        // 2. Try to get Instagram (but don't fail if it errors)
        try {
            const pageUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}?fields=instagram_business_account&access_token=${FB_ACCESS_TOKEN}`;
            const pageRes = await fetch(pageUrl);
            const pageData = await pageRes.json();

            if (pageData.instagram_business_account && !pageData.error) {
                const igId = pageData.instagram_business_account.id;

                const igUrl = `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,media_type,media_url,thumbnail_url&limit=50&access_token=${FB_ACCESS_TOKEN}`;
                const igRes = await fetch(igUrl);
                const igData = await igRes.json();

                if (!igData.error && igData.data && igData.data.length > 0) {
                    const igMedia = igData.data.filter(m => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM');
                    const cover = igMedia[0]?.media_url || igMedia[0]?.thumbnail_url;

                    albums.push({
                        id: `ig-${igId}`,
                        name: '[IG] Instagram Feed',
                        count: igMedia.length,
                        coverUrl: cover || null,
                        source: 'instagram',
                        igAccountId: igId
                    });

                    console.log(`Found Instagram feed with ${igMedia.length} photos`);
                }
            }
        } catch (igError) {
            console.log('Instagram fetch failed (non-fatal):', igError.message);
            // Continue without Instagram
        }

        return res.status(200).json({ albums });

    } catch (e) {
        console.error('Handler Crash:', e);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: e.message,
            stack: e.stack
        });
    }
}
