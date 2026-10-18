const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "site-data.json");
const PORT = 5500;

fs.mkdirSync(DATA_DIR, { recursive: true });

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {
      stats: {},
      news: {},
      races: [],
      gallery: [],
      partners: []
    };
  }
}

function writeData(data) {
  const temporary = DATA_FILE + ".tmp";
  fs.writeFileSync(temporary, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temporary, DATA_FILE);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(JSON.stringify(payload));
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".ico": "image/x-icon"
  };

  return types[ext] || "application/octet-stream";
}

function safePath(requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const normalized = path.normalize(decoded).replace(/^(\.\.[\/\\])+/, "");
  return path.join(ROOT, normalized);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    return res.end();
  }

  if (parsed.pathname === "/api/site-data" && req.method === "GET") {
    return sendJson(res, 200, readData());
  }

  if (parsed.pathname === "/api/site-data" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();

      if (body.length > 25 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        writeData(data);
        sendJson(res, 200, {
          success: true,
          message: "Données enregistrées"
        });
      } catch {
        sendJson(res, 400, {
          success: false,
          message: "Données invalides"
        });
      }
    });

    return;
  }

  let requested = parsed.pathname === "/" ? "/index.html" : parsed.pathname;
  const filePath = safePath(requested);

  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
    return sendJson(res, 404, {
      error: "Fichier introuvable"
    });
  }

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType(filePath),
      "Cache-Control": "no-store"
    });
    res.end(content);
  } catch {
    sendJson(res, 500, {
      error: "Erreur de lecture"
    });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("Serveur Gems Racing actif");
  console.log("Site : http://127.0.0.1:" + PORT);
  console.log("Intranet : http://127.0.0.1:" + PORT + "/intranet.html");
  console.log("");
});