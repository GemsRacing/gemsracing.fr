(function () {
  "use strict";

  const AUTH_KEY = "gems_auth_v2";
  const PASSWORD = "GemsRacing88";

  let gemsData = {
    stats: {},
    news: {},
    gallery: [],
    races: [],
    partners: []
  };

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.style.display = "block";

    window.setTimeout(function () {
      toast.style.display = "none";
    }, 3000);
  }

  function showLogin() {
    const overlay = document.getElementById("login-overlay");

    if (overlay) {
      overlay.style.display = "flex";
    }

    document.body.classList.add("is-locked");
  }

  function hideLogin() {
    const overlay = document.getElementById("login-overlay");

    if (overlay) {
      overlay.style.display = "none";
    }

    document.body.classList.remove("is-locked");
  }

  window.checkPass = function () {
    const input = document.getElementById("pass-input");
    const value = input ? input.value : "";

    if (value === PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "true");
      hideLogin();
      showTab("scoring", document.querySelector(".intra-nav-item"));
    } else {
      alert("Mot de passe incorrect.");
      showLogin();
    }
  };

  window.logoutIntranet = function () {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
  };

  window.showTab = function (name, item) {
    document.querySelectorAll(".tab-content").forEach(function (tab) {
      tab.hidden = true;
    });

    document.querySelectorAll(".intra-nav-item").forEach(function (nav) {
      nav.classList.remove("active");
    });

    const tab = document.getElementById("tab-" + name);

    if (tab) {
      tab.hidden = false;
    }

    if (item) {
      item.classList.add("active");
    }
  };

  function setValue(id, value) {
    const field = document.getElementById(id);

    if (field) {
      field.value = value || "";
    }
  }

  function loadForms() {
    const stats = gemsData.stats || {};
    const news = gemsData.news || {};

    setValue("stat-victoires", stats.victoires);
    setValue("stat-podiums", stats.podiums);
    setValue("stat-sws", stats.sws);
    setValue("stat-age", stats.age);

    setValue("news-title", news.title);
    setValue("news-summary", news.summary);
    setValue("news-link", news.link);
    setValue("news-button", news.button);
  }

  function renderNews() {
    const list = document.getElementById("news-list-admin");

    if (!list) {
      return;
    }

    const news = gemsData.news || {};

    if (!news.title && !news.summary) {
      list.innerHTML = "<p>Aucune actualité enregistrée.</p>";
      return;
    }

    list.innerHTML = `
      <div class="list-item">
        <div class="list-item-main">
          <strong>${escapeHtml(news.title)}</strong>
          <small>${escapeHtml(news.summary)}</small>
          <small>Lien : ${escapeHtml(news.link)}</small>
        </div>
      </div>
    `;
  }

  window.renderGallery = function () {
    const grid = document.getElementById("gallery-grid");

    if (!grid) {
      return;
    }

    const gallery = Array.isArray(gemsData.gallery)
      ? gemsData.gallery
      : [];

    if (!gallery.length) {
      grid.innerHTML = "<p>Aucune photo enregistrée.</p>";
      return;
    }

    grid.innerHTML = gallery.map(function (photo, index) {
      return `
        <div class="photo-admin-card">
          <div class="photo-preview-wrap">
            <img src="${photo.image || ""}"
                 alt="${escapeHtml(photo.alt || photo.caption)}"
                 style="transform:rotate(${photo.rotation || 0}deg);">
          </div>
          <div class="photo-actions">
            <input value="${escapeHtml(photo.caption)}"
                   aria-label="Légende"
                   onchange="window.updateGalleryCaption(${index}, this.value)">
            <div class="photo-tools">
              <button class="btn-danger"
                      onclick="window.deleteGalleryPhoto(${index})">
                🗑 Supprimer
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };

  window.renderRaces = function () {
    const list = document.getElementById("races-list");

    if (!list) {
      return;
    }

    const races = Array.isArray(gemsData.races)
      ? gemsData.races
      : [];

    if (!races.length) {
      list.innerHTML = "<p>Aucune course enregistrée.</p>";
      return;
    }

    list.innerHTML = races.map(function (race, index) {
      return `
        <div class="list-item">
          <div class="list-item-main">
            <strong>${escapeHtml(race.name)}</strong>
            <small>
              ${escapeHtml(race.date)} ·
              ${escapeHtml(race.circuit)} ·
              ${escapeHtml(race.city)}
            </small>
            <small>
              Statut : ${escapeHtml(race.status)} ·
              Résultat : ${escapeHtml(race.result)}
            </small>
          </div>
          <button class="btn-danger"
                  onclick="window.deleteRace(${index})">
            🗑 Supprimer
          </button>
        </div>
      `;
    }).join("");
  };

  window.renderPartners = function () {
    const list = document.getElementById("partners-list");

    if (!list) {
      return;
    }

    const partners = Array.isArray(gemsData.partners)
      ? gemsData.partners
      : [];

    if (!partners.length) {
      list.innerHTML = "<p>Aucun partenaire enregistré.</p>";
      return;
    }

    list.innerHTML = partners.map(function (partner, index) {
      return `
        <div class="list-item">
          <img class="partner-logo"
               src="${partner.logo || ""}"
               alt="${escapeHtml(partner.name)}">
          <div class="list-item-main">
            <strong>${escapeHtml(partner.name)}</strong>
            <small>${escapeHtml(partner.url)}</small>
          </div>
          <button class="btn-danger"
                  onclick="window.deletePartner(${index})">
            🗑 Supprimer
          </button>
        </div>
      `;
    }).join("");
  };

  async function loadData() {
    try {
      const response = await fetch("/api/site-data", {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("API indisponible : " + response.status);
      }

      const serverData = await response.json();

      gemsData = {
        stats: serverData.stats || {},
        news: serverData.news || {},
        gallery: Array.isArray(serverData.gallery)
          ? serverData.gallery
          : [],
        races: Array.isArray(serverData.races)
          ? serverData.races
          : [],
        partners: Array.isArray(serverData.partners)
          ? serverData.partners
          : []
      };

      window.gemsData = gemsData;

      console.log("Données serveur chargées :", gemsData);
    } catch (error) {
      console.error("Erreur de chargement :", error);
      showToast("⚠️ Impossible de charger les données serveur.");
    }
  }

  function collectForms() {
    gemsData.stats = gemsData.stats || {};
    gemsData.news = gemsData.news || {};

    gemsData.stats.victoires =
      document.getElementById("stat-victoires")?.value || "";

    gemsData.stats.podiums =
      document.getElementById("stat-podiums")?.value || "";

    gemsData.stats.sws =
      document.getElementById("stat-sws")?.value || "";

    gemsData.stats.age =
      document.getElementById("stat-age")?.value || "";

    gemsData.news.title =
      document.getElementById("news-title")?.value || "";

    gemsData.news.summary =
      document.getElementById("news-summary")?.value || "";

    gemsData.news.link =
      document.getElementById("news-link")?.value || "resultats.html";

    gemsData.news.button =
      document.getElementById("news-button")?.value ||
      "VOIR LES RÉSULTATS";
  }

  window.saveAllData = async function () {
    collectForms();

    try {
      const response = await fetch("/api/site-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(gemsData)
      });

      if (!response.ok) {
        throw new Error("Sauvegarde refusée : " + response.status);
      }

      showToast("✅ Modifications enregistrées sur le site.");
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);
      showToast("❌ Sauvegarde impossible.");
    }
  };

  window.addRace = async function () {
    const race = {
      date: document.getElementById("race-date")?.value || "",
      name: document.getElementById("race-name")?.value.trim() || "",
      circuit: document.getElementById("race-circuit")?.value.trim() || "",
      city: document.getElementById("race-city")?.value.trim() || "",
      status: document.getElementById("race-status")?.value || "Programmé",
      result: document.getElementById("race-result")?.value.trim() || "À venir",
      link: document.getElementById("race-link")?.value.trim() || ""
    };

    if (!race.name) {
      alert("Indique le nom de la course.");
      return;
    }

    gemsData.races.push(race);
    renderRaces();
    await window.saveAllData();
  };

  window.deleteRace = async function (index) {
    if (!confirm("Supprimer cette course ?")) {
      return;
    }

    gemsData.races.splice(index, 1);
    renderRaces();
    await window.saveAllData();
  };

  window.updateGalleryCaption = async function (index, value) {
    if (gemsData.gallery[index]) {
      gemsData.gallery[index].caption = value;
      await window.saveAllData();
    }
  };

  window.deleteGalleryPhoto = async function (index) {
    if (!confirm("Supprimer cette photo ?")) {
      return;
    }

    gemsData.gallery.splice(index, 1);
    window.renderGallery();
    await window.saveAllData();
  };

  window.deletePartner = async function (index) {
    if (!confirm("Supprimer ce partenaire ?")) {
      return;
    }

    gemsData.partners.splice(index, 1);
    window.renderPartners();
    await window.saveAllData();
  };

  document.addEventListener("DOMContentLoaded", async function () {
    const toggle = document.getElementById("toggle-password");
    const passwordInput = document.getElementById("pass-input");

    if (toggle && passwordInput) {
      toggle.addEventListener("click", function () {
        const visible = passwordInput.type === "text";
        passwordInput.type = visible ? "password" : "text";
        toggle.textContent = visible ? "Afficher" : "Masquer";
      });
    }

    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      hideLogin();
    } else {
      showLogin();
    }

    await loadData();

    loadForms();
    renderNews();
    window.renderGallery();
    window.renderRaces();
    window.renderPartners();

    showTab(
      "scoring",
      document.querySelector(".intra-nav-item")
    );
  });
})();