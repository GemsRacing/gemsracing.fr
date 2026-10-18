(function () {
  async function loadServerData() {
    try {
      const response = await fetch("/api/site-data", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("API indisponible");
      }

      const serverData = await response.json();

      if (!serverData.stats) serverData.stats = {};
      if (!serverData.news) serverData.news = {};
      if (!Array.isArray(serverData.gallery)) serverData.gallery = [];
      if (!Array.isArray(serverData.races)) serverData.races = [];
      if (!Array.isArray(serverData.partners)) serverData.partners = [];

      window.gemsServerData = serverData;

      const fields = {
        "stat-victoires": serverData.stats.victoires,
        "stat-podiums": serverData.stats.podiums,
        "stat-sws": serverData.stats.sws,
        "stat-age": serverData.stats.age,
        "news-title": serverData.news.title,
        "news-summary": serverData.news.summary,
        "news-link": serverData.news.link,
        "news-button": serverData.news.button,
        "news-image-alt": serverData.news.imageAlt
      };

      Object.keys(fields).forEach(function (id) {
        const field = document.getElementById(id);

        if (field && fields[id] !== undefined) {
          field.value = fields[id] || "";
        }
      });

      if (serverData.news.image) {
        const image = document.getElementById("news-image-preview");

        if (image) {
          image.src = serverData.news.image;
          image.style.display = "block";
        }
      }

      console.log("Données serveur chargées.");
    } catch (error) {
      console.warn("Chargement serveur impossible :", error);
    }
  }

  function collectDataFromFields() {
    const current = window.gemsServerData || {
      stats: {},
      news: {},
      gallery: [],
      races: [],
      partners: []
    };

    current.stats = current.stats || {};
    current.news = current.news || {};

    function value(id, fallback) {
      const field = document.getElementById(id);
      return field ? field.value.trim() : (fallback || "");
    }

    current.stats.victoires = value(
      "stat-victoires",
      current.stats.victoires
    );

    current.stats.podiums = value(
      "stat-podiums",
      current.stats.podiums
    );

    current.stats.sws = value(
      "stat-sws",
      current.stats.sws
    );

    current.stats.age = value(
      "stat-age",
      current.stats.age
    );

    current.news.title = value(
      "news-title",
      current.news.title
    );

    current.news.summary = value(
      "news-summary",
      current.news.summary
    );

    current.news.link = value(
      "news-link",
      current.news.link || "resultats.html"
    );

    current.news.button = value(
      "news-button",
      current.news.button || "VOIR LES RÉSULTATS"
    );

    current.news.imageAlt = value(
      "news-image-alt",
      current.news.imageAlt
    );

    return current;
  }

  async function saveToServer() {
    const dataToSave = collectDataFromFields();

    try {
      const response = await fetch("/api/site-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        throw new Error("Le serveur a refusé la sauvegarde.");
      }

      window.gemsServerData = dataToSave;

      const toast = document.getElementById("toast");

      if (toast) {
        toast.textContent = "✅ Modifications enregistrées sur le site";
        toast.style.display = "block";

        setTimeout(function () {
          toast.style.display = "none";
        }, 3000);
      }

      console.log("Données envoyées au serveur.");
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);

      const toast = document.getElementById("toast");

      if (toast) {
        toast.textContent = "❌ Sauvegarde impossible";
        toast.style.display = "block";
      }
    }
  }

  window.saveAllData = saveToServer;

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(loadServerData, 250);
  });
})();