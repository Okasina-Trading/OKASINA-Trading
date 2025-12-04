import { supabase } from '../../src/supabase';
import crypto from 'crypto';

// 👉 Add your Facebook App Secret as a Vercel environment variable named FB_APP_SECRET
const FB_APP_SECRET = process.env.FB_APP_SECRET;

/**
 * Verify the signed_request sent by Facebook.
 * Returns the decoded payload if valid, otherwise null.
 */
function verifySignedRequest(signedRequest) {
    if (!signedRequest) return null;
    const [encodedSig, encodedPayload] = signedRequest.split('.');
    if (!encodedSig || !encodedPayload) return null;

    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const payload = Buffer.from(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

    const expectedSig = crypto.createHmac('sha256', FB_APP_SECRET).update(encodedPayload).digest();
    if (!crypto.timingSafeEqual(sig, expectedSig)) return null;

    try {
        return JSON.parse(payload);
    } catch (e) {
        return null;
    }
}

/**
 * Vercel API route – Facebook Data Deletion Callback
 * URL: https://your-domain.com/api/facebook/data-deletion
 */
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { user_id, signed_request } = req.query;

    // Verify the signed request first
    const payload = verifySignedRequest(signed_request);
    if (!payload) {
        return res.status(400).json({ error: 'Invalid signed_request' });
    }

    // Look up the user by the stored Facebook UID (fb_uid column)
    const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('id, email')
        .eq('fb_uid', user_id)
        .single();

    if (fetchError || !user) {
        // Facebook expects a 200 even if the user does not exist
        return res.status(200).json({ status: 'User not found – nothing to delete' });
    }

    // Delete the user record (and any related data you need)
    const { error: delError } = await supabase.from('users').delete().eq('id', user.id);

    if (delError) {
        return res.status(500).json({ error: 'Failed to delete user data' });
    }

    // Respond with the format Facebook expects
    return res.status(200).json({
        url: `https://okasinatrading.com/data-deletion-confirmation?email=${encodeURIComponent(user.email)}`,
        status: 'User data deleted',
    });
}
