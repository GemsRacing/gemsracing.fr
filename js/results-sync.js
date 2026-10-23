(function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
      <article class="${large ? "latest-news-card" : "archive-news-card"}" style="margin-bottom:15px;">
        ${
          news.image
            ? `<div style="margin-bottom:12px; border-radius:8px; overflow:hidden; max-height:200px;">
                 <img src="${escapeHtml(news.image)}" alt="${escapeHtml(news.title)}" style="width:100%; height:100%; object-fit:cover; display:block;" loading="lazy">
               </div>`
            : ""
        }
        <h4 style="color:#fff; font-size:18px; margin:0 0 8px 0;">${escapeHtml(news.title)}</h4>
        <p style="color:rgba(255,255,255,0.8); font-size:14px; margin:0 0 12px 0;">${escapeHtml(news.summary || "")}</p>
        ${
          news.link
            ? `<a class="btn" href="${escapeHtml(news.link)}" target="_blank" rel="noopener noreferrer" style="font-size:13px; padding:8px 16px;">
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
    const archives = Array.isArray(data.newsArchive)
      ? data.newsArchive
      : (Array.isArray(data.newsArchives) ? data.newsArchives : []);

    let expanded = false;

    latestContainer.innerHTML = (news && news.title)
      ? newsCardHtml(news, true)
      : "<p style='color:rgba(255,255,255,0.7);'>Aucune actualité publiée pour le moment.</p>";

    function updateNewsView() {
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) moreButton.style.display = "none";
        return;
      }

      if (moreButton) {
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "R\u00C9DUIRE" : "VOIR PLUS D'ACTUALITÉS";
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
      <article class="public-race-card" style="margin-bottom:15px; background:rgba(7,27,53,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:18px;">
        ${
          race.image
            ? `<div style="margin-bottom:12px; border-radius:8px; overflow:hidden; max-height:160px;">
                 <img src="${escapeHtml(race.image)}" alt="${escapeHtml(race.name || "Course")}" style="width:100%; height:100%; object-fit:cover; display:block;" loading="lazy">
               </div>`
            : ""
        }
        <div class="public-race-date" style="color:#f28c28; font-weight:700; font-size:14px; margin-bottom:6px;">
          ${escapeHtml(race.date || "Date à venir")}${race.time ? ` · ${escapeHtml(race.time)}` : ""}
        </div>

        <h4 style="color:#fff; font-size:18px; margin:0 0 8px 0;">${escapeHtml(race.name || "Course")}</h4>

        <p style="color:rgba(255,255,255,0.8); font-size:14px; margin:0 0 8px 0;">
          ${escapeHtml(race.circuit || "")}${race.city ? ` · ${escapeHtml(race.city)}` : ""}
          ${race.category ? ` · <span style="color:#f28c28;">${escapeHtml(race.category)}</span>` : ""}
        </p>

        <p class="public-race-status" style="font-size:13px; margin:0 0 10px 0;">
          <strong style="color:${race.status === "Terminé" ? "#2ecc71" : "#f28c28"};">${escapeHtml(race.status || "Programmé")}</strong>
          ${race.result ? ` · <span style="color:#fff; font-weight:700;">Résultat : ${escapeHtml(race.result)}</span>` : ""}
          ${race.bestLap ? ` · <span style="color:rgba(255,255,255,0.7);">Meilleur tour : ${escapeHtml(race.bestLap)}</span>` : ""}
        </p>

        ${
          race.comment
            ? `<p style="font-size:13px; color:rgba(255,255,255,0.7); font-style:italic; margin:0 0 10px 0;">${escapeHtml(race.comment)}</p>`
            : ""
        }

        ${
          race.link
            ? `<a href="${escapeHtml(race.link)}" target="_blank" rel="noopener noreferrer" style="display:inline-block; font-size:13px; color:#f28c28; font-weight:700; text-decoration:none;">
                 Voir le débrief →
               </a>`
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

    // Tri par date décroissante
    races.sort(function (a, b) {
      return String(b.date || "").localeCompare(String(a.date || ""));
    });

    const latestRace = races[0];
    const archives = races.slice(1);
    let expanded = false;

    latestContainer.innerHTML = latestRace
      ? raceHtml(latestRace)
      : "<p style='color:rgba(255,255,255,0.7);'>Aucune course enregistrée pour le moment.</p>";

    function updateArchivesView() {
      // S'il n'y a pas d'autres courses, on masque proprement le bouton
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) moreButton.style.display = "none";
        return;
      }

      // S'il y a d'autres courses, le bouton est visible
      if (moreButton) {
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "R\u00C9DUIRE" : `VOIR PLUS DE COURSES (${archives.length})`;
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