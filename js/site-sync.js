(function () {
  const defaultData = {
    stats: { victoires: "7", podiums: "15", sws: "57e", age: "16 ans" },
    news: { title: "Gems termine 3e sur 27 en 2T Rotax à Solokart", summary: "Une nouvelle performance solide pour Gems Maréchal. Retrouvez le débrief et les photos sur Instagram.", link: "resultats.html", button: "VOIR LES RÉSULTATS", image: "", imageAlt: "" },
    gallery: [],
    races: [
      { date: "2026-10-10", name: "2T Rotax Solokart", circuit: "Solokart", city: "Plessé", status: "Terminé", result: "3e / 27", link: "" },
      { date: "2026-11-05", name: "Endurance SWS Jovikart", circuit: "Jovikart", city: "Le Bignon", status: "Programmé", result: "À venir", link: "" }
    ],
    partners: [
      { name: "VRtueux", url: "https://www.vrtueux.fr/", logo: "assets/partners/vrtueux.png" },
      { name: "Jovikart", url: "https://www.jovikart.com/", logo: "assets/partners/jovikart.webp" },
      { name: "Normal", url: "https://www.normalstores.com/fr/", logo: "assets/partners/normal.png" },
      { name: "Apollo 3S", url: "https://www.apollo3s.com/", logo: "assets/partners/apollo3s.jpg" },
      { name: "Arrière-Cour", url: "https://arrierecour42.fr/", logo: "assets/partners/arrierecour.png" }
    ]
  };

  function escapeHtml(val) {
    return String(val || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function loadData() {
    try {
      const response = await fetch("/api/site-data", { cache: "no-store" });
      if (!response.ok) throw new Error("Erreur serveur");
      const serverData = await response.json();
      return {
        ...defaultData,
        ...serverData,
        stats: { ...defaultData.stats, ...(serverData.stats || {}) },
        news: { ...defaultData.news, ...(serverData.news || {}) },
        races: Array.isArray(serverData.races) && serverData.races.length ? serverData.races : defaultData.races,
        partners: Array.isArray(serverData.partners) && serverData.partners.length ? serverData.partners : defaultData.partners
      };
    } catch (e) {
      return defaultData;
    }
  }

  function renderPartners(partners) {
    const container = document.querySelector(".gems-partners-container");
    if (!container) return;
    const list = Array.isArray(partners) && partners.length ? partners : defaultData.partners;
    const cardsHtml = list.map(p => `
      <a class="gems-partner-card" href="${escapeHtml(p.url || '#')}" target="_blank" rel="noopener noreferrer">
        <img src="${escapeHtml(p.logo)}" alt="${escapeHtml(p.name)}">
        <span class="gems-partner-name">${escapeHtml(p.name)}</span>
      </a>
    `).join("");

    container.innerHTML = `
      <div class="gems-partners-track">${cardsHtml}</div>
      <div class="gems-partners-track" aria-hidden="true">${cardsHtml}</div>
    `;
  }

  function renderLatestNews(news) {
    const container = document.getElementById("latest-news-content");
    if (!container) return;
    if (!news || (!news.title && !news.summary)) {
      container.innerHTML = "<p style='color:#ccc;'>Aucune actualité publiée pour le moment.</p>";
      return;
    }
    container.innerHTML = `
      <div style="display:flex; gap:20px; flex-wrap:wrap; align-items:center;">
        ${news.image ? `<img src="${escapeHtml(news.image)}" alt="${escapeHtml(news.imageAlt || news.title)}" style="max-width:240px; border-radius:10px; object-fit:cover;">` : ''}
        <div style="flex:1; min-width:260px;">
          <h4 style="color:#fff; font-size:1.3rem; margin:0 0 10px 0;">${escapeHtml(news.title)}</h4>
          <p style="color:#ddd; margin:0 0 15px 0; line-height:1.5;">${escapeHtml(news.summary)}</p>
          ${news.link ? `<a class="btn" href="${escapeHtml(news.link)}" style="display:inline-block; padding:8px 18px; font-size:0.9rem;">${escapeHtml(news.button || 'VOIR')}</a>` : ''}
        </div>
      </div>
    `;
  }

  function renderRaces(races) {
    const container = document.getElementById("public-races-list");
    if (!container) return;
    const raceList = Array.isArray(races) ? races : [];
    if (!raceList.length) {
      container.innerHTML = "<p style='color:#ccc;'>Aucune course programmée.</p>";
      return;
    }

    container.innerHTML = raceList.map(r => `
      <div style="border-bottom:1px solid rgba(242,140,40,0.3); padding:12px 0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="color:#f28c28; font-weight:bold; font-size:0.9rem; display:block;">${escapeHtml(r.date)}</span>
          <strong style="color:#fff; font-size:1.1rem;">${escapeHtml(r.name)}</strong>
          <span style="color:#aaa; font-size:0.9rem; margin-left:8px;">${escapeHtml(r.circuit)} ${r.city ? '· ' + escapeHtml(r.city) : ''}</span>
        </div>
        <div>
          <span style="background:rgba(242,140,40,0.2); color:#f28c28; padding:4px 10px; border-radius:12px; font-size:0.85rem; font-weight:600;">
            ${escapeHtml(r.status)} ${r.result ? '· ' + escapeHtml(r.result) : ''}
          </span>
          ${r.link ? `<a href="${escapeHtml(r.link)}" target="_blank" style="color:#f28c28; margin-left:10px; font-size:0.85rem; text-decoration:underline;">Débrief</a>` : ''}
        </div>
      </div>
    `).join("");
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const data = await loadData();
    renderPartners(data.partners);
    renderLatestNews(data.news);
    renderRaces(data.races);
  });
})();