(function () {
  function escapeHtml(val) {
    return String(val || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function loadData() {
    try {
      const res = await fetch("/api/data?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch (e) {
      try {
        const local = await fetch("data/site-data.json", { cache: "no-store" });
        return await local.json();
      } catch (err) {
        return { news: {}, races: [] };
      }
    }
  }

  function newsCardHtml(news, large) {
    if (!news || !news.title) return "";
    var img = "";
    if (news.image) {
      img = '<div style="margin-bottom:15px; border-radius:10px; overflow:hidden; border:1px solid rgba(242,140,40,0.3);">' +
            '<img src="' + news.image + '" alt="' + escapeHtml(news.title) + '" style="width:100%; max-height:260px; object-fit:cover; display:block;">' +
            '</div>';
    }
    var btn = "";
    if (news.link) {
      btn = '<a class="btn" href="' + escapeHtml(news.link) + `"`" style="display:inline-block; font-size:13px; padding:10px 18px;">' +
            escapeHtml(news.button || "VOIR L'ACTUALITÃ‰") + '</a>';
    }
    return '<article class="' + (large ? "news-card news-card-large" : "news-card") + '" style="margin-bottom:25px;">' +
           img +
           '<h4 style="margin:0 0 10px 0; color:#f28c28;">' + escapeHtml(news.title) + '</h4>' +
           '<p style="margin:0 0 15px 0; line-height:1.6;">' + escapeHtml(news.summary || "") + '</p>' +
           btn +
           '</article>';
  }

  function renderNews(data) {
    const latestContainer = document.getElementById("results-latest-news-content");
    const archivesContainer = document.getElementById("news-archives");
    const moreButton = document.getElementById("results-news-more-button");
    if (!latestContainer || !archivesContainer) return;

    const news = data.news || {};
    const archives = Array.isArray(data.newsArchive) ? data.newsArchive : (Array.isArray(data.newsArchives) ? data.newsArchives : []);
    let expanded = false;

    latestContainer.innerHTML = (news && news.title) ? newsCardHtml(news, true) : "<p>Aucune actualitÃ© publiÃ©e pour le moment.</p>";

    function updateNewsView() {
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) moreButton.style.display = "none";
        return;
      }
      if (moreButton) {
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "RÃ‰DUIRE" : "VOIR PLUS D'ACTUALITÃ‰S";
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
    var img = "";
    if (race.image) {
      img = '<div style="margin-bottom:15px; border-radius:8px; overflow:hidden; border:1px solid rgba(242,140,40,0.3);">' +
            '<img src="' + race.image + '" alt="' + escapeHtml(race.name) + '" style="width:100%; max-height:240px; object-fit:cover; display:block;">' +
            '</div>';
    }
    var debrief = "";
    if (race.link) {
      debrief = '<a href="' + escapeHtml(race.link) + '" target="_blank" rel="noopener noreferrer" style="color:#f28c28; font-weight:700; font-size:13px; text-decoration:none;">Voir le dÃ©brief â†’</a>';
    }
    var comment = "";
    if (race.comment) {
      comment = '<p style="margin:0 0 12px 0; font-size:14px; line-height:1.5; opacity:0.9;">' + escapeHtml(race.comment) + '</p>';
    }

    return '<article class="race-card" style="margin-bottom:25px; padding:20px; background:rgba(7,27,53,0.6); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">' +
           img +
           '<div style="font-size:13px; color:#f28c28; font-weight:700; margin-bottom:6px;">' +
           escapeHtml(race.date || "Date Ã  venir") + (race.time ? " Â· " + escapeHtml(race.time) : "") +
           '</div>' +
           '<h4 style="margin:0 0 8px 0; font-size:18px; color:#ffffff;">' + escapeHtml(race.name || "Course") + '</h4>' +
           '<div style="font-size:14px; opacity:0.8; margin-bottom:12px;">' +
           escapeHtml(race.circuit || "") + (race.city ? " Â· " + escapeHtml(race.city) : "") + (race.category ? " Â· " + escapeHtml(race.category) : "") +
           '</div>' +
           '<div style="font-size:14px; margin-bottom:12px;">' +
           '<strong style="color:#f28c28;">' + escapeHtml(race.status || "ProgrammÃ©") + '</strong>' +
           (race.result ? " Â· RÃ©sultat : " + escapeHtml(race.result) : "") +
           (race.bestLap ? " Â· Meilleur tour : " + escapeHtml(race.bestLap) : "") +
           '</div>' +
           comment +
           debrief +
           '</article>';
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

    latestContainer.innerHTML = latestRace ? raceHtml(latestRace) : "<p>Aucune course enregistrÃ©e pour le moment.</p>";

    function updateArchivesView() {
      if (!archives.length) {
        archivesContainer.style.display = "none";
        archivesContainer.innerHTML = "";
        if (moreButton) moreButton.style.display = "none";
        return;
      }
      if (moreButton) {
        moreButton.style.display = "block";
        moreButton.textContent = expanded ? "RÃ‰DUIRE" : `VOIR PLUS DE COURSES (${archives.length})`;
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
    const data = await loadData();
    renderNews(data);
    renderRaces(data);
  });
})();
