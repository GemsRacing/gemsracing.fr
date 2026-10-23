(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function loadResultsData() {
    try {
      const response = await fetch("/api/data?t=" + Date.now(), { cache: "no-store" });
      if (!response.ok) throw new Error("Erreur HTTP " + response.status);
      return await response.json();
    } catch (error) {
      console.warn("Chargement distant échoué, essai local data/site-data.json :", error);
      try {
        const localRes = await fetch("data/site-data.json", { cache: "no-store" });
        return await localRes.json();
      } catch (e) {
        return { news: {}, races: [] };
      }
    }
  }

  function newsCardHtml(news, large) {
    if (!news || !news.title) return "";
    return `
      <article class="news-card ${large ? "news-card-large" : ""}" style="margin-bottom: 25px;">
        ${
          news.image
            ? `<div class="news-image-wrap" style="margin-bottom:15px; border-radius:10px; overflow:hidden; border:1px solid rgba(242,140,40,0.3);">
                <img src="${news.image}" alt="${escapeHtml(news.title)}" style="width:100%; max-height:260px; object-fit:cover; display:block;">
               </div>`
            : ""
        }
        <h4 style="margin: 0 0 10px 0; color: #f28c28;">${escapeHtml(news.title)}</h4>
        <p style="margin: 0 0 15px 0; line-height: 1.6;">${escapeHtml(news.summary || "")}</p>
        ${
          news.link
            ? `<a class="btn" href="${escapeHtml(news.link)}" style="display:inline-block; font-size:13px; padding:10px 18px;">
                ${escapeHtml(news.button || "VOIR L'ACTUALITÉ")}
               </a>`
            : ""
        }
      </article>
    `;
  }

  function renderNews(data) {
    const latestContainer = document.getElementById("results-latest-news-content");
    const archivesContainer = document.getElementById("news-archives");
    const moreButton = document.getElementById("results-news-more-button");
    if (!latestContainer || !archivesContainer) return;

    const news = data.news || {};
    const archives = Array.isArray(data.newsArchive) ? data.newsArchive : (Array.isArray(data.newsArchives) ? data.newsArchives : []);
    let expanded = false;

    latestContainer.innerHTML = (news && news.title) ? newsCardHtml(news, true) : "<p>Aucune actualité publiée pour le moment.</p>";

    function updateNewsView() {
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) moreButton.style.display = "none";
        return;
      }
      if (moreButton) {
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "RÉDUIRE" : "VOIR PLUS D'ACTUALITÉS";
      }
      if (expanded) {
        archivesContainer.style.display = "block";
        archivesContainer.innerHTML = archives.map(item => newsCardHtml(item, false)).join("");
      } else {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
      }
    }

    if (moreButton) {
      moreButton.onclick = function () {
        expanded = !expanded;
        updateNewsView();
      };
    }
    updateNewsView();
  }

  function raceHtml(race) {
    if (!race) return "";
    return `
      <article class="race-card" style="margin-bottom: 25px; padding: 20px; background: rgba(7,27,53,0.6); border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);">
        ${
          race.image
            ? `<div class="race-image-wrap" style="margin-bottom:15px; border-radius:8px; overflow:hidden; border:1px solid rgba(242,140,40,0.3);">
                <img src="${race.image}" alt="${escapeHtml(race.name)}" style="width:100%; max-height:240px; object-fit:cover; display:block;">
               </div>`
            : ""
        }
        <div style="font-size: 13px; color: #f28c28; font-weight: 700; margin-bottom: 6px;">
          ${escapeHtml(race.date || "Date à venir")}${race.time ? ` · ${escapeHtml(race.time)}` : ""}
        </div>
        <h4 style="margin: 0 0 8px 0; font-size: 18px; color: #ffffff;">${escapeHtml(race.name || "Course")}</h4>
        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 12px;">
          ${escapeHtml(race.circuit || "")}${race.city ? ` · ${escapeHtml(race.city)}` : ""} ${race.category ? ` · ${escapeHtml(race.category)}` : ""}
        </div>
        <div style="font-size: 14px; margin-bottom: 12px;">
          <strong style="color: #f28c28;">${escapeHtml(race.status || "Programmé")}</strong>
          ${race.result ? ` · Résultat : ${escapeHtml(race.result)}` : ""}
          ${race.bestLap ? ` · Meilleur tour : ${escapeHtml(race.bestLap)}` : ""}
        </div>
        ${
          race.comment
            ? `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.5; opacity: 0.9;">${escapeHtml(race.comment)}</p>`
            : ""
        }
        ${
          race.link
            ? `<a href="${escapeHtml(race.link)}" target="_blank" rel="noopener noreferrer" style="color: #f28c28; font-weight: 700; font-size: 13px; text-decoration: none;">Voir le débrief →</a>`
            : ""
        }
      </article>
    `;
  }

  function renderRaces(data) {
    const latestContainer = document.getElementById("results-public-races-list");
    const archivesContainer = document.getElementById("race-archives");
    const moreButton = document.getElementById("results-races-more-button");
    if (!latestContainer || !archivesContainer) return;

    const races = Array.isArray(data.races) ? data.races.slice() : [];
    races.sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });

    const latestRace = races[0];
    const archives = races.slice(1);
    let expanded = false;

    latestContainer.innerHTML = latestRace ? raceHtml(latestRace) : "<p>Aucune course enregistrée pour le moment.</p>";

    function updateArchivesView() {
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) moreButton.style.display = "none";
        return;
      }
      if (moreButton) {
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "RÉDUIRE" : `VOIR PLUS DE COURSES (${archives.length})`;
      }
      if (expanded) {
        archivesContainer.style.display = "block";
        archivesContainer.innerHTML = archives.map(raceHtml).join("");
      } else {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
      }
    }

    if (moreButton) {
      moreButton.onclick = function () {
        expanded = !expanded;
        updateArchivesView();
      };
    }
    updateArchivesView();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const data = await loadResultsData();
    renderNews(data);
    renderRaces(data);
  });
})();