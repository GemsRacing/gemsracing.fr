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

    // --- NEWS MANAGEMENT ---
    window.renderNews = function () {
        const list = document.getElementById("news-list-admin");
        if (!list) return;
        const news = window.gemsData.news || {};

        list.innerHTML = news.title || news.summary
            ? `
                <div class="list-item ${editingNewsIndex !== null ? 'is-editing' : ''}">
                    <div class="list-item-main">
                        <strong>${escapeHtml(news.title || "Actualité sans titre")}</strong>
                        <small>${escapeHtml(news.summary || "")}</small>
                        <small>${escapeHtml(news.link || "")}</small>
                    </div>
                    <div class="list-item-actions">
                        <button type="button" class="btn-primary" onclick="window.editNews()">✏️ Modifier</button>
                        <button type="button" class="btn-danger" onclick="window.deleteNews()">🗑 Supprimer</button>
                    </div>
                </div>
            `
            : "<p>Aucune actualité enregistrée.</p>";
    };

    window.editNews = function () {
        editingNewsIndex = 0; // Only one news item
        const news = window.gemsData.news;
        setValue("news-title", news.title);
        setValue("news-summary", news.summary);
        setValue("news-link", news.link);
        setValue("news-button", news.button);
        window.renderNews(); // Re-render to show editing state
    };

    window.saveNews = async function () {
        collectForms();
        try {
            await saveData();
            editingNewsIndex = null;
            window.renderNews();
            toast("✅ Actualité enregistrée !");
        } catch (error) {
            console.error(error);
            toast("❌ Actualité non enregistrée.");
        }
    };

    window.deleteNews = async function () {
        if (!confirm("Supprimer cette actualité ?")) return;
        window.gemsData.news = {}; // Clear news
        try {
            await saveData();
            window.renderNews();
            toast("✅ Actualité supprimée !");
        } catch (error) {
            console.error(error);
            toast("❌ Suppression impossible.");
        }
    };

    window.addNews = async function () {
        if (editingNewsIndex !== null) {
            await window.saveNews();
        } else {
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
        }
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

        list.innerHTML = races.length
            ? races.map((race, index) => `
                <div class="list-item ${editingRaceIndex === index ? 'is-editing' : ''}">
                    <div class="list-item-main">
                        <strong>${escapeHtml(race.name || "Course sans nom")}</strong>
                        <small>
                            ${escapeHtml(race.date || "")} ${race.time ? ` à ${escapeHtml(race.time)}` : ''}
                            · ${escapeHtml(race.circuit || "")} (${escapeHtml(race.city || "")})
                            ${race.category ? ` · Cat: ${escapeHtml(race.category)}` : ''}
                            ${race.pilots ? ` · ${escapeHtml(race.pilots)} pilotes` : ''}
                            ${race.startPosition ? ` · Départ: ${escapeHtml(race.startPosition)}` : ''}
                            ${race.bestLap ? ` · Meilleur tour: ${escapeHtml(race.bestLap)}` : ''}
                        </small>
                        <small>
                            Statut : ${escapeHtml(race.status || "")}
                            ${race.result ? ` · Résultat : ${escapeHtml(race.result)}` : ''}
                        </small>
                        ${race.comment ? `<p>${escapeHtml(race.comment)}</p>` : ''}
                        ${race.link ? `<a href="${escapeHtml(race.link)}" target="_blank">Voir le débrief</a>` : ''}
                    </div>
                    <div class="list-item-actions">
                        <button type="button" class="btn-primary" onclick="window.editRace(${index})">✏️ Modifier</button>
                        <button type="button" class="btn-danger" onclick="window.deleteRace(${index})">🗑 Supprimer</button>
                    </div>
                </div>
            `).join("")
            : "<p>Aucune course enregistrée.</p>";
    };

    window.addRace = async function () {
        const race = {
            date: value("race-date"),
            time: value("race-time"),
            name: value("race-name") || "Course sans nom",
            circuit: value("race-circuit"),
            result: value("race-result"),
            city: value("race-city"),
            status: document.getElementById("race-status").value || "Programmé",
            category: value("race-category"),
            pilots: value("race-pilots"),
            startPosition: value("race-start-position"),
            bestLap: value("race-best-lap"),
            comment: value("race-comment"),
            link: value("race-link")
        };

        if (editingRaceIndex !== null) {
            window.gemsData.races[editingRaceIndex] = race;
            editingRaceIndex = null;
        } else {
            window.gemsData.races.push(race);
        }

        window.renderRaces();
        resetRaceForm();
        await saveData();
        toast("✅ Course enregistrée !");
    };

    window.editRace = function (index) {
        editingRaceIndex = index;
        const race = window.gemsData.races[index];
        setValue("race-date", race.date);
        setValue("race-time", race.time);
        setValue("race-name", race.name);
        setValue("race-circuit", race.circuit);
        setValue("race-result", race.result);
        setValue("race-city", race.city);
        document.getElementById("race-status").value = race.status;
        setValue("race-category", race.category);
        setValue("race-pilots", race.pilots);
        setValue("race-startPosition", race.startPosition); // Correction ici
        setValue("race-bestLap", race.bestLap); // Correction ici
        setValue("race-comment", race.comment);
        setValue("race-link", race.link);
        window.renderRaces(); // Re-render to show editing state
    };

    window.deleteRace = async function (index) {
        if (!confirm("Supprimer cette course ?")) return;
        window.gemsData.races.splice(index, 1);
        window.renderRaces();
        await saveData();
        toast("✅ Course supprimée !");
    };

    function resetRaceForm() {
        setValue("race-date", "");
        setValue("race-time", "");
        setValue("race-name", "");
        setValue("race-circuit", "");
        setValue("race-result", "");
        setValue("race-city", "");
        setValue("race-link", "");
        document.getElementById("race-status").value = "Programmé";
        setValue("race-category", "");
        setValue("race-pilots", "");
        setValue("race-start-position", "");
        setValue("race-best-lap", "");
        setValue("race-comment", "");
        editingRaceIndex = null;
    }

    // --- PARTNERS MANAGEMENT ---
    window.renderPartners = function () {
        const list = document.getElementById("partners-list");
        if (!list) return;
        const partners = window.gemsData.partners || [];

        if (!partners.length) {
            list.innerHTML = "<p>Aucun partenaire enregistré.</p>";
            return;
        }

        list.innerHTML = partners.map((partner, index) => `
                <div class="partner-admin-card ${editingPartnerIndex === index ? 'is-editing' : ''}">
                    ${
                        partner.logo
                            ? `<div class="partner-logo-wrap"><img class="partner-logo" src="${partner.logo}" alt="${escapeHtml(partner.name || "Partenaire")}"></div>`
                            : ""
                    }
                    <div class="partner-details">
                        <strong>${escapeHtml(partner.name || "Partenaire sans nom")}</strong>
                        <small>${escapeHtml(partner.url || "")}</small>
                    </div>
                    <div class="partner-actions">
                        <button type="button" class="btn-primary" onclick="window.editPartner(${index})">✏️ Modifier</button>
                        <button type="button" class="btn-danger" onclick="window.deletePartner(${index})">🗑 Supprimer</button>
                    </div>
                </div>
            `).join("");
    };

    window.addPartner = async function () {
        const input = document.getElementById("partner-logo-file");
        let logo = value("partner-logo-preview") || ""; // Use existing logo if editing and no new file
        const partnerName = value("partner-name");
        const partnerUrl = value("partner-url");

        if (input && input.files && input.files.length) {
            try {
                logo = await readImage(input.files[0]);
            } catch (error) {
                console.error(error);
                toast("❌ Impossible d'importer ce logo.");
                return;
            }
        }

        const newPartner = {
            name: partnerName || "Partenaire sans nom",
            url: partnerUrl,
            logo: logo
        };

        if (editingPartnerIndex !== null) {
            window.gemsData.partners[editingPartnerIndex] = newPartner;
            editingPartnerIndex = null;
        } else {
            window.gemsData.partners.push(newPartner);
        }

        window.renderPartners();
        resetPartnerForm();
        await saveData();
        toast("✅ Partenaire enregistré !");
    };

    window.editPartner = function (index) {
        editingPartnerIndex = index;
        const partner = window.gemsData.partners[index];
        setValue("partner-name", partner.name);
        setValue("partner-url", partner.url);
        // Display current logo for editing
        const logoPreview = document.getElementById("partner-logo-preview-img");
        if (logoPreview) logoPreview.src = partner.logo || "";
        setValue("partner-logo-preview", partner.logo || ""); // Store base64 or URL

        window.renderPartners(); // Re-render to show editing state
    };

    window.deletePartner = async function (index) {
        if (!confirm("Supprimer ce partenaire ?")) return;
        window.gemsData.partners.splice(index, 1);
        window.renderPartners();
        await saveData();
        toast("✅ Partenaire supprimé !");
    };

    function resetPartnerForm() {
        setValue("partner-name", "");
        setValue("partner-url", "");
        const partnerLogoFile = document.getElementById("partner-logo-file");
        if (partnerLogoFile) partnerLogoFile.value = "";
        const logoPreview = document.getElementById("partner-logo-preview-img");
        if (logoPreview) logoPreview.src = "";
        setValue("partner-logo-preview", "");
        editingPartnerIndex = null;
    }

    // --- MESSAGES / TICKETS MANAGEMENT ---
    // Cette section sera entièrement complétée lorsque l'API dédiée sera mise en place.
    window.renderTickets = function() {
        const list = document.getElementById("tickets-list");
        if (!list) return;
        const tickets = window.gemsData.tickets || [];

        if (!tickets.length) {
            list.innerHTML = "<p>Aucun message reçu.</p>";
            return;
        }

        list.innerHTML = tickets.map((ticket, index) => `
            <div class="list-item ${ticket.status === 'Nouveau' ? 'is-new' : ''}" style="margin-bottom:10px; border-left:${ticket.status === 'Nouveau' ? '4px solid #f28c28' : 'none'}; padding-left:${ticket.status === 'Nouveau' ? '16px' : '20px'};">
                <div class="list-item-main">
                    <strong>${escapeHtml(ticket.subject || "Sans sujet")}</strong>
                    <small>${escapeHtml(ticket.name || "Anonyme")} (${escapeHtml(ticket.email || "")})</small>
                    <small>Type: ${escapeHtml(ticket.contactType || "")} | Statut: <b>${escapeHtml(ticket.status || "Nouveau")}</b></small>
                    <p style="margin-top:5px;">${escapeHtml(ticket.message || "")}</p>
                    <small style="color:rgba(255,255,255,0.5);">Reçu le ${escapeHtml(ticket.date || "")} à ${escapeHtml(ticket.time || "")}</small>
                </div>
                <div class="list-item-actions" style="flex-direction:column; gap:5px;">
                    <button type="button" class="btn-primary" onclick="window.markTicketAsRead(${index})">👁 Lu</button>
                    <a href="mailto:${escapeHtml(ticket.email)}?subject=RE: ${escapeHtml(ticket.subject)}" target="_blank" class="btn-primary">📧 Répondre</a>
                    <button type="button" class="btn-danger" onclick="window.deleteTicket(${index})">🗑 Supprimer</button>
                </div>
            </div>
        `).join("");
    };

    window.markTicketAsRead = async function(index) {
        if (!window.gemsData.tickets[index]) return;
        window.gemsData.tickets[index].status = "Lu";
        await saveData();
        toast("✅ Message marqué comme lu !");
    };

    window.deleteTicket = async function(index) {
        if (!confirm("Supprimer ce message ?")) return;
        window.gemsData.tickets.splice(index, 1);
        await saveData();
        toast("✅ Message supprimé !");
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



