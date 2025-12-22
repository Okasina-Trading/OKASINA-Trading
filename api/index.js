// api/index.js
// Vercel Serverless Function Entry Point

let app;

try {
    console.log("Attempting to import server.js...");
    const module = await import('../server.js');
    app = module.default;
    console.log("server.js imported successfully.");
} catch (err) {
    console.error("FATAL: Failed to import server.js", err);
    // Fallback app if server crashes
    app = (req, res) => {
        res.status(500).json({
            error: "Server Init Failed",
            details: err.message,
            stack: err.stack
        });
    };
}

export default app;
