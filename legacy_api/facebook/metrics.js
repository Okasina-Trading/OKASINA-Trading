import crypto from 'crypto';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { FB_PAGE_ID, FB_ACCESS_TOKEN, FB_APP_SECRET } = process.env;

    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
        return res.status(500).json({ error: 'Missing FB env vars' });
    }

    const appSecretProof = FB_APP_SECRET ?
        crypto.createHmac('sha256', FB_APP_SECRET).update(FB_ACCESS_TOKEN).digest('hex') : null;

    try {
        const metrics = {
            facebook: {},
            instagram: {},
            timestamp: new Date().toISOString()
        };

        // 1. Fetch Facebook Page Insights (Periodic)
        // page_fans is lifetime, so we fetch it separately or just use page_impressions etc.
        const periodicUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/insights?metric=page_impressions,page_post_engagements,page_views_total&period=days_28&access_token=${FB_ACCESS_TOKEN}`;
        const periodicRes = await fetch(periodicUrl);
        const periodicData = await periodicRes.json();

        // 2. Fetch Page Fans (Lifetime)
        const fansUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/insights?metric=page_fans&period=lifetime&access_token=${FB_ACCESS_TOKEN}`;
        const fansRes = await fetch(fansUrl);
        const fansData = await fansRes.json();

        const getMetric = (data, name) => {
            if (!data || data.error || !data.data) return 0;
            const metric = data.data.find(m => m.name === name);
            if (metric && metric.values && metric.values.length > 0) {
                return metric.values[metric.values.length - 1].value;
            }
            return 0;
        };

        metrics.facebook = {
            impressions: getMetric(periodicData, 'page_impressions'),
            engagement: getMetric(periodicData, 'page_post_engagements'),
            views: getMetric(periodicData, 'page_views_total'),
            followers: getMetric(fansData, 'page_fans')
        };

        // 3. Check for Instagram and fetch insights
        const pageUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}?fields=instagram_business_account&access_token=${FB_ACCESS_TOKEN}`;
        const pageRes = await fetch(pageUrl);
        const pageData = await pageRes.json();

        if (pageData.instagram_business_account) {
            const igId = pageData.instagram_business_account.id;
            metrics.instagram.connected = true;
            metrics.instagram.accountId = igId;

            // Fetch Instagram insights
            // IG metrics: impressions, reach (periodic), follower_count (lifetime?)
            // Actually follower_count is a field on the user object, not an insight metric usually.
            // But let's try fetching it as a field first.

            const igUserUrl = `https://graph.facebook.com/v19.0/${igId}?fields=followers_count&access_token=${FB_ACCESS_TOKEN}`;
            const igUserRes = await fetch(igUserUrl);
            const igUserData = await igUserRes.json();

            const igInsightsUrl = `https://graph.facebook.com/v19.0/${igId}/insights?metric=impressions,reach&period=days_28&access_token=${FB_ACCESS_TOKEN}`;
            const igInsightsRes = await fetch(igInsightsUrl);
            const igInsightsData = await igInsightsRes.json();

            metrics.instagram.impressions = getMetric(igInsightsData, 'impressions');
            metrics.instagram.reach = getMetric(igInsightsData, 'reach');
            metrics.instagram.followers = igUserData.followers_count || 0;

        } else {
            metrics.instagram.connected = false;
        }

        return res.status(200).json(metrics);

    } catch (error) {
        console.error('Metrics error:', error);
        return res.status(500).json({ error: error.message });
    }
}
