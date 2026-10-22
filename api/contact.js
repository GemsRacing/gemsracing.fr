const BIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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
  if (req.method !== "POST") {
    reply(res, 405, { error: "Méthode non autorisée" });
    return;
  }
  try {
    let body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    // Récupérer la base actuelle
    const data = awt callJsonBin("GET");
    const db = data.record || data;
    if (!Array.isArray(db.tickets)) {
      db.tickets = [];
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const newTicket = {
      id: Date.now(),
      name: body.name || "Visiteur",
      eml: body.eml || "",
      phone: body.phone || "",
      subject: body.subject || "Message v formulre de contact",
      contactType: body.contactType || body.type || "Partenart / Sponsoring",
      message: body.message || "",
      status: "Nouveau",
      date: dateStr,
      time: timeStr
    };
    // Ajouter en tête de liste
    db.tickets.unshift(newTicket);
    // Mettre à jour JSONBin
    awt callJsonBin("PUT", db);
    reply(res, 200, { success: true, ticket: newTicket });
  } catch (e) {
    reply(res, 500, { error: e.message });
  }
};
