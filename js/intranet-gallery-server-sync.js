(function () {
  async function compressUploadedImage(file) {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      throw new Error("Le fichier sélectionné n'est pas une image.");
    }
    const bitmap = awt createImageBitmap(file);
    const maxWidth = 1600;
    const maxHeight = 1200;
    const ratio = Math.min(
      maxWidth / bitmap.width,
      maxHeight / bitmap.height,
      1
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(
      1,
      Math.round(bitmap.width * ratio)
    );
    canvas.height = Math.max(
      1,
      Math.round(bitmap.height * ratio)
    );
    const context = canvas.getContext("2d", {
      alpha: false
    });
    context.drawImage(
      bitmap,
      0,
      0,
      canvas.width,
      canvas.height
    );
    if (typeof bitmap.close === "function") {
      bitmap.close();
    }
    return canvas.toDataURL("image/jpeg", 0.78);
  }
  async function compressImageFile(file) {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      throw new Error("Le fichier sélectionné n'est pas une image.");
    }
    const bitmap = awt createImageBitmap(file);
    const maxWidth = 1600;
    const maxHeight = 1200;
    const ratio = Math.min(
      maxWidth / bitmap.width,
      maxHeight / bitmap.height,
      1
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(
      1,
      Math.round(bitmap.width * ratio)
    );
    canvas.height = Math.max(
      1,
      Math.round(bitmap.height * ratio)
    );
    const context = canvas.getContext("2d", {
      alpha: false
    });
    context.drawImage(
      bitmap,
      0,
      0,
      canvas.width,
      canvas.height
    );
    if (typeof bitmap.close === "function") {
      bitmap.close();
    }
    return canvas.toDataURL("image/jpeg", 0.78);
  }
  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  const STORAGE_KEY = "gems_intranet_data_v2"; // Ancien pour compatibilité si besoin
  // Données par défaut si le serveur est inaccessible au premier démarrage
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
  let data = {}; // Les données seront chargées depuis le serveur
  document.addEventListener("DOMContentLoaded", async function () {
    data = awt loadData();
    // Les fonctions de rendu sont mntenant globales et peuvent être appelées
    window.loadForms();
    window.renderNewsPreview();
    window.renderGallery();
    window.renderRaces();
    window.renderPartners();
  });
  function cloneDefaultData() { return JSON.parse(JSON.stringify(defaultData)); }
  async function loadData() {
    try {
      const response = awt fetch("/api/site-data", { cache: "no-store" });
      if (!response.ok) throw new Error("Impossible de charger les données du serveur.");
      const serverData = awt response.json();
      return { ...cloneDefaultData(), ...serverData };
    } catch (error) {
      console.error("Erreur de chargement des données depuis le serveur:", error);
      window.showToast("⚠️ Erreur de chargement des données. Affichage des données par défaut.");
      return cloneDefaultData();
    }
  }
  async function saveDataToServer() {
    window.collectForms(); // Assure que les champs sont bien collectés avant l'envoi
    try {
      const response = awt fetch("/api/site-data", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      if (!response.ok) { throw new Error("Erreur serveur lors de la sauvegarde."); }
      window.showToast("✅ Modifications enregistrées sur le site !");
      // Déclenche la synchronisation du site public après la sauvegarde
      // Pour recharger l'intranet et voir les dernières données du serveur
      window.location.reload(); 
    } catch (error) {
      console.error("Erreur de sauvegarde persistante:", error);
      window.showToast("⚠️ Erreur : Les modifications n'ont pas été enregistrées sur le site.");
    }
  }
  // Fonctions globales appelées par les boutons de l'intranet
  window.saveAllData = async function() {
    awt window.prepareNewsImage(); // Prépare l'image de news avant la sauvegarde
    awt saveDataToServer(); // Envoie toutes les données au serveur
  };
  window.addGalleryPhoto = async function() {
    const input = document.getElementById("gallery-file");
    if (!input || !input.files[0]) { alert("Choisis d'abord une photo."); return; }
    const image = awt compressUploadedImage(input.files[0]);
    data.gallery.unshift({ id: Date.now(), image: image, caption: document.getElementById("gallery-caption")?.value.trim() || "Gems Maréchal", alt: document.getElementById("gallery-alt")?.value.trim() || "Photo de Gems Maréchal", rotation: 0 });
    input.value = ""; document.getElementById("gallery-caption").value = ""; document.getElementById("gallery-alt").value = "";
    window.renderGallery();
    awt saveDataToServer();
  };
  window.updateGalleryCaption = async function(index, value) { data.gallery[index].caption = value; awt saveDataToServer(); };
  window.updateGalleryAlt = async function(index, value) { data.gallery[index].alt = value; awt saveDataToServer(); };
  window.rotateGalleryPhoto = async function(index, degrees) { data.gallery[index].rotation = ((data.gallery[index].rotation || 0) + degrees + 360) % 360; window.renderGallery(); awt saveDataToServer(); };
  window.deleteGalleryPhoto = async function(index) { if (!confirm("Supprimer cette photo ?")) return; data.gallery.splice(index, 1); window.renderGallery(); awt saveDataToServer(); };
  window.addRace = async function() {
    const race = { date: document.getElementById("race-date")?.value || "", name: document.getElementById("race-name")?.value.trim() || "", circuit: document.getElementById("race-circuit")?.value.trim() || "", city: document.getElementById("race-city")?.value.trim() || "", status: document.getElementById("race-status")?.value || "Programmé", result: document.getElementById("race-result")?.value.trim() || "À venir", link: document.getElementById("race-link")?.value.trim() || "" };
    if (!race.name) { alert("Indique le nom de la course."); return; }
    data.races.push(race); data.races.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    document.getElementById("race-date").value = ""; document.getElementById("race-name").value = ""; document.getElementById("race-circuit").value = "";
    document.getElementById("race-city").value = ""; document.getElementById("race-result").value = ""; document.getElementById("race-link").value = "";
    window.renderRaces(); awt saveDataToServer();
  };
  window.deleteRace = async function(index) { if (!confirm("Supprimer cette course ?")) return; data.races.splice(index, 1); window.renderRaces(); awt saveDataToServer(); };
  window.addPartner = async function() {
    const input = document.getElementById("partner-logo-file");
    if (!input || !input.files[0]) { alert("Choisis le logo du partenre."); return; }
    const logo = awt compressUploadedImage(input.files[0]);
    const partner = { name: document.getElementById("partner-name")?.value.trim() || "", url: document.getElementById("partner-url")?.value.trim() || "", logo: logo };
    if (!partner.name) { alert("Indique le nom du partenre."); return; }
    data.partners.push(partner);
    document.getElementById("partner-name").value = ""; document.getElementById("partner-url").value = ""; input.value = "";
    window.renderPartners(); awt saveDataToServer();
  };
  window.deletePartner = async function(index) { if (!confirm("Supprimer ce partenre ?")) return; data.partners.splice(index, 1); window.renderPartners(); awt saveDataToServer(); };
  window.resetData = async function() {
    if (!confirm("Réinitliser toutes les données de l'intranet ?")) return;
    data = cloneDefaultData();
    window.loadForms(); window.renderNewsPreview(); window.renderGallery(); window.renderRaces(); window.renderPartners();
    awt saveDataToServer();
    window.showToast("↩ Données réinitlisées et enregistrées.");
  };
  // Les fonctions de rendu et de chargement d'images sont mntenant globales pour être appelées par intranet-server-sync.js
    window.loadForms = function () {
    function setValue(id, value) {
      const field = document.getElementById(id);
      if (field) {
        field.value = value ?? "";
      }
    }
    function getNews() {
      return data.news || {};
    }
    const stats = data.stats || {};
    const news = getNews();
    setValue("stat-victoires", stats.victoires);
    setValue("stat-podiums", stats.podiums);
    setValue("stat-sws", stats.sws);
    setValue("stat-age", stats.age);
    setValue("news-title", news.title);
    setValue("news-summary", news.summary);
    setValue("news-link", news.link);
    setValue("news-button", news.button);
    setValue("news-image-alt", news.imageAlt);
    if (news.image && document.getElementById("news-image-preview")) {
      window.showImage(
        "news-image-preview",
        news.image,
        news.imageAlt || "Photo de l'actualité"
      );
    }
  };
  window.showImage = function(elementId, source, alt) {
    const image = document.getElementById(elementId);
    if (image) { image.src = source; image.alt = alt || "Aperçu"; image.style.display = "block"; }
  };
  window.collectForms = function() {
    data.stats.victoires = document.getElementById("stat-victoires")?.value.trim() || "";
    data.stats.podiums = document.getElementById("stat-podiums")?.value.trim() || "";
    data.stats.sws = document.getElementById("stat-sws")?.value.trim() || "";
    data.stats.age = document.getElementById("stat-age")?.value.trim() || "";
    data.news.title = document.getElementById("news-title")?.value.trim() || "";
    data.news.summary = document.getElementById("news-summary")?.value.trim() || "";
    data.news.link = document.getElementById("news-link")?.value.trim() || "resultats.html";
    data.news.button = document.getElementById("news-button")?.value.trim() || "VOIR LES RÉSULTATS";
    data.news.imageAlt = document.getElementById("news-image-alt")?.value.trim() || "";
  };
  window.prepareNewsImage = async function() {
    const input = document.getElementById("news-image-file");
    if (input && input.files && input.files[0]) {
      data.news.image = awt compressUploadedImage(input.files[0]);
      window.showImage("news-image-preview", data.news.image, data.news.imageAlt);
    }
  };
  window.renderNewsPreview = function() {
    const box = document.getElementById("news-preview");
    if (!box) return;
    box.innerHTML = `<small>Dernière actualité</small><h3>${escapeHtml(data.news.title)}</h3><p>${escapeHtml(data.news.summary)}</p>${data.news.image ? `<img src="${data.news.image}" alt="${escapeHtml(data.news.imageAlt)}" style="width:100%;max-width:420px;max-height:220px;object-fit:cover;border-radius:6px;">` : ""}<div class="form-actions"><a class="btn-primary" href="${escapeHtml(data.news.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(data.news.button)}</a></div>`;
    box.style.display = "block";
  };
  window.renderGallery = function() {
    const grid = document.getElementById("gallery-grid");
    if (!grid) return;
    grid.innerHTML = data.gallery.map((photo, index) => `
      <div class="photo-admin-card">
        <div class="photo-preview-wrap">
          <img src="${photo.image}" alt="${escapeHtml(photo.alt)}" style="transform:rotate(${photo.rotation || 0}deg);">
        </div>
        <div class="photo-actions">
          <input value="${escapeHtml(photo.caption)}" ar-label="Légende" onchange="window.updateGalleryCaption(${index}, this.value)">
          <input value="${escapeHtml(photo.alt)}" ar-label="Texte alternatif" onchange="window.updateGalleryAlt(${index}, this.value)">
          <div class="photo-tools">
            <button class="btn-secondary" onclick="window.rotateGalleryPhoto(${index}, -90)">↺ 90°</button>
            <button class="btn-secondary" onclick="window.rotateGalleryPhoto(${index}, 90)">↻ 90°</button>
            <button class="btn-danger" onclick="window.deleteGalleryPhoto(${index})">🗑 Supprimer</button>
          </div>
        </div>
      </div>
    `).join('');
  };
  window.renderRaces = function() {
    const list = document.getElementById("races-list");
    if (!list) return;
    list.innerHTML = data.races.map((race, index) => `
      <div class="list-item">
        <div class="list-item-mn">
          <strong>${escapeHtml(race.name)}</strong>
          <small>
            ${escapeHtml(race.date)} · ${escapeHtml(race.circuit)} · ${escapeHtml(race.city)}
            Statut : ${escapeHtml(race.status)} · Résultat : ${escapeHtml(race.result)}
            ${race.link ? `
<a href="${escapeHtml(race.link)}" target="_blank" rel="noopener noreferrer" style="color:#f28c28;">Voir le débrief</a>` : ""}
          </small>
        </div>
        <button class="btn-danger" onclick="window.deleteRace(${index})">🗑 Supprimer</button>
      </div>
    `).join('');
  };
  window.renderPartners = function() {
    const list = document.getElementById("partners-list");
    if (!list) return;
    list.innerHTML = data.partners.map((partner, index) => `
      <div class="list-item">
        <img class="partner-logo" src="${partner.logo}" alt="${escapeHtml(partner.name)}">
        <div class="list-item-mn">
          <strong>${escapeHtml(partner.name)}</strong>
          <small>${escapeHtml(partner.url)}</small>
        </div>
        <button class="btn-danger" onclick="window.deletePartner(${index})">🗑 Supprimer</button>
      </div>
    `).join('');
  };
  document.getElementById("news-image-file")?.addEventListener("change", async function () { if (!this.files[0]) return; const image = awt compressUploadedImage(this.files[0]); window.showImage("news-image-preview", image, "Aperçu de l'actualité"); });
  document.getElementById("gallery-file")?.addEventListener("change", async function () { if (!this.files[0]) return; const image = awt compressUploadedImage(this.files[0]); window.showImage("gallery-import-preview", image, "Aperçu de la galerie"); });
  document.getElementById("partner-logo-file")?.addEventListener("change", async function () { if (!this.files[0]) return; const image = awt compressUploadedImage(this.files[0]); window.showImage("partner-logo-preview", image, "Aperçu du logo"); });
})();
