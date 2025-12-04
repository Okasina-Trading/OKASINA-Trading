import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageUrl, rawDetails } = req.body;
        console.log('➡️ [Vision Agent] Request received (Serverless)');

        let productData;

        try {
            // NOTE: On Vercel, this local script path will NOT exist.
            // This try block will fail, and we will gracefully fall back to the "Draft" product.
            // To make this work in production, you would replace this with an OpenAI API call.
            const prompt = `Generate a JSON product object for a fashion store based on this description: "${rawDetails}". 
        The image URL is: "${imageUrl}".
        Return ONLY valid JSON.`;

            console.log('🤖 [Vision Agent] Attempting local JARVIS script...');
            const { stdout } = await execAsync(
                `python F:\\Dev\\Jarvis\\jarvis.py "${prompt.replace(/"/g, '\\"')}"`,
                { timeout: 10000 } // Short timeout for cloud
            );

            const jsonMatch = stdout.match(/\{[\s\S]*\}/);
            productData = JSON.parse(jsonMatch ? jsonMatch[0] : stdout);

        } catch (execError) {
            console.warn('⚠️ [Vision Agent] Local AI unavailable (expected in cloud), using fallback.');

            // Fallback Product Generation (Cloud Mode)
            productData = {
                name: "New Fashion Item",
                description: `<p><strong>Automated Description:</strong><br>${rawDetails}</p><p><em>(AI generation unavailable in cloud mode - please edit details manually)</em></p>`,
                price: 0,
                category: "Clothing",
                tags: ["Draft", "Needs-Review"],
                stock_qty: 10,
                status: "draft"
            };
        }

        // Add the image URL to the product data
        productData.image_url = imageUrl;

        res.status(200).json({
            success: true,
            product: productData,
            message: 'Vision Agent generated product successfully (Cloud Fallback Active)'
        });

    } catch (error) {
        console.error('❌ [Vision Agent] Critical Error:', error);
        res.status(500).json({ error: error.message });
    }
}
