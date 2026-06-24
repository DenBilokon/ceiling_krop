const {
  clearSessionCookie,
  createSessionCookie,
  isAuthenticated,
  json,
  parseJson,
  requiredEnv,
} = require("./shared");

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return json(200, { ok: true, authenticated: isAuthenticated(event) });
  }

  if (event.httpMethod === "DELETE") {
    return json(200, { ok: true }, { "Set-Cookie": clearSessionCookie() });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  try {
    const payload = parseJson(event);
    if (String(payload.password || "") !== requiredEnv("ADMIN_PASSWORD")) {
      return json(403, { ok: false, error: "Wrong password" });
    }

    return json(200, { ok: true }, { "Set-Cookie": createSessionCookie() });
  } catch (error) {
    return json(500, { ok: false, error: error.message });
  }
};

