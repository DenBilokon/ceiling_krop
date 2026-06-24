const { isAuthenticated, json, parseJson, supabaseHeaders, supabaseUrl } = require("./shared");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const response = await fetch(
        supabaseUrl("/rest/v1/site_content?id=eq.main&select=content&limit=1"),
        { headers: supabaseHeaders(null) }
      );

      if (!response.ok) return json(502, { ok: false, error: await response.text() });
      const rows = await response.json();
      return json(200, { ok: true, content: rows[0]?.content || null });
    }

    if (event.httpMethod === "POST") {
      if (!isAuthenticated(event)) {
        return json(401, { ok: false, error: "Unauthorized" });
      }

      const payload = parseJson(event);
      if (!payload.content || typeof payload.content !== "object" || Array.isArray(payload.content)) {
        return json(400, { ok: false, error: "Content must be an object" });
      }

      const response = await fetch(supabaseUrl("/rest/v1/site_content"), {
        method: "POST",
        headers: {
          ...supabaseHeaders(),
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          id: "main",
          content: payload.content,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) return json(502, { ok: false, error: await response.text() });
      return json(200, { ok: true });
    }

    return json(405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};

