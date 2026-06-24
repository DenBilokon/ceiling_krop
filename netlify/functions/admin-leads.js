const { isAuthenticated, json, supabaseHeaders, supabaseUrl } = require("./shared");

exports.handler = async (event) => {
  if (!isAuthenticated(event)) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  try {
    if (event.httpMethod === "GET") {
      const response = await fetch(
        supabaseUrl("/rest/v1/leads?select=id,name,phone,message,created_at&order=id.desc"),
        { headers: supabaseHeaders(null) }
      );

      if (!response.ok) return json(502, { ok: false, error: await response.text() });
      return json(200, { ok: true, leads: await response.json() });
    }

    if (event.httpMethod === "DELETE") {
      const id = event.queryStringParameters?.id;
      if (!id || !/^\d+$/.test(id)) return json(400, { ok: false, error: "Bad lead id" });

      const response = await fetch(supabaseUrl(`/rest/v1/leads?id=eq.${id}`), {
        method: "DELETE",
        headers: {
          ...supabaseHeaders(null),
          Prefer: "return=minimal",
        },
      });

      if (!response.ok) return json(502, { ok: false, error: await response.text() });
      return json(200, { ok: true });
    }

    return json(405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};

