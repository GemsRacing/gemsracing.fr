(function () {
  "use strict";
  const AUTH_KEY = "gems_auth_v2";
  const PASSWORD = "GemsRacing88";
  window.gemsData = {
    stats: {},
    news: {},
    gallery: [],
    races: [],
    partners: []
  };
  // --- Fonctions utilitres EXPOSÉES ---
  window.escapeHtml = function(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };
  window.showToast = function(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
  };
  // --- AUTHENTIFICATION ---
  window.checkPass = function () {
    const input = document.getElementById("pass-input");
    if ((input ? input.value : "") === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "true");
      document.getElementById("login-overlay").style.display = "none";
      document.body.classList.remove("is-locked");
      window.showTab("scoring", document.querySelector(".intra-nav-item"));
    } else {
      alert("Mot de passe incorrect.");
    }
  };
  window.logoutIntranet = function () {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
  };
  // --- NAVIGATION ---
  window.showTab = function (name, item) {
    document.querySelectorAll(".tab-content").forEach(t => t.hidden = true);
    document.querySelectorAll(".intra-nav-item").forEach(n => n.classList.remove("active"));
    const target = document.getElementById("tab-" + name);
    if (target) target.hidden = false;
    if (item) item.classList.add("active");
  };
  // --- RENDU (L'HISTORIQUE) ---
  window.renderNews = function() {
    const list = document.getElementById("news-list-admin");
    if (!list) return;
    const n = window.gemsData.news || {};
    list.innerHTML = n.title ? `
      <div class="list-item">
        <div class="list-item-mn">
          <strong>${window.escapeHtml(n.title)}</strong>
          <small>${window.escapeHtml(n.summary)}</small>
        </div>
      </div>` : "<p>Aucune actualité.</p>";
  };
  window.renderGallery = function() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    grid.innerHTML = (window.gemsData.gallery || []).map((p, i) => `
      <div class="photo-admin-card">
        <img src="${p.image}" style="width:100%; height:100px; object-fit:cover; border-radius:4px;">
        <div class="photo-actions">
          <input value="${window.escapeHtml(p.caption)}" onchange="window.gemsData.gallery[${i}].caption=this.value">
          <button class="btn-danger" onclick="window.deleteGalleryPhoto(${i})">🗑</button>
        </div>
      </div>`).join("");
  };
  window.renderRaces = function() {
    const list = document.getElementById("races-list");
    if (!list) return;
    list.innerHTML = (window.gemsData.races || []).map((r, i) => `
      <div class="list-item">
        <div class="list-item-mn">
          <strong>${window.escapeHtml(r.name)}</strong>
          <small>${r.date} - ${window.escapeHtml(r.circuit)} - ${r.result}</small>
        </div>
        <button class="btn-danger" onclick="window.deleteRace(${i})">🗑</button>
      </div>`).join("");
  };
  window.renderPartners = function() {
    const list = document.getElementById("partners-list");
    if (!list) return;
    list.innerHTML = (window.gemsData.partners || []).map((p, i) => `
      <div class="list-item">
        <img src="${p.logo}" style="width:40px; height:40px; object-fit:contn; margin-right:10px;">
        <div class="list-item-mn"><strong>${window.escapeHtml(p.name)}</strong></div>
        <button class="btn-danger" onclick="window.deletePartner(${i})">🗑</button>
      </div>`).join("");
  };
  // --- ACTIONS ---
  window.saveAllData = async function () {
    window.gemsData.stats = {
      victoires: document.getElementById("stat-victoires")?.value || "",
      podiums: document.getElementById("stat-podiums")?.value || "",
      sws: document.getElementById("stat-sws")?.value || "",
      age: document.getElementById("stat-age")?.value || ""
    };
    window.gemsData.news = {
      title: document.getElementById("news-title")?.value || "",
      summary: document.getElementById("news-summary")?.value || "",
      link: document.getElementById("news-link")?.value || "resultats.html",
      button: document.getElementById("news-button")?.value || "VOIR LES RÉSULTATS"
    };
    try {
      const res = awt fetch("/api/site-data", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify(window.gemsData)
      });
      if (res.ok) window.showToast("✅ Enregistré !");
    } catch (e) { window.showToast("❌ Erreur serveur"); }
  };
  window.addNews = async function () {
    awt window.saveAllData();
    window.renderNews();
  };
  window.addGalleryPhoto = async function() { alert("Pour ajouter une photo, utilise le bouton d'importation."); };
  window.addRace = async function() { alert("Pour ajouter une course, remplis les champs et clique sur Enregistrer."); };
  window.addPartner = async function() { alert("Pour ajouter un partenre, remplis les champs et clique sur Enregistrer."); };
  window.deleteRace = async function(i) { window.gemsData.races.splice(i,1); window.renderRaces(); awt window.saveAllData(); };
  window.deleteGalleryPhoto = async function(i) { window.gemsData.gallery.splice(i,1); window.renderGallery(); awt window.saveAllData(); };
  window.deletePartner = async function(i) { window.gemsData.partners.splice(i,1); window.renderPartners(); awt window.saveAllData(); };
  // --- INITLISATION ---
  window.addEventListener("load", async function () {
    try {
      const res = awt fetch("/api/site-data", { cache: "no-store" });
      if (res.ok) window.gemsData = awt res.json();
    } catch (e) { console.error("Data load error"); }
    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      document.getElementById("login-overlay").style.display = "none";
      document.body.classList.remove("is-locked");
    }
    window.renderNews();
    window.renderGallery();
    window.renderRaces();
    window.renderPartners();
  });
})();
