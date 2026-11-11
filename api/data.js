const BIN_ID = process.env.JSONBIN_ID;
const JSONBIN_KEY = process.env.JSONBIN_KEY;
const auth = require("./auth");

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(data));
}

async function callJsonBin(method, body) {
  const url = method === "GET"
    ? "https://api.jsonbin.io/v3/b/" + BIN_ID + "/latest"
    : "https://api.jsonbin.io/v3/b/" + BIN_ID;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_KEY
    }
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || ("Erreur JSONBin " + response.status));
  }
  return json;
}

function getNewsArchive(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.newsArchive)) return data.newsArchive;
  if (Array.isArray(data.newsArchives)) return data.newsArchives;
  return [];
}

function preserveNewsArchive(currentData, incomingData) {
  const archives = [
    ...getNewsArchive(incomingData),
    ...getNewsArchive(currentData)
  ];
  const seen = new Set();
  const mergedArchives = [];

  for (const article of archives) {
    if (!article || typeof article !== "object" || Array.isArray(article)) continue;
    const signature = JSON.stringify(article);
    if (seen.has(signature)) continue;
    seen.add(signature);
    mergedArchives.push(article);
  }

  const currentNews = currentData && currentData.news;
  const nextNews = incomingData && incomingData.news;
  const currentTitle = currentNews && typeof currentNews.title === "string"
    ? currentNews.title.trim()
    : "";
  const nextTitle = nextNews && typeof nextNews.title === "string"
    ? nextNews.title.trim()
    : "";

  if (currentTitle && nextTitle && currentTitle !== nextTitle &&
      currentNews && typeof currentNews === "object" && !Array.isArray(currentNews)) {
    const currentSignature = JSON.stringify(currentNews);
    incomingData.newsArchive = [
      currentNews,
      ...mergedArchives.filter(article => JSON.stringify(article) !== currentSignature)
    ];
  } else {
    incomingData.newsArchive = mergedArchives;
  }

  delete incomingData.newsArchives;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") { reply(res, 204, {}); return; }
  try {
    const data = await callJsonBin("GET");
    const db = data.record || data;

    if (req.method === "GET") {
      reply(res, 200, db);
    } else if (req.method === "POST") {
      if (!auth.isAuthenticated(req)) {
        reply(res, 401, { error: "Unauthorized" });
        return;
      }
      let newBody = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!newBody || typeof newBody !== "object" || Array.isArray(newBody)) {
        reply(res, 400, { error: "Invalid data" });
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(newBody, "news") && db.news) {
        newBody.news = db.news;
      }
      preserveNewsArchive(db, newBody);
      await callJsonBin("PUT", newBody);
      reply(res, 200, { success: true });
    }
  } catch (e) {
    reply(res, 500, { error: e.message });
  }
};
