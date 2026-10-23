(function () {
    "use strict";

    const AUTH_KEY = "gems_auth_v2";
    const PASSWORD = "GemsRacing88";

    window.gemsData = {
        stats: {},
        news: {},
        gallery: [],
        races: [],
        partners: [],
        tickets: [] // Ajout pour le système de messages
    };

    let editingNewsIndex = null;
    let editingRaceIndex = null;
    let editingPartnerIndex = null;

    // --- UTILITIES ---
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

    function toast(message, color = "#2ecc71") {
        const element = document.getElementById("toast");
        if (!element) return;
        element.textContent = message;
        element.style.background = color;
        element.style.display = "block";
        setTimeout(() => element.style.display = "none", 3000);
    }

    function normalizeData(data) {
        return {
            stats: data?.stats || {},
            news: data?.news || {},
            gallery: Array.isArray(data?.gallery) ? data.gallery : [],
            races: Array.isArray(data?.races) ? data.races : [],
            partners: Array.isArray(data?.partners) ? data.partners : [],
            tickets: Array.isArray(data?.tickets) ? data.tickets : [] // Normalisation pour les tickets
        };
    }

    async function readImage(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }

            if (!file.type || !file.type.startsWith("image/")) {
                reject(new Error("Le fichier sélectionné n'est pas une image."));
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                const image = new Image();

                image.onload = () => {
                    const maxSize = 1400; // Largeur/hauteur max pour la compression
                    const ratio = Math.min(
                        1,
                        maxSize / Math.max(image.width, image.height)
                    );

                    const canvas = document.createElement("canvas");
                    canvas.width = Math.max(1, Math.round(image.width * ratio));
                    canvas.height = Math.max(1, Math.round(image.height * ratio));

                    const context = canvas.getContext("2d");
                    context.drawImage(
                        image,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    // Compression JPEG à 75 % pour réduire la taille envoyée
                    resolve(canvas.toDataURL("image/jpeg", 0.75));
                };

                image.onerror = () => {
                    reject(new Error("Impossible de traiter l'image."));
                };

                image.src = reader.result;
            };

            reader.onerror = () => {
                reject(new Error("Impossible de lire l'image."));
            };

            reader.readAsDataURL(file);
        });
    }

    // --- DATA LOADING & SAVING ---
    async function loadData() {
        try {
            const response = await fetch("/api/data", { cache: "no-store" });
            if (!response.ok) throw new Error("API indisponible : " + response.status);
            window.gemsData = normalizeData(await response.json());
            console.log("Données serveur chargées :", window.gemsData);
            renderAll();
        } catch (error) {
            console.error(error);
            toast("⚠️ Les données n'ont pas pu être chargées.");
        }
    }

    async function saveData() {
        let token = sessionStorage.getItem("gems_admin_token");
        if (!token) {
            token = prompt("🔒 Sécurité : Entrez votre ADMIN_TOKEN pour publier en ligne :");
            if (!token) return;
            sessionStorage.setItem("gems_admin_token", token);
        }

        toast("⏳ Publication en cours...", "#f28c28");
        collectForms(); // Collect all form data before saving

        try {
            const response = await fetch("/api/data", {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Admin-Token": token },
                body: JSON.stringify(window.gemsData)
            });

            const responseText = await response.text(); // Get raw response text for better error info

            if (response.ok) {
                toast("✅ PUBLIÉ AVEC SUCCÈS !");
                renderAll(); // Re-render to show saved state
            } else {
                sessionStorage.removeItem("gems_admin_token");
                console.error("Erreur API :", response.status, responseText);
                alert("❌ Erreur serveur " + response.status + " : " + responseText);
                toast("Erreur de publication", "#e74c3c");
            }
        } catch (error) {
            console.error(error);
            alert("❌ Erreur réseau ou de publication.");
            toast("Erreur réseau", "#e74c3c");
        }
    }

    // Alias utilisé par le bouton ENREGISTRER & PUBLIER dans intranet.html
    window.saveAllData = saveData;

    // --- AUTHENTICATION & NAVIGATION ---
    window.checkPass = function () {
        const input = document.getElementById("pass-input");
        const overlay = document.getElementById("login-overlay");
        if ((input?.value || "") !== PASSWORD) {
            alert("Mot de passe incorrect.");
            return;
        }
        sessionStorage.setItem(AUTH_KEY, "true");
        if (overlay) overlay.style.display = "none";
        document.body.classList.remove("is-locked");
    };

    window.logoutIntranet = function () {
        sessionStorage.removeItem(AUTH_KEY);
        window.location.reload();
    };

    window.showTab = function (name, item) {
        document.querySelectorAll(".tab-content").forEach(tab => tab.hidden = true);
        document.querySelectorAll(".intra-nav-item").forEach(nav => nav.classList.remove("active"));
        const target = document.getElementById("tab-" + name);
        if (target) target.hidden = false;
        if (item) item.classList.add("active");
    };

    // --- FORM DATA COLLECTION ---
    function collectForms() {
        // Collect Stats
        window.gemsData.stats = {
            ...(window.gemsData.stats || {}),
            victoires: value("stat-victoires"),
            podiums: value("stat-podiums"),
            sws: value("stat-sws"),
            age: value("stat-age")
        };

        // Collect News
        window.gemsData.news = {
            ...(window.gemsData.news || {}),
            title: value("news-title"),
            summary: value("news-summary"),
            link: value("news-link") || "resultats.html",
            button: value("news-button") || "VOIR LES RÉSULTATS"
        };
    }

      // --- NEWS MANAGEMENT (AVEC SUPPORT PHOTO) ---
  window.renderNews = function () {
      const list = document.getElementById("news-list-admin");
      if (!list) return;
      const news = window.gemsData.news;
      if (!news || !news.title) {
          list.innerHTML = "<p style='color:rgba(255,255,255,0.6); font-size:14px;'>Aucune actualité publiée actuellement.</p>";
          return;
      }
      list.innerHTML = `
          <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; background:#071b35; border:1px solid rgba(255,255,255,0.08); border-radius:8px; margin-top:15px;">
              <div style="display:flex; align-items:center; gap:14px; min-width:0; flex-grow:1;">
                  ${news.image ? `<img src="${escapeHtml(news.image)}" alt="${escapeHtml(news.title)}" style="width:52px; height:52px; object-fit:cover; border-radius:6px; flex-shrink:0; border:1px solid rgba(242,140,40,0.5);">` : ''}
                  <div class="list-item-main" style="min-width:0;">
                      <strong style="color:#fff; font-size:15px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(news.title)}</strong>
                      <small style="color:rgba(255,255,255,0.65); font-size:12px; display:block; margin-top:2px;">
                          ${escapeHtml(news.summary || '')} · <span style="color:#f28c28;">${escapeHtml(news.link || '')}</span>
                      </small>
                  </div>
              </div>
              <div class="list-actions" style="display:flex; gap:8px; flex-shrink:0;">
                  <button type="button" class="btn-secondary" style="font-size:12px; padding:6px 12px; border:1px solid #f28c28; color:#f28c28; background:transparent; border-radius:6px; cursor:pointer;" onclick="window.editNews()">✏️ Modifier</button>
                  <button type="button" class="btn-danger" style="font-size:12px; padding:6px 12px; background:#e74c3c; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="window.deleteNews()">🗑 Supprimer</button>
              </div>
          </div>
      `;
  };

  window.addNews = async function () {
      let imageUrl = value("news-image") || "";
      const fileInput = document.getElementById("news-image-file");
      if (fileInput && fileInput.files && fileInput.files[0]) {
          try {
              imageUrl = await readImage(fileInput.files[0]);
          } catch (e) {
              console.warn("Erreur lecture image actu :", e);
          }
      }

      const title = value("news-title");
      const summary = value("news-summary");
      const link = value("news-link");
      const button = value("news-button") || "VOIR LE DÉBRIEF";

      if (!title) {
          toast("ℹ️ Indique au moins un titre d'actualité.");
          return;
      }

      window.gemsData.news = {
          title: title,
          summary: summary,
          link: link,
          button: button,
          image: imageUrl
      };

      window.renderNews();
      resetNewsForm();
      await saveData();
      toast("✅ Actualité enregistrée !");
  };

  window.editNews = function () {
      const news = window.gemsData.news || {};
      setValue("news-title", news.title || "");
      setValue("news-summary", news.summary || "");
      setValue("news-link", news.link || "");
      setValue("news-button", news.button || "VOIR LE DÉBRIEF");
      setValue("news-image", news.image || "");

      const imgPrev = document.getElementById("news-image-preview-img");
      if (imgPrev) {
          if (news.image) {
              imgPrev.src = news.image;
              imgPrev.style.display = "block";
          } else {
              imgPrev.style.display = "none";
          }
      }

      const pubBtn = document.querySelector("#tab-news .btn-primary");
      if (pubBtn) pubBtn.textContent = "💾 METTRE À JOUR L'ACTUALITÉ";

      document.getElementById("tab-news")?.scrollIntoView({ behavior: "smooth" });
  };

  function resetNewsForm() {
      setValue("news-title", "");
      setValue("news-summary", "");
      setValue("news-link", "");
      setValue("news-button", "VOIR LE DÉBRIEF");
      setValue("news-image", "");

      const fileInput = document.getElementById("news-image-file");
      if (fileInput) fileInput.value = "";
      const imgPrev = document.getElementById("news-image-preview-img");
      if (imgPrev) imgPrev.style.display = "none";

      const pubBtn = document.querySelector("#tab-news .btn-primary");
      if (pubBtn) pubBtn.textContent = "➕ PUBLIER L'ACTUALITÉ";
  }

  window.deleteNews = async function () {
      if (!confirm("Supprimer cette actualité ?")) return;
      window.gemsData.news = {};
      window.renderNews();
      resetNewsForm();
      await saveData();
      toast("✅ Actualité supprimée !");
  };

  // --- GALLERY MANAGEMENT ---
    window.renderGallery = function () {
        const grid = document.getElementById("gallery-grid");
        if (!grid) return;
        const gallery = window.gemsData.gallery || [];

        if (!gallery.length) {
            grid.innerHTML = "<p>Aucune photo enregistrée.</p>";
            return;
        }

        grid.innerHTML = gallery.map((photo, index) => {
            const rotationStyle = photo.rotation ? `transform: rotate(${photo.rotation}deg);` : '';
            return `
                <div class="photo-admin-card">
                    <div class="photo-preview-wrap">
                        <img
                            src="${photo.image || ""}"
                            alt="${escapeHtml(photo.alt || photo.caption || "Photo de Gems")}"
                            style="width:100%;max-height:180px;object-fit:cover; ${rotationStyle}">
                    </div>

                    <div class="photo-actions">
                        <input
                            value="${escapeHtml(photo.caption || "")}"
                            aria-label="Légende"
                            onchange="window.updateGalleryCaption(${index}, this.value)">
                        <div class="photo-tools">
                            <button
                                type="button"
                                class="btn-icon"
                                onclick="window.rotateGalleryPhoto(${index}, -90)">
                                ↺
                            </button>
                            <button
                                type="button"
                                class="btn-danger"
                                onclick="window.deleteGalleryPhoto(${index})">
                                🗑 Supprimer
                            </button>
                            <button
                                type="button"
                                class="btn-icon"
                                onclick="window.rotateGalleryPhoto(${index}, 90)">
                                ↻
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    };

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
                id: Date.now(), // Unique ID
                image: image,
                caption: caption,
                alt: caption || "Photo de Gems",
                rotation: 0
            });

            input.value = ""; // Clear file input
            setValue("gallery-caption", ""); // Clear caption input

            window.renderGallery();
            await saveData();
        } catch (error) {
            console.error(error);
            toast("❌ Impossible d'importer cette photo.");
        }
    };

    window.updateGalleryCaption = async function (index, caption) {
        if (!window.gemsData.gallery[index]) return;
        window.gemsData.gallery[index].caption = caption;
        try { await saveData(); } catch (error) {
            console.error(error);
            toast("❌ Légende non enregistrée.");
        }
    };

    window.rotateGalleryPhoto = async function (index, degrees) {
        if (!window.gemsData.gallery[index]) return;
        let currentRotation = window.gemsData.gallery[index].rotation || 0;
        window.gemsData.gallery[index].rotation = (currentRotation + degrees) % 360;
        window.renderGallery();
        try { await saveData(); } catch (error) {
            console.error(error);
            toast("❌ Rotation non enregistrée.");
        }
    };

    window.deleteGalleryPhoto = async function (index) {
        if (!confirm("Supprimer cette photo ?")) return;
        window.gemsData.gallery.splice(index, 1);
        window.renderGallery();
        await saveData();
    };

    // --- RACES MANAGEMENT ---
  window.renderRaces = function () {
      const list = document.getElementById("races-list");
      if (!list) return;
      const races = window.gemsData.races || [];
      if (!races.length) {
          list.innerHTML = "<p style='color:rgba(255,255,255,0.6); font-size:14px;'>Aucune course enregistrée.</p>";
          return;
      }
      list.innerHTML = races.map((race, index) => `
          <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; background:#071b35; border:1px solid rgba(255,255,255,0.08); border-radius:8px; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:14px; min-width:0; flex-grow:1;">
                  ${race.image ? `<img src="${escapeHtml(race.image)}" alt="${escapeHtml(race.name || 'Course')}" style="width:52px; height:52px; object-fit:cover; border-radius:6px; flex-shrink:0; border:1px solid rgba(242,140,40,0.5);">` : ''}
                  <div class="list-item-main" style="min-width:0;">
                      <strong style="color:#fff; font-size:15px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(race.name || "Course sans titre")}</strong>
                      <small style="color:rgba(255,255,255,0.65); font-size:12px; display:block; margin-top:2px;">
                          📅 ${escapeHtml(race.date || "Date à venir")}${race.time ? ' à ' + escapeHtml(race.time) : ''} · 📍 ${escapeHtml(race.circuit || race.city || "Circuit non précisé")} · <span style="color:#f28c28; font-weight:700;">${escapeHtml(race.status || "Programmé")}</span>${race.result ? ' · 🏆 ' + escapeHtml(race.result) : ''}
                      </small>
                  </div>
              </div>
              <div class="list-actions" style="display:flex; gap:8px; flex-shrink:0;">
                  <button type="button" class="btn-secondary" style="font-size:12px; padding:6px 12px; border:1px solid #f28c28; color:#f28c28; background:transparent; border-radius:6px; cursor:pointer;" onclick="window.editRace(${index})">✏️ Modifier</button>
                  <button type="button" class="btn-danger" style="font-size:12px; padding:6px 12px; background:#e74c3c; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="window.deleteRace(${index})">🗑 Supprimer</button>
              </div>
          </div>
      `).join('');
  };

  window.deleteRace = async function (index) {
      if (!confirm("Supprimer cette course de l'agenda ?")) return;
      window.gemsData.races.splice(index, 1);
      window.renderRaces();
      await saveData();
      toast("✅ Course supprimée !");
  };

  window.addRace = async function () {
      let imageUrl = value("race-image") || "";
      const fileInput = document.getElementById("race-image-file");
      if (fileInput && fileInput.files && fileInput.files[0]) {
          try {
              imageUrl = await readImage(fileInput.files[0]);
          } catch(e) {
              console.warn("Erreur lecture image course :", e);
          }
      }

      const race = {
          date: value("race-date"),
          time: value("race-time"),
          name: value("race-name"),
          circuit: value("race-circuit"),
          city: value("race-city"),
          category: value("race-category"),
          pilots: value("race-pilots"),
          startPosition: value("race-start-position"),
          result: value("race-result"),
          bestLap: value("race-best-lap"),
          comment: value("race-comment"),
          status: value("race-status") || "Programmé",
          link: value("race-link"),
          image: imageUrl
      };

      if (!race.name && !race.circuit) {
          toast("ℹ️ Indique au moins un nom ou un circuit.");
          return;
      }

      if (editingRaceIndex !== null) {
          window.gemsData.races[editingRaceIndex] = race;
          editingRaceIndex = null;
          const addBtn = document.querySelector("#tab-races .btn-primary");
          if (addBtn) addBtn.textContent = "➕ AJOUTER LA COURSE";
      } else {
          window.gemsData.races.unshift(race);
      }

      window.renderRaces();
      resetRaceForm();
      await saveData();
      toast("✅ Course enregistrée !");
  };

  window.editRace = function (index) {
      editingRaceIndex = index;
      const race = window.gemsData.races[index];
      if (!race) return;

      setValue("race-date", race.date);
      setValue("race-time", race.time);
      setValue("race-name", race.name);
      setValue("race-circuit", race.circuit);
      setValue("race-city", race.city);
      setValue("race-category", race.category);
      setValue("race-pilots", race.pilots);
      setValue("race-start-position", race.startPosition);
      setValue("race-result", race.result);
      setValue("race-best-lap", race.bestLap);
      setValue("race-comment", race.comment);
      setValue("race-status", race.status);
      setValue("race-link", race.link);
      setValue("race-image", race.image || "");

      const imgPrev = document.getElementById("race-image-preview-img");
      if (imgPrev) {
          if (race.image) {
              imgPrev.src = race.image;
              imgPrev.style.display = "block";
          } else {
              imgPrev.style.display = "none";
          }
      }

      const addBtn = document.querySelector("#tab-races .btn-primary");
      if (addBtn) addBtn.textContent = "💾 METTRE À JOUR LA COURSE";

      document.getElementById("tab-races")?.scrollIntoView({ behavior: "smooth" });
  };

  function resetRaceForm() {
      setValue("race-date", "");
      setValue("race-time", "");
      setValue("race-name", "");
      setValue("race-circuit", "");
      setValue("race-city", "");
      setValue("race-category", "");
      setValue("race-pilots", "");
      setValue("race-start-position", "");
      setValue("race-result", "");
      setValue("race-best-lap", "");
      setValue("race-comment", "");
      setValue("race-status", "Programmé");
      setValue("race-link", "");
      setValue("race-image", "");

      const fileInput = document.getElementById("race-image-file");
      if (fileInput) fileInput.value = "";
      const imgPrev = document.getElementById("race-image-preview-img");
      if (imgPrev) imgPrev.style.display = "none";

      editingRaceIndex = null;
      const addBtn = document.querySelector("#tab-races .btn-primary");
      if (addBtn) addBtn.textContent = "➕ AJOUTER LA COURSE";
  }
  // --- PARTNERS MANAGEMENT (LOGOS PROPRES & APERÇU) ---
  window.renderPartners = function () {
      const list = document.getElementById("partners-list");
      if (!list) return;
      const partners = window.gemsData.partners || [];
      if (!partners.length) {
          list.innerHTML = "<p style='color:rgba(255,255,255,0.6); font-size:14px;'>Aucun partenaire enregistré.</p>";
          return;
      }
      list.innerHTML = partners.map((partner, index) => `
          <div class="list-item" style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 16px; background:#071b35; border:1px solid rgba(255,255,255,0.08); border-radius:8px; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:14px; min-width:0; flex-grow:1;">
                  ${partner.logo ? `<img src="${escapeHtml(partner.logo)}" alt="${escapeHtml(partner.name)}" style="width:48px; height:48px; object-fit:contain; border-radius:6px; flex-shrink:0; background:rgba(0,0,0,0.5); padding:3px; border:1px solid rgba(242,140,40,0.4);">` : '<div style="width:48px; height:48px; border-radius:6px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; color:#f28c28; font-size:20px; flex-shrink:0;">🤝</div>'}
                  <div class="list-item-main" style="min-width:0;">
                      <strong style="color:#fff; font-size:15px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(partner.name || "Partenaire sans nom")}</strong>
                      <small style="color:rgba(255,255,255,0.65); font-size:12px; display:block; margin-top:2px;">
                          <a href="${escapeHtml(partner.url || '#')}" target="_blank" rel="noopener noreferrer" style="color:#f28c28; text-decoration:none;">${escapeHtml(partner.url || 'Aucun lien')}</a>
                      </small>
                  </div>
              </div>
              <div class="list-actions" style="display:flex; gap:8px; flex-shrink:0;">
                  <button type="button" class="btn-secondary" style="font-size:12px; padding:6px 12px; border:1px solid #f28c28; color:#f28c28; background:transparent; border-radius:6px; cursor:pointer;" onclick="window.editPartner(${index})">✏️ Modifier</button>
                  <button type="button" class="btn-danger" style="font-size:12px; padding:6px 12px; background:#e74c3c; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="window.deletePartner(${index})">🗑 Supprimer</button>
              </div>
          </div>
      `).join('');
  };

  window.addPartner = async function () {
      let logoUrl = value("partner-logo-preview") || "";
      const fileInput = document.getElementById("partner-logo-file");
      if (fileInput && fileInput.files && fileInput.files[0]) {
          try {
              logoUrl = await readImage(fileInput.files[0]);
          } catch (e) {
              console.warn("Erreur lecture logo partenaire :", e);
          }
      }

      const name = value("partner-name");
      const url = value("partner-url");

      if (!name) {
          toast("ℹ️ Indique au moins le nom du partenaire.");
          return;
      }

      const partner = {
          name: name,
          url: url,
          logo: logoUrl
      };

      if (editingPartnerIndex !== null) {
          window.gemsData.partners[editingPartnerIndex] = partner;
          editingPartnerIndex = null;
          const addBtn = document.querySelector("#tab-partners .btn-primary");
          if (addBtn) addBtn.textContent = "➕ AJOUTER LE PARTENAIRE";
      } else {
          window.gemsData.partners.push(partner);
      }

      window.renderPartners();
      resetPartnerForm();
      await saveData();
      toast("✅ Partenaire enregistré !");
  };

  window.editPartner = function (index) {
      editingPartnerIndex = index;
      const partner = window.gemsData.partners[index];
      if (!partner) return;

      setValue("partner-name", partner.name || "");
      setValue("partner-url", partner.url || "");
      setValue("partner-logo-preview", partner.logo || "");

      const imgPrev = document.getElementById("partner-logo-preview-img");
      if (imgPrev) {
          if (partner.logo) {
              imgPrev.src = partner.logo;
              imgPrev.style.display = "block";
          } else {
              imgPrev.style.display = "none";
          }
      }

      const addBtn = document.querySelector("#tab-partners .btn-primary");
      if (addBtn) addBtn.textContent = "💾 METTRE À JOUR LE PARTENAIRE";

      document.getElementById("tab-partners")?.scrollIntoView({ behavior: "smooth" });
  };

  function resetPartnerForm() {
      setValue("partner-name", "");
      setValue("partner-url", "");
      setValue("partner-logo-preview", "");

      const fileInput = document.getElementById("partner-logo-file");
      if (fileInput) fileInput.value = "";
      const imgPrev = document.getElementById("partner-logo-preview-img");
      if (imgPrev) imgPrev.style.display = "none";

      editingPartnerIndex = null;
      const addBtn = document.querySelector("#tab-partners .btn-primary");
      if (addBtn) addBtn.textContent = "➕ AJOUTER LE PARTENAIRE";
  }

  window.deletePartner = async function (index) {
      if (!confirm("Supprimer ce partenaire ?")) return;
      window.gemsData.partners.splice(index, 1);
      window.renderPartners();
      await saveData();
      toast("✅ Partenaire supprimé !");
  };

          // --- MESSAGES / TICKETS MANAGEMENT (AMÉLIORÉ) ---
      window.renderTickets = function() {
          const list = document.getElementById("tickets-list");
          const badge = document.getElementById("intra-badge-tickets");
          const tickets = window.gemsData.tickets || [];

          // Mise à jour du badge de notification
          const newCount = tickets.filter(t => t.status === "Nouveau").length;
          if (badge) {
              if (newCount > 0) {
                  badge.textContent = newCount;
                  badge.style.display = "inline-block";
              } else {
                  badge.style.display = "none";
              }
          }

          if (!list) return;

          if (!tickets.length) {
              list.innerHTML = "<p style='color:rgba(255,255,255,0.6); text-align:center; padding:30px;'>Aucun message reçu pour le moment.</p>";
              return;
          }

          list.innerHTML = tickets.map((ticket, index) => {
              const isNew = ticket.status === "Nouveau";
              const borderStyle = isNew ? "border-left: 4px solid #f28c28;" : "border-left: 4px solid rgba(255,255,255,0.2);";
              const bgStyle = isNew ? "background: rgba(242, 140, 40, 0.05);" : "background: rgba(255, 255, 255, 0.02);";
              const statusBadge = isNew
                  ? `<span style="background:#f28c28; color:#071b35; font-size:11px; font-weight:800; padding:3px 8px; border-radius:10px;">NOUVEAU</span>`
                  : `<span style="background:rgba(255,255,255,0.15); color:#fff; font-size:11px; font-weight:600; padding:3px 8px; border-radius:10px;">LU</span>`;

              const mailtoLink = ticket.email ? `<a href="mailto:${encodeURIComponent(ticket.email)}?subject=Re: ${encodeURIComponent(ticket.subject || 'Votre message Gems Racing')}" class="btn-secondary" style="text-decoration:none; font-size:12px; padding:6px 12px; display:inline-flex; align-items:center; gap:4px; border:1px solid rgba(255,255,255,0.2); border-radius:6px; color:#fff;">✉️ Répondre</a>` : '';
              const telLink = ticket.phone ? `<a href="tel:${encodeURIComponent(ticket.phone)}" class="btn-secondary" style="text-decoration:none; font-size:12px; padding:6px 12px; display:inline-flex; align-items:center; gap:4px; border:1px solid rgba(255,255,255,0.2); border-radius:6px; color:#fff;">📞 Appeler</a>` : '';

              return `
              <div class="ticket-card" style="margin-bottom:14px; padding:18px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); ${borderStyle} ${bgStyle}">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                      <div>
                          <strong style="font-size:16px; color:#fff;">${escapeHtml(ticket.subject || "Sans sujet")}</strong>
                          <div style="margin-top:4px; color:rgba(255,255,255,0.8); font-size:13px;">
                              De : <b>${escapeHtml(ticket.name || "Visiteur")}</b> 
                              ${ticket.email ? `· <span style="color:#f28c28;">${escapeHtml(ticket.email)}</span>` : ''}
                              ${ticket.phone ? `· Tél : <span>${escapeHtml(ticket.phone)}</span>` : ''}
                          </div>
                          <div style="margin-top:2px; font-size:12px; color:rgba(255,255,255,0.5);">
                              Type : ${escapeHtml(ticket.contactType || "Général")} · Reçu le ${escapeHtml(ticket.date || "")} à ${escapeHtml(ticket.time || "")}
                          </div>
                      </div>
                      <div>${statusBadge}</div>
                  </div>

                  <div style="margin-top:12px; padding:12px; background:rgba(0,0,0,0.3); border-radius:8px; color:rgba(255,255,255,0.9); font-size:14px; line-height:1.5; white-space:pre-wrap;">${escapeHtml(ticket.message || "Aucun contenu")}</div>

                  <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                      ${mailtoLink}
                      ${telLink}
                      ${isNew 
                          ? `<button type="button" class="btn-primary" style="font-size:12px; padding:6px 12px;" onclick="window.markTicketAsRead(${index})">👁 Marquer comme lu</button>`
                          : `<button type="button" class="btn-secondary" style="font-size:12px; padding:6px 12px; border:1px solid rgba(255,255,255,0.2); background:transparent; color:#fff; border-radius:6px;" onclick="window.markTicketAsNew(${index})">Marquer comme non lu</button>`
                      }
                      <button type="button" class="btn-danger" style="font-size:12px; padding:6px 12px; margin-left:auto; background:#e74c3c; color:#fff; border:none; border-radius:6px; cursor:pointer;" onclick="window.deleteTicket(${index})">🗑 Supprimer</button>
                  </div>
              </div>
              `;
          }).join("");
      };

      window.markTicketAsRead = async function(index) {
          if (!window.gemsData.tickets[index]) return;
          window.gemsData.tickets[index].status = "Lu";
          window.renderTickets();
          await saveData();
          toast("✅ Message marqué comme lu !");
      };

      window.markTicketAsNew = async function(index) {
          if (!window.gemsData.tickets[index]) return;
          window.gemsData.tickets[index].status = "Nouveau";
          window.renderTickets();
          await saveData();
          toast("ℹ️ Message marqué comme nouveau !");
      };

      window.deleteTicket = async function(index) {
          if (!confirm("Supprimer définitivement ce message ?")) return;
          window.gemsData.tickets.splice(index, 1);
          window.renderTickets();
          await saveData();
          toast("✅ Message supprimé !");
      };

      window.toggleManualTicketBox = function() {
          const box = document.getElementById("manual-ticket-box");
          if (!box) return;
          box.style.display = box.style.display === "none" ? "block" : "none";
      };

      window.addManualTicket = async function() {
          const name = document.getElementById("manual-ticket-name")?.value || "";
          const email = document.getElementById("manual-ticket-email")?.value || "";
          const phone = document.getElementById("manual-ticket-phone")?.value || "";
          const subject = document.getElementById("manual-ticket-subject")?.value || "Message consigné";
          const contactType = document.getElementById("manual-ticket-type")?.value || "Partenariat";
          const message = document.getElementById("manual-ticket-message")?.value || "";

          if (!name && !message) {
              toast("⚠️ Renseigne au moins un nom ou des notes.");
              return;
          }

          const now = new Date();
          const newTicket = {
              id: Date.now(),
              name: name || "Contact direct",
              email: email,
              phone: phone,
              subject: subject,
              contactType: contactType,
              message: message,
              status: "Nouveau",
              date: now.toLocaleDateString("fr-FR"),
              time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          };

          if (!Array.isArray(window.gemsData.tickets)) {
              window.gemsData.tickets = [];
          }

          window.gemsData.tickets.unshift(newTicket);
          window.renderTickets();
          window.toggleManualTicketBox();

          // Réinitialiser les champs
          document.getElementById("manual-ticket-name").value = "";
          document.getElementById("manual-ticket-email").value = "";
          document.getElementById("manual-ticket-phone").value = "";
          document.getElementById("manual-ticket-subject").value = "";
          document.getElementById("manual-ticket-message").value = "";

          await saveData();
          toast("✅ Message enregistré dans l'intranet !");
      };

      // --- GLOBAL RENDER & INIT ---
    function renderAll() {
        // Stats
        setValue("stat-victoires", window.gemsData.stats.victoires);
        setValue("stat-podiums", window.gemsData.stats.podiums);
        setValue("stat-sws", window.gemsData.stats.sws);
        setValue("stat-age", window.gemsData.stats.age);

        // News
        setValue("news-title", window.gemsData.news.title);
        setValue("news-summary", window.gemsData.news.summary);
        setValue("news-link", window.gemsData.news.link);
        setValue("news-button", window.gemsData.news.button);

        // Render lists
        window.renderNews();
        window.renderGallery();
        window.renderRaces();
        window.renderPartners();
        window.renderTickets(); // Render tickets
    }

    document.addEventListener("DOMContentLoaded", async function () {
        const toggle = document.getElementById("toggle-password");
        const password = document.getElementById("pass-input");

        if (toggle && password) {
            toggle.addEventListener("click", () => {
                const visible = password.type === "text";
                password.type = visible ? "password" : "text";
                toggle.textContent = visible ? "Masquer" : "Afficher";
            });
            // Connexion avec la touche Entrée
            password.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    window.checkPass();
                }
            });
        }

        if (sessionStorage.getItem(AUTH_KEY) === "true") {
            document.getElementById("login-overlay").style.display = "none";
            document.body.classList.remove("is-locked");
        }

        await loadData();
        // Set initial tab to "scoring" if no active item, otherwise use active item
        const activeTabItem = document.querySelector(".intra-nav-item.active");
        window.showTab("scoring", activeTabItem || document.querySelector(".intra-nav-item[onclick*='scoring']"));
    });

    // Menu hamburger mobile
    document.addEventListener("DOMContentLoaded", function () {
        const mobileToggle = document.getElementById("mobile-menu-toggle");
        const mobileSidebar = document.querySelector(".intra-sidebar");

        if (!mobileToggle || !mobileSidebar) return;

        mobileToggle.addEventListener("click", function () {
            const isOpen = mobileSidebar.classList.toggle("is-open");

            document.body.classList.toggle("mobile-menu-open", isOpen);
            mobileToggle.setAttribute("aria-expanded", String(isOpen));
            mobileToggle.textContent = isOpen ? "✕" : "☰";
        });

        mobileSidebar.addEventListener("click", function (event) {
            if (event.target.closest(".intra-nav-item")) {
                mobileSidebar.classList.remove("is-open");
                document.body.classList.remove("mobile-menu-open");
                mobileToggle.setAttribute("aria-expanded", "false");
                mobileToggle.textContent = "☰";
            }
        });
    });
    // Menu hamburger mobile
    document.addEventListener("DOMContentLoaded", function () {
        const mobileToggle = document.getElementById("mobile-menu-toggle");
        const mobileSidebar = document.querySelector(".intra-sidebar");

        if (!mobileToggle || !mobileSidebar) return;

        mobileToggle.addEventListener("click", function () {
            const isOpen = mobileSidebar.classList.toggle("is-open");
            document.body.classList.toggle("mobile-menu-open", isOpen);
            mobileToggle.setAttribute("aria-expanded", String(isOpen));
            mobileToggle.textContent = isOpen ? "✕" : "☰";
        });

        // Fermer le menu si on clique sur un élément du menu
        mobileSidebar.querySelectorAll(".intra-nav-item").forEach(item => {
            item.addEventListener("click", function () {
                mobileSidebar.classList.remove("is-open");
                document.body.classList.remove("mobile-menu-open");
                mobileToggle.setAttribute("aria-expanded", "false");
                mobileToggle.textContent = "☰";
            });
        });

        // Fermer le menu si on clique en dehors (clic sur le contenu principal)
        document.querySelector("main.intra-content").addEventListener("click", function (event) {
            if (mobileSidebar.classList.contains("is-open")) {
                mobileSidebar.classList.remove("is-open");
                document.body.classList.remove("mobile-menu-open");
                mobileToggle.setAttribute("aria-expanded", "false");
                mobileToggle.textContent = "☰";
            }
        });
    });})();



