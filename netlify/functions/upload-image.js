const {
  isAuthenticated,
  json,
  parseJson,
  requiredEnv,
  sanitizeFileName,
  supabaseHeaders,
  supabaseUrl,
} = require("./shared");

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

exports.handler = async (event) => {
  if (!isAuthenticated(event)) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  try {
    const payload = parseJson(event);
    const contentType = String(payload.contentType || "").toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      return json(400, { ok: false, error: "Only JPG, PNG and WebP images are allowed" });
    }

    const raw = String(payload.data || "");
    const base64 = raw.includes(",") ? raw.split(",", 2)[1] : raw;
    const bytes = Buffer.from(base64, "base64");
    if (!bytes.length || bytes.length > MAX_BYTES) {
      return json(400, { ok: false, error: "Image must be between 1 byte and 10 MB" });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "work-images";
    const safeName = sanitizeFileName(payload.fileName);
    const path = `works/${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}`;

    const response = await fetch(supabaseUrl(`/storage/v1/object/${bucket}/${path}`), {
      method: "POST",
      headers: {
        ...supabaseHeaders(contentType),
        "x-upsert": "false",
      },
      body: bytes,
    });

    if (!response.ok) return json(502, { ok: false, error: await response.text() });

    const publicUrl = `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
    return json(200, { ok: true, url: publicUrl, path });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};

