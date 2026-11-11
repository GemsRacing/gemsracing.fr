const auth = require("./auth");

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    reply(res, 204, {});
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    reply(res, 405, { error: "Methode non autorisee" });
    return;
  }

  try {
    if (!auth.isAuthenticated(req)) {
      reply(res, 401, { error: "Non autorise" });
      return;
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      reply(res, 500, { error: "Configuration ImgBB absente sur le serveur" });
      return;
    }

    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (_) { body = null; }
    }

    const image = body && body.image;
    if (typeof image !== "string" || image.length > 4000000) {
      reply(res, 400, { error: "Image absente ou trop volumineuse" });
      return;
    }

    const match = image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
    if (!match) {
      reply(res, 400, { error: "Format d image invalide" });
      return;
    }

    const form = new FormData();
    form.append("image", match[2]);

    const url = new URL("https://api.imgbb.com/1/upload");
    url.searchParams.set("key", apiKey);

    const upstream = await fetch(url, { method: "POST", body: form });
    let result = {};
    try { result = await upstream.json(); } catch (_) {}

    if (!upstream.ok || !result.success || !result.data || !result.data.url) {
      const message = result.error && result.error.message
        ? result.error.message
        : "ImgBB n a pas accepte l image";
      reply(res, 502, { error: message });
      return;
    }

    reply(res, 200, {
      success: true,
      data: { url: result.data.url }
    });
  } catch (_) {
    reply(res, 500, { error: "Erreur serveur pendant l upload" });
  }
};