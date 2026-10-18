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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function value(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
  }

  function setValue(id, content) {
    const element = document.getElementById(id);

    if (element) {
      element.value = content ?? "";
    }
  }

  function toast(message) {
    const element = document.getElementById("toast");

    if (!element) {
      return;
    }

    element.textContent = message;
    element.style.display = "block";

    setTimeout(function () {
      element.style.display = "none";
    }, 3000);
  }

  function normalizeData(data) {
    return {
      stats: data?.stats || {},
      news: data?.news || {},
      gallery: Array.isArray(data?.gallery) ? data.gallery : [],
      races: Array.isArray(data?.races) ? data.races : [],
      partners: Array.isArray(data?.partners) ? data.partners : []
    };
  }

  async function readImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file) {
        resolve("");
        return;
      }

      if (!file.type || !file.type.startsWith("image/")) {
        reject(new Error("Le fichier sélectionné n'est pas une image."));
        return;
      }

      const reader = new FileReader();

      reader.onload = function () {
        resolve(reader.result);
      };

      reader.onerror = function () {
        reject(new Error("Impossible de lire l'image."));
      };

      reader.readAsDataURL(file);
    });
  }

  async function loadData() {
    const response = await fetch("/api/site-data", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("API indisponible : " + response.status);
    }

    window.gemsData = normalizeData(await response.json());

    console.log("Données serveur chargées :", window.gemsData);
  }

  async function saveData() {
    const response = await fetch("/api/site-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(window.gemsData)
    });

    if (!response.ok) {
      throw new Error("Sauvegarde refusée : " + response.status);
    }

    toast("✅ Modifications enregistrées sur le site.");
  }

  // ------------------------------------------------------------
  // Connexion
  // ------------------------------------------------------------

  window.checkPass = function () {
    const input = document.getElementById("pass-input");
    const overlay = document.getElementById("login-overlay");

    if ((input?.value || "") !== PASSWORD) {
      alert("Mot de passe incorrect.");
      return;
    }

    sessionStorage.setItem(AUTH_KEY, "true");

    if (overlay) {
      overlay.style.display = "none";
    }

    document.body.classList.remove("is-locked");
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

    const target = document.getElementById("tab-" + name);

    if (target) {
      target.hidden = false;
    }

    if (item) {
      item.classList.add("active");
    }
  };

  // ------------------------------------------------------------
  // Formulaires
  // ------------------------------------------------------------

  function loadForms() {
    const stats = window.gemsData.stats || {};
    const news = window.gemsData.news || {};

    setValue("stat-victoires", stats.victoires);
    setValue("stat-podiums", stats.podiums);
    setValue("stat-sws", stats.sws);
    setValue("stat-age", stats.age);

    setValue("news-title", news.title);
    setValue("news-summary", news.summary);
    setValue("news-link", news.link);
    setValue("news-button", news.button);
  }

  function collectForms() {
    window.gemsData.stats = {
      ...(window.gemsData.stats || {}),
      victoires: value("stat-victoires"),
      podiums: value("stat-podiums"),
      sws: value("stat-sws"),
      age: value("stat-age")
    };

    window.gemsData.news = {
      ...(window.gemsData.news || {}),
      title: value("news-title"),
      summary: value("news-summary"),
      link: value("news-link") || "resultats.html",
      button: value("news-button") || "VOIR LES RÉSULTATS"
    };
  }

  // ------------------------------------------------------------
  // Historiques
  // ------------------------------------------------------------

  window.renderNews = function () {
    const list = document.getElementById("news-list-admin");

    if (!list) {
      return;
    }

    const news = window.gemsData.news || {};

    list.innerHTML = news.title || news.summary
      ? `
        <div class="list-item">
          <div class="list-item-main">
            <strong>${escapeHtml(news.title || "Actualité sans titre")}</strong>
            <small>${escapeHtml(news.summary || "")}</small>
            <small>${escapeHtml(news.link || "")}</small>
          </div>
        </div>
      `
      : "<p>Aucune actualité enregistrée.</p>";
  };

  window.renderGallery = function () {
    const grid = document.getElementById("gallery-grid");

    if (!grid) {
      return;
    }

    const gallery = window.gemsData.gallery || [];

    if (!gallery.length) {
      grid.innerHTML = "<p>Aucune photo enregistrée.</p>";
      return;
    }

    // Orientation conservée : aucun bouton de rotation.
    grid.innerHTML = gallery.map(function (photo, index) {
      return `
        <div class="photo-admin-card">
          <div class="photo-preview-wrap">
            <img
              src="${photo.image || ""}"
              alt="${escapeHtml(photo.alt || photo.caption || "Photo de Gems")}"
              style="width:100%;max-height:180px;object-fit:cover;">
          </div>

          <div class="photo-actions">
            <input
              value="${escapeHtml(photo.caption || "")}"
              aria-label="Légende"
              onchange="window.updateGalleryCaption(${index}, this.value)">

            <button
              type="button"
              class="btn-danger"
              onclick="window.deleteGalleryPhoto(${index})">
              🗑 Supprimer
            </button>
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

    const races = window.gemsData.races || [];

    list.innerHTML = races.length
      ? races.map(function (race, index) {
          return `
            <div class="list-item">
              <div class="list-item-main">
                <strong>${escapeHtml(race.name || "Course sans nom")}</strong>
                <small>
                  ${escapeHtml(race.date || "")}
                  · ${escapeHtml(race.circuit || "")}
                  · ${escapeHtml(race.city || "")}
                </small>
                <small>
                  Statut : ${escapeHtml(race.status || "")}
                  · Résultat : ${escapeHtml(race.result || "")}
                </small>
              </div>

              <button
                type="button"
                class="btn-danger"
                onclick="window.deleteRace(${index})">
                🗑 Supprimer
              </button>
            </div>
          `;
        }).join("")
      : "<p>Aucune course enregistrée.</p>";
  };

  window.renderPartners = function () {
    const list = document.getElementById("partners-list");

    if (!list) {
      return;
    }

    const partners = window.gemsData.partners || [];

    list.innerHTML = partners.length
      ? partners.map(function (partner, index) {
          return `
            <div class="list-item">
              ${
                partner.logo
                  ? `<img class="partner-logo"
                           src="${partner.logo}"
                           alt="${escapeHtml(partner.name || "Partenaire")}">`
                  : ""
              }

              <div class="list-item-main">
                <strong>${escapeHtml(partner.name || "Partenaire sans nom")}</strong>
                <small>${escapeHtml(partner.url || "")}</small>
              </div>

              <button
                type="button"
                class="btn-danger"
                onclick="window.deletePartner(${index})">
                🗑 Supprimer
              </button>
            </div>
          `;
        }).join("")
      : "<p>Aucun partenaire enregistré.</p>";
  };

  function renderAll() {
    loadForms();
    window.renderNews();
    window.renderGallery();
    window.renderRaces();
    window.renderPartners();
  }

  // ------------------------------------------------------------
  // Sauvegarde générale
  // ------------------------------------------------------------

  window.saveAllData = async function () {
    collectForms();

    try {
      await saveData();
      renderAll();
    } catch (error) {
      console.error(error);
      toast("❌ Sauvegarde impossible.");
    }
  };

  // ------------------------------------------------------------
  // Actualité
  // ------------------------------------------------------------

  window.addNews = async function () {
    collectForms();

    if (!value("news-title") && !value("news-summary")) {
      toast("ℹ️ Saisis un titre ou un résumé.");
      return;
    }

    try {
      await saveData();
      renderAll();
    } catch (error) {
      console.error(error);
      toast("❌ Actualité non enregistrée.");
    }
  };

  // ------------------------------------------------------------
  // Galerie
  // ------------------------------------------------------------

  window.addGalleryPhoto = async function () {
    const input = document.getElementById("gallery-file");
    const caption = value("gallery-caption");

    if (!input || !input.files || !input.files.length) {
      toast("ℹ️ Sélectionne d'abord une photo.");
      return;
    }

    try {
      const image = await readImage(input.files[0]);

      window.gemsData.gallery.unshift({
        id: Date.now(),
        image: image,
        caption: caption,
        alt: caption || "Photo de Gems Maréchal",
        rotation: 0
      });

      input.value = "";
      setValue("gallery-caption", "");

      window.renderGallery();
      await saveData();
    } catch (error) {
      console.error(error);
      toast("❌ Impossible d'importer cette photo.");
    }
  };

  window.updateGalleryCaption = async function (index, caption) {
    if (!window.gemsData.gallery[index]) {
      return;
    }

    window.gemsData.gallery[index].caption = caption;

    try {
      await saveData();
    } catch (error) {
      console.error(error);
      toast("❌ Légende non enregistrée.");
    }
  };

  window.deleteGalleryPhoto = async function (index) {
    if (!confirm("Supprimer cette photo ?")) {
      return;
    }

    window.gemsData.gallery.splice(index, 1);
    window.renderGallery();
    await saveData();
  };

  // ------------------------------------------------------------
  // Courses
  // ------------------------------------------------------------

  window.addRace = async function () {
    const race = {
      date: value("race-date"),
      name: value("race-name") || "Course sans nom",
      circuit: value("race-circuit"),
      result: value("race-result"),
      city: value("race-city"),
      status: value("race-status") || "Programmé",
      link: value("race-link")
    };

    window.gemsData.races.push(race);
    window.renderRaces();

    [
      "race-date",
      "race-name",
      "race-circuit",
      "race-result",
      "race-city",
      "race-link"
    ].forEach(function (id) {
      setValue(id, "");
    });

    await saveData();
  };

  window.deleteRace = async function (index) {
    if (!confirm("Supprimer cette course ?")) {
      return;
    }

    window.gemsData.races.splice(index, 1);
    window.renderRaces();
    await saveData();
  };

  // ------------------------------------------------------------
  // Partenaires
  // ------------------------------------------------------------

  window.addPartner = async function () {
    const input = document.getElementById("partner-logo-file");
    let logo = "";

    try {
      if (input && input.files && input.files.length) {
        logo = await readImage(input.files[0]);
      }

      window.gemsData.partners.push({
        name: value("partner-name") || "Partenaire sans nom",
        url: value("partner-url"),
        logo: logo
      });

      if (input) {
        input.value = "";
      }

      setValue("partner-name", "");
      setValue("partner-url", "");

      window.renderPartners();
      await saveData();
    } catch (error) {
      console.error(error);
      toast("❌ Partenaire non enregistré.");
    }
  };

  window.deletePartner = async function (index) {
    if (!confirm("Supprimer ce partenaire ?")) {
      return;
    }

    window.gemsData.partners.splice(index, 1);
    window.renderPartners();
    await saveData();
  };

  // ------------------------------------------------------------
  // Initialisation
  // ------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", async function () {
    const overlay = document.getElementById("login-overlay");
    const toggle = document.getElementById("toggle-password");
    const password = document.getElementById("pass-input");

    if (toggle && password) {
      toggle.addEventListener("click", function () {
        const visible = password.type === "text";
        password.type = visible ? "password" : "text";
        toggle.textContent = visible ? "Afficher" : "Masquer";
      });
    }

    if (sessionStorage.getItem(AUTH_KEY) === "true") {
      if (overlay) {
        overlay.style.display = "none";
      }

      document.body.classList.remove("is-locked");
    }

    try {
      await loadData();
      renderAll();
    } catch (error) {
      console.error(error);
      toast("⚠️ Les données n'ont pas pu être chargées.");
    }

    window.showTab(
      "scoring",
      document.querySelector(".intra-nav-item.active")
    );
  });
})();