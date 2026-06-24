const crypto = require("crypto");

const COOKIE_NAME = "ceiling_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24;

function json(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function supabaseServerKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!value) {
    throw new Error("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
  }
  return value;
}

function supabaseHeaders(contentType = "application/json") {
  const key = supabaseServerKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

function supabaseUrl(path) {
  return `${requiredEnv("SUPABASE_URL").replace(/\/$/, "")}${path}`;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sessionSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || supabaseServerKey();
}

function sign(value) {
  return base64url(crypto.createHmac("sha256", sessionSecret()).update(value).digest());
}

function createSessionCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function getCookie(event, name) {
  const header = event.headers.cookie || event.headers.Cookie || "";
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function isAuthenticated(event) {
  const token = getCookie(event, COOKIE_NAME);
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expiresAt, nonce, signature] = parts;
  const payload = `${expiresAt}.${nonce}`;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return false;
  return Number(expiresAt) > Math.floor(Date.now() / 1000);
}

function parseJson(event) {
  if (!event.body) return {};
  const body = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  return JSON.parse(body);
}

function sanitizeFileName(name) {
  return String(name || "image")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 90);
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  isAuthenticated,
  json,
  parseJson,
  requiredEnv,
  sanitizeFileName,
  supabaseHeaders,
  supabaseUrl,
};
