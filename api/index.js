// api/index.js
// Vercel Serverless Function Entry Point
// DIAGNOSTIC_MODE: Minimal Health Check
// Updated: 2025-12-22T18:50:00

export default (req, res) => {
    const { name = 'World' } = req.query;
    res.status(200).json({
        status: 'Alive',
        message: `Hello ${name}!`,
        env_check: {
            node: process.version,
            vercel: !!process.env.VERCEL,
            has_google_key: !!(process.env.GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY)
        },
        timestamp: new Date().toISOString()
    });
};
