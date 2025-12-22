```javascript
// api/index.js
// Vercel Serverless Function Entry Point

let app;

try {
  // Lazy load server to prevent cold-start crashes
  const module = await import('../server.js');
  app = module.default;
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
```
