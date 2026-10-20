const BIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.end(JSON.stringify(data));
}

async function callJsonBin(method, body) {
  const url = method === "GET"
    ? `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`
    : `https://api.jsonbin.io/v3/b/${BIN_ID}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_KEY
    }
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    reply(res, 204, {});
    return;
  }

  if (!BIN_ID || !JSONBIN_KEY) {
    reply(res, 500, { error: "Variables JSONBin manquantes." });
    return;
  }

  try {
    if (req.method === "GET") {
      const result = await callJsonBin("GET");
      reply(res, 200, result.record || result);
      return;
    }

    if (req.method === "POST") {
      if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
        reply(res, 401, { error: "Accès administrateur refusé." });
        return;
      }

      let body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(body);
      }

      const result = await callJsonBin("PUT", body);
      reply(res, 200, result.record || result);
      return;
    }

    reply(res, 405, { error: "Méthode non autorisée." });
  } catch (error) {
    console.error(error);
    reply(res, 500, { error: "Erreur de synchronisation." });
  }
};
