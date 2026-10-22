(function () {
  let newsData = null;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadNewsData() {
    try {
      const response = await fetch("/api/site-data", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("API indisponible");
      }

      newsData = await response.json();

      if (!Array.isArray(newsData.newsList)) {
        newsData.newsList = [];

        // Récupère l'ancienne actualité existante
        if (newsData.news && newsData.news.title) {
          newsData.newsList.push({
            id: Date.now(),
            date: "Saison 2026",
            title: newsData.news.title,
            summary: newsData.news.summary || "",
            link: newsData.news.link || "resultats.html",
            button: newsData.news.button || "VOIR LE DÉBRIEF",
            image: newsData.news.image || "",
            imageAlt: newsData.news.imageAlt || ""
          });
        }
      }

      renderNewsHistory();
    } catch (error) {
      console.warn("Historique des actualités indisponible :", error);
    }
  }

  function renderNewsHistory() {
    const container = document.getElementById("news-list-admin");

    if (!container || !newsData) {
      return;
    }

    if (!newsData.newsList.length) {
      container.innerHTML = `
        <p style="color:rgba(255,255,255,.7);">
          Aucune actualité publiée pour le moment.
        </p>
      `;
      return;
    }

    container.innerHTML = newsData.newsList.map(function (news, index) {
      return `
        <article class="list-item" style="display:block;">
          <div class="list-item-main">
            <strong>${escapeHtml(news.title)}</strong>

            <small>
              ${escapeHtml(news.date || "Actualité")}
            </small>

            <p style="margin:10px 0;color:rgba(255,255,255,.78);">
              ${escapeHtml(news.summary)}
            </p>

            ${
              news.image
                ? `
                  <img src="${news.image}"
                       alt="${escapeHtml(news.imageAlt || news.title)}"
                       style="width:180px;max-height:110px;object-fit:cover;border-radius:8px;margin:10px 0;">
                `
                : ""
            }

            ${
              news.link
                ? `
                  

                  <a href="${escapeHtml(news.link)}"
                     target="_blank"
                     rel="noopener noreferrer"
                     style="color:#f28c28;">
                    Voir le lien
                  </a>
                `
                : ""
            }
          </div>

          <div class="form-actions">
            <button class="btn-secondary"
                    type="button"
                    onclick="window.editNews(${index})">
              ✏ Modifier
            </button>

            <button class="btn-danger"
                    type="button"
                    onclick="window.deleteNews(${index})">
              🗑 Supprimer
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function collectCurrentNewsForm() {
    return {
      id: Date.now(),
      date: new Date().toLocaleDateString("fr-FR"),
      title: document.getElementById("news-title")?.value.trim() || "",
      summary: document.getElementById("news-summary")?.value.trim() || "",
      link: document.getElementById("news-link")?.value.trim() || "resultats.html",
      button: document.getElementById("news-button")?.value.trim() || "VOIR LE DÉBRIEF",
      image: "",
      imageAlt: ""
    };
  }

  async function saveNewsData() {
    const response = await fetch("/api/site-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newsData)
    });

    if (!response.ok) {
      throw new Error("Sauvegarde impossible");
    }

    const toast = document.getElementById("toast");

    if (toast) {
      toast.textContent = "✅ Actualité enregistrée";
      toast.style.display = "block";

      setTimeout(function () {
        toast.style.display = "none";
      }, 2500);
    }
  }

  window.addNews = async function () {
    if (!newsData) {
      await loadNewsData();
    }

    const news = collectCurrentNewsForm();

    if (!news.title) {
      alert("Indique le titre de l'actualité.");
      return;
    }

    newsData.newsList.unshift(news);

    // La première actualité devient celle de l'accueil
    newsData.news = {
      title: news.title,
      summary: news.summary,
      link: news.link,
      button: news.button,
      image: news.image,
      imageAlt: news.imageAlt
    };

    await saveNewsData();
    renderNewsHistory();

    document.getElementById("news-title").value = "";
    document.getElementById("news-summary").value = "";
    document.getElementById("news-link").value = "";

    window.scrollTo({
      top: document.getElementById("tab-news").offsetTop,
      behavior: "smooth"
    });
  };

  window.deleteNews = async function (index) {
    if (!confirm("Supprimer cette actualité ?")) {
      return;
    }

    newsData.newsList.splice(index, 1);

    if (newsData.newsList.length) {
      const first = newsData.newsList[0];

      newsData.news = {
        title: first.title,
        summary: first.summary,
        link: first.link,
        button: first.button,
        image: first.image || "",
        imageAlt: first.imageAlt || ""
      };
    }

    await saveNewsData();
    renderNewsHistory();
  };

  window.editNews = function (index) {
    const news = newsData.newsList[index];

    if (!news) {
      return;
    }

    document.getElementById("news-title").value = news.title || "";
    document.getElementById("news-summary").value = news.summary || "";
    document.getElementById("news-link").value = news.link || "";
    document.getElementById("news-button").value = news.button || "VOIR LE DÉBRIEF";

    newsData.newsList.splice(index, 1);

    const section = document.getElementById("tab-news");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  document.addEventListener("DOMContentLoaded", loadNewsData);
})();