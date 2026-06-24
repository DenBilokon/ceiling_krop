const { json, parseJson, supabaseHeaders, supabaseUrl } = require("./shared");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  try {
    const payload = parseJson(event);
    const name = String(payload.name || "").trim();
    const phone = String(payload.phone || "").trim();
    const message = String(payload.message || "").trim();

    if (!name || !phone) {
      return json(400, { ok: false, error: "Name and phone are required" });
    }

    const response = await fetch(supabaseUrl("/rest/v1/leads"), {
      method: "POST",
      headers: {
        ...supabaseHeaders(),
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ name, phone, message }),
    });

    if (!response.ok) {
      return json(502, { ok: false, error: await response.text() });
    }

    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};

