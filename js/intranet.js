(function () {
  "use strict";
  const AUTH_KEY = "gems_auth_v2";
  const PASSWORD = "GemsRacing88";
  window.gemsData = { stats: {}, news: {}, gallery: [], races: [], partners: [] };
  let editingNewsIndex = null;
  let editingRaceIndex = null;
  let editingPartnerIndex = null;

  function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
  function value(id) { return document.getElementById(id)?.value.trim() || ""; }
  function setValue(id, content) { const element = document.getElementById(id); if (element) element.value = content ?? ""; }
  function toast(message) { const element = document.getElementById("toast"); if (!element) return; element.textContent = message; element.style.display = "block"; setTimeout(() => element.style.display = "none", 3000); }
  function normalizeData(data) { return { stats: data?.stats || {}, news: data?.news || {}, gallery: Array.isArray(data?.gallery) ? data.gallery : [], races: Array.isArray(data?.races) ? data.races : [], partners: Array.isArray(data?.partners) ? data.partners : [] }; }
  async function readImage(file) { return new Promise((resolve, reject) => { if (!file) { resolve(""); return; } if (!file.type.startsWith("image/")) { reject(new Error("Image invalide")); return; } const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); }); }

  async function loadData() { try { const response = await fetch("/api/data", { cache: "no-store" }); if (response.ok) { window.gemsData = normalizeData(await response.json()); renderAll(); } } catch (error) { console.error(error); } }
  async function saveData() { try { await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": sessionStorage.getItem("gems_admin_token") || "" }, body: JSON.stringify(window.gemsData) }); toast("✅ Enregistré !"); } catch (error) { toast("❌ Erreur sauvegarde"); } }

  window.setAdminToken = function () {
  const token = prompt("Token administrateur Vercel :");
  if (token) {
    sessionStorage.setItem("gems_admin_token", token);
    alert("Token enregistré pour cette session.");
  }
};
window.checkPass = function () { if (value("pass-input") === PASSWORD) { sessionStorage.setItem(AUTH_KEY, "true"); document.getElementById("login-overlay").style.display = "none"; document.body.classList.remove("is-locked"); } else { alert("Mot de passe incorrect."); } };
  window.logoutIntranet = function () { sessionStorage.removeItem(AUTH_KEY); window.location.reload(); };
  window.showTab = function (name, item) { document.querySelectorAll(".tab-content").forEach(tab => tab.hidden = true); document.querySelectorAll(".intra-nav-item").forEach(nav => nav.classList.remove("active")); document.getElementById("tab-" + name).hidden = false; item.classList.add("active"); };

  function collectForms() {
    window.gemsData.stats = { victoires: value("stat-victoires"), podiums: value("stat-podiums"), sws: value("stat-sws"), age: value("stat-age") };
    window.gemsData.news = { title: value("news-title"), summary: value("news-summary"), link: value("news-link"), button: value("news-button") };
  }

  window.renderNews = function () { const list = document.getElementById("news-list-admin"); if (!list) return; const news = window.gemsData.news; list.innerHTML = news.title ? `<div class="list-item"><strong>${escapeHtml(news.title)}</strong><button class="btn-danger" onclick="window.deleteNews()">🗑</button></div>` : "<p>Aucune actu.</p>"; };
  window.addNews = async function () { collectForms(); await saveData(); renderAll(); };
  window.deleteNews = async function () { window.gemsData.news = {}; await saveData(); renderAll(); };

  window.renderGallery = function () { const grid = document.getElementById("gallery-grid"); if (!grid) return; grid.innerHTML = window.gemsData.gallery.map((p, i) => `<div class="photo-admin-card"><img src="${p.image}" style="width:100%; transform:rotate(${p.rotation||0}deg)"><button onclick="window.rotateGallery(${i},90)">↻</button><button onclick="window.deleteGallery(${i})">🗑</button></div>`).join(""); };
  window.rotateGallery = async function (i, d) { window.gemsData.gallery[i].rotation = (window.gemsData.gallery[i].rotation || 0) + d; renderAll(); await saveData(); };
  window.deleteGallery = async function (i) { window.gemsData.gallery.splice(i, 1); renderAll(); await saveData(); };
  window.addGalleryPhoto = async function () { const input = document.getElementById("gallery-file"); if(input.files[0]) { const img = await readImage(input.files[0]); window.gemsData.gallery.unshift({image: img, rotation: 0}); renderAll(); await saveData(); } };

  window.renderRaces = function () { const list = document.getElementById("races-list"); if (!list) return; list.innerHTML = window.gemsData.races.map((r, i) => `<div class="list-item"><strong>${escapeHtml(r.name)}</strong><button onclick="window.deleteRace(${i})">🗑</button></div>`).join(""); };
  window.addRace = async function () { window.gemsData.races.push({name: value("race-name")}); renderAll(); await saveData(); };
  window.deleteRace = async function (i) { window.gemsData.races.splice(i, 1); renderAll(); await saveData(); };

  window.renderPartners = function () { const list = document.getElementById("partners-list"); if (!list) return; list.innerHTML = window.gemsData.partners.map((p, i) => `<div class="list-item"><strong>${escapeHtml(p.name)}</strong><button onclick="window.deletePartner(${i})">🗑</button></div>`).join(""); };
  window.addPartner = async function () { window.gemsData.partners.push({name: value("partner-name")}); renderAll(); await saveData(); };
  window.deletePartner = async function (i) { window.gemsData.partners.splice(i, 1); renderAll(); await saveData(); };

  function renderAll() { loadForms(); window.renderNews(); window.renderGallery(); window.renderRaces(); window.renderPartners(); }
  window.saveAllData = async function () { collectForms(); await saveData(); };
  document.addEventListener("DOMContentLoaded", async () => { await loadData(); renderAll(); });
})();


