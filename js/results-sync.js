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
      const response = await fetch("/api/data", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Impossible de charger les donnÃ©es.");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur de chargement des rÃ©sultats :", error);
      return {
        news: {},
        newsArchive: [],
        newsArchives: [],
        races: []
      };
    }
  }

  function newsCardHtml(news, large) {
    if (!news) return "";

    return `
      <article class="${large ? "latest-news-card" : "archive-news-card"}">
        ${
          news.image
            ? `<img
                 src="${escapeHtml(news.image)}"
                 alt="${escapeHtml(news.imageAlt || news.title || "ActualitÃ© Gems Racing")}"
                 loading="lazy">`
            : ""
        }

        <h4>${escapeHtml(news.title || "ActualitÃ© Gems Racing")}</h4>

        <p>${escapeHtml(news.summary || "")}</p>

        ${
          news.link
            ? `<a class="btn" href="${escapeHtml(news.link)}">
                 ${escapeHtml(news.button || "VOIR Lâ€™ACTUALITÃ‰")}
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

    const latestNews = data.news || {};
    const archives = Array.isArray(data.newsArchive)
      ? data.newsArchive
      : (
          Array.isArray(data.newsArchives)
            ? data.newsArchives
            : []
        );

    let expanded = false;

    latestContainer.innerHTML = newsCardHtml(latestNews, true);

    function drawArchives() {
      const visibleArchives = expanded
        ? archives
        : archives.slice(0, 2);

      archivesContainer.innerHTML = visibleArchives
        .map(item => newsCardHtml(item, false))
        .join("");

      if (moreButton) {
        moreButton.hidden = archives.length <= 2;
        moreButton.textContent = expanded
          ? "RÃ‰DUIRE"
          : "VOIR PLUS Dâ€™ACTUALITÃ‰S";
      }
    }

    if (moreButton) {
      moreButton.onclick = function () {
        expanded = !expanded;
        drawArchives();
      };
    }

    drawArchives();
  }

  function raceHtml(race) {
    return `
      <article class="public-race-card">
        <div class="public-race-date">
          ${escapeHtml(race.date || "Date Ã  venir")}
        </div>

        <h4>${escapeHtml(race.name || "Course")}</h4>

        <p>
          ${escapeHtml(race.circuit || "")}
          ${race.city ? ` · ${escapeHtml(race.city)}` : ""}
        </p>

        <p class="public-race-status">
          <strong>${escapeHtml(race.status || "ProgrammÃ©")}</strong>
          ${race.result ? ` · ${escapeHtml(race.result)}` : ""}
        </p>

        ${
          race.link
            ? `<a
                 href="${escapeHtml(race.link)}"
                 target="_blank"
                 rel="noopener noreferrer">
                 Voir le dÃ©brief
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

    const races = Array.isArray(data.races)
      ? data.races.slice()
      : [];

    races.sort(function (a, b) {
      return String(b.date || "").localeCompare(
        String(a.date || "")
      );
    });

    const latestRace = races[0];
    const archives = races.slice(1);

    let expanded = false;

    latestContainer.innerHTML = latestRace
      ? raceHtml(latestRace)
      : "<p>Aucune course enregistrÃ©e.</p>";

    function drawArchives() {
      const visibleArchives = expanded
        ? archives
        : archives.slice(0, 2);

      archivesContainer.innerHTML = visibleArchives
        .map(raceHtml)
        .join("");

      if (moreButton) {
        moreButton.hidden = archives.length <= 2;
        moreButton.textContent = expanded
          ? "RÃ‰DUIRE"
          : "VOIR PLUS DE COURSES";
      }
    }

    if (moreButton) {
      moreButton.onclick = function () {
        expanded = !expanded;
        drawArchives();
      };
    }

    drawArchives();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const data = await loadResultsData();

    renderNews(data);
    renderRaces(data);
  });
})();

