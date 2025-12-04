import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { FB_PAGE_ID, FB_ACCESS_TOKEN, FB_APP_SECRET, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;

    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN || !VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
        return res.status(500).json({ error: 'Missing env vars' });
    }

    const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
    const appSecretProof = FB_APP_SECRET ? crypto.createHmac('sha256', FB_APP_SECRET).update(FB_ACCESS_TOKEN).digest('hex') : null;

    try {
        const comments = [];
        const reviews = [];

        // 1. Fetch Facebook Page Posts with Comments
        const postsUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/posts?fields=id,message,created_time,comments{message,from,created_time}&limit=50&access_token=${FB_ACCESS_TOKEN}${appSecretProof ? `&appsecret_proof=${appSecretProof}` : ''}`;
        const postsRes = await fetch(postsUrl);
        const postsData = await postsRes.json();

        if (!postsData.error && postsData.data) {
            postsData.data.forEach(post => {
                if (post.comments && post.comments.data) {
                    post.comments.data.forEach(comment => {
                        comments.push({
                            platform: 'facebook',
                            author: comment.from?.name || 'Anonymous',
                            message: comment.message,
                            created_at: comment.created_time,
                            post_id: post.id
                        });
                    });
                }
            });
        }

        // 2. Fetch Facebook Page Reviews (if available)
        const ratingsUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/ratings?fields=reviewer{name},review_text,rating,created_time&limit=50&access_token=${FB_ACCESS_TOKEN}${appSecretProof ? `&appsecret_proof=${appSecretProof}` : ''}`;
        const ratingsRes = await fetch(ratingsUrl);
        const ratingsData = await ratingsRes.json();

        if (!ratingsData.error && ratingsData.data) {
            ratingsData.data.forEach(rating => {
                reviews.push({
                    platform: 'facebook',
                    author: rating.reviewer?.name || 'Anonymous',
                    message: rating.review_text || '',
                    rating: rating.rating,
                    created_at: rating.created_time
                });
            });
        }

        // 3. Check for Instagram and fetch comments
        const pageUrl = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}?fields=instagram_business_account&access_token=${FB_ACCESS_TOKEN}${appSecretProof ? `&appsecret_proof=${appSecretProof}` : ''}`;
        const pageRes = await fetch(pageUrl);
        const pageData = await pageRes.json();

        if (pageData.instagram_business_account) {
            const igId = pageData.instagram_business_account.id;

            // Fetch recent Instagram media with comments
            const igMediaUrl = `https://graph.facebook.com/v19.0/${igId}/media?fields=id,caption,comments{text,username,timestamp}&limit=50&access_token=${FB_ACCESS_TOKEN}${appSecretProof ? `&appsecret_proof=${appSecretProof}` : ''}`;
            const igMediaRes = await fetch(igMediaUrl);
            const igMediaData = await igMediaRes.json();

            if (!igMediaData.error && igMediaData.data) {
                igMediaData.data.forEach(media => {
                    if (media.comments && media.comments.data) {
                        media.comments.data.forEach(comment => {
                            comments.push({
                                platform: 'instagram',
                                author: comment.username || 'Anonymous',
                                message: comment.text,
                                created_at: comment.timestamp,
                                post_id: media.id
                            });
                        });
                    }
                });
            }
        }

        // 4. Store in Supabase (optional - for now just return)
        // You can uncomment this to save to database
        /*
        if (comments.length > 0) {
            await supabase.from('social_feedback').insert(
                comments.map(c => ({
                    ...c,
                    type: 'comment',
                    imported_at: new Date().toISOString()
                }))
            );
        }
        if (reviews.length > 0) {
            await supabase.from('social_feedback').insert(
                reviews.map(r => ({
                    ...r,
                    type: 'review',
                    imported_at: new Date().toISOString()
                }))
            );
        }
        */

        return res.status(200).json({
            comments: comments.slice(0, 100), // Limit to 100 most recent
            reviews: reviews.slice(0, 50),
            total: {
                comments: comments.length,
                reviews: reviews.length
            }
        });

    } catch (error) {
        console.error('Feedback import error:', error);
        return res.status(500).json({ error: error.message });
    }
}
