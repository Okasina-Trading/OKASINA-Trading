// api/debug/[mode].js
//
// Unified debug endpoint.
// - GET /api/debug/schema          -> infer columns from a sample row
// - GET /api/debug/product_sample  -> return one sample row from products
//
// This counts as ONE Serverless Function on Vercel (dynamic route).

function getEnv(nameList) {
  for (const name of nameList) {
    if (process.env[name]) return process.env[name];
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  // Dynamic route param: /api/debug/[mode]
  // e.g. /api/debug/schema          -> mode = "schema"
  //      /api/debug/product_sample  -> mode = "product_sample"
  let mode = req.query.mode;
  if (Array.isArray(mode)) mode = mode[0];
  if (!mode) mode = "schema";

  const supabaseUrl = getEnv([
    "OKASINA_SUPABASE_URL",
    "SUPABASE_URL",
    "VITE_SUPABASE_URL",
  ]);

  const supabaseKey = getEnv([
    "OKASINA_SUPABASE_SERVICE_KEY",
    "SUPABASE_SERVICE_KEY",
    "OKASINA_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
  ]);

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Missing Supabase environment variables",
      details:
        "Set OKASINA_SUPABASE_URL / OKASINA_SUPABASE_SERVICE_KEY or SUPABASE_URL / SUPABASE_ANON_KEY (and redeploy).",
    });
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };

  const productsUrl = `${supabaseUrl}/rest/v1/products?select=*&limit=1`;

  let rows;
  try {
    const response = await fetch(productsUrl, { headers });

    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // not JSON, fall through
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Supabase request failed",
        status: response.status,
        statusText: response.statusText,
        body: data ?? text,
      });
    }

    rows = Array.isArray(data) ? data : [];
  } catch (err) {
    return res.status(500).json({
      error: "Unexpected error talking to Supabase",
      details: err.message || String(err),
    });
  }

  const sampleRow = rows[0] || null;

  if (mode === "product_sample") {
    return res.status(200).json({
      ok: true,
      mode: "product_sample",
      count: rows.length,
      sample: sampleRow,
    });
  }

  if (mode === "schema") {
    if (!sampleRow) {
      return res.status(200).json({
        ok: true,
        mode: "schema",
        columns: [],
        note: "No rows found in products; cannot infer schema from sample.",
      });
    }

    const columns = Object.entries(sampleRow).map(([name, value]) => ({
      name,
      jsType: value === null ? "null" : typeof value,
      example: value,
    }));

    return res.status(200).json({
      ok: true,
      mode: "schema",
      columns,
      note:
        "Schema inferred from one sample row in products. For full Postgres types, use Supabase dashboard or a SQL function.",
    });
  }

  return res.status(400).json({
    error: "Unknown mode",
    allowedModes: ["schema", "product_sample"],
  });
}
