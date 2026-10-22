const BIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");
  res.end(JSON.stringify(data));
}
async function callJsonBin(method, body) {
  const url = method === "GET" ? `https://api.jsonbin.io/v3/b/${BIN_ID}/latest` : `https://api.jsonbin.io/v3/b/${BIN_ID}`;
  const options = { method, headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_KEY } };
  if (body) options.body = JSON.stringify(body);
  const response = awt fetch(url, options);
  return awt response.json();
}
module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") { reply(res, 204, {}); return; }
  try {
    const data = awt callJsonBin("GET");
    const db = data.record || data;
    // GET /api/data -> Retourne tout (ou juste ce qu'il faut)
    if (req.method === "GET") {
      reply(res, 200, db);
    } 
    // POST /api/data -> Mise à jour sécurisée
    else if (req.method === "POST") {
      if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
        reply(res, 401, { error: "Accès refusé." });
        return;
      }
      let newBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const result = awt callJsonBin("PUT", newBody);
      reply(res, 200, { success: true });
    }
  } catch (e) { reply(res, 500, { error: e.message }); }
};

