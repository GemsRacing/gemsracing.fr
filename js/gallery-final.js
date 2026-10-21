document.addEventListener("DOMContentLoaded", function () {
    const grid = document.getElementById("gems-dynamic-gallery-grid");
    const lightbox = document.getElementById("gems-lightbox");
    const lightboxImg = document.getElementById("gems-lightbox-image");
    const closeBtn = document.querySelector(".gems-gallery-close");

    if (!grid) return;

    // Photos officielles de Gems (garanties d'affichage)
    const defaultPhotos = [
        {
            src: "assets/images/gems-portrait.jpg",
            title: "Gems Maréchal",
            caption: "Portrait officiel en tenue de pilote"
        },
        {
            src: "assets/images/gems-social-preview.jpg",
            title: "En piste",
            caption: "Session karting SWS en compétition"
        },
        {
            src: "assets/images/gems-course-01.jpg",
            title: "Course SWS",
            caption: "Bataille pour la victoire sur le circuit"
        },
        {
            src: "assets/images/gems-paddock.jpg",
            title: "Paddock & Préparation",
            caption: "Concentration avant le départ"
        }
    ];

    // Récupération des photos depuis l'intranet (si existantes) ou fallback
    let photos = defaultPhotos;
    try {
        const stored = localStorage.getItem("gems_gallery_photos");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
                photos = parsed;
            }
        }
    } catch (e) {
        console.warn("Utilisation des photos par défaut", e);
    }

    // Génération de la galerie
    grid.innerHTML = "";
    photos.forEach(function (photo) {
        const card = document.createElement("div");
        card.className = "gems-gallery-item";
        card.style.cursor = "pointer";

        card.innerHTML = `
            <div class="gems-gallery-thumb" style="overflow:hidden; border-radius:12px; position:relative; background:#071b35;">
                <img src="${photo.src}" 
                     alt="${photo.title || 'Photo Gems Racing'}" 
                     loading="lazy" 
                     style="width:100%; height:260px; object-fit:cover; display:block; transition:transform 0.3s ease;"
                     onerror="this.onerror=null; this.src='assets/images/gems-portrait.jpg';">
                <div class="gems-gallery-overlay" style="position:absolute; bottom:0; left:0; right:0; padding:15px; background:linear-gradient(to top, rgba(5,19,38,0.95), transparent); color:#fff;">
                    <strong style="display:block; font-size:15px; color:#f28c28;">${photo.title || ''}</strong>
                    <span style="font-size:12px; opacity:0.85;">${photo.caption || ''}</span>
                </div>
            </div>
        `;

        // Effet de zoom au survol
        const img = card.querySelector("img");
        card.addEventListener("mouseenter", () => { img.style.transform = "scale(1.05)"; });
        card.addEventListener("mouseleave", () => { img.style.transform = "scale(1)"; });

        // Ouverture dans la lightbox
        card.addEventListener("click", function () {
            if (lightbox && lightboxImg) {
                lightboxImg.src = photo.src;
                lightboxImg.alt = photo.title || "Photo agrandie";
                lightbox.classList.add("is-active");
                lightbox.style.display = "flex";
            }
        });

        grid.appendChild(card);
    });

    // Fermeture de la lightbox
    if (lightbox) {
        function closeLightbox() {
            lightbox.classList.remove("is-active");
            lightbox.style.display = "none";
            if (lightboxImg) lightboxImg.src = "";
        }

        if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", function (e) {
            if (e.target === lightbox || e.target === closeBtn) {
                closeLightbox();
            }
        });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeLightbox();
        });
    }
});
