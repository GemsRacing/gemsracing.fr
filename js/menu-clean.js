document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.querySelector(".menu-toggle");
    const menu = document.querySelector("header.top nav.menu");

    if (!toggle || !menu) {
        console.warn("Menu public introuvable.");
        return;
    }

    if (toggle.dataset.menuReady === "true") return;
    toggle.dataset.menuReady = "true";

    toggle.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const opened = menu.classList.toggle("is-open");

        toggle.setAttribute("aria-expanded", String(opened));
        toggle.setAttribute(
            "aria-label",
            opened ? "Fermer le menu" : "Ouvrir le menu"
        );
        toggle.textContent = opened ? "✕" : "☰";
    });

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            menu.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Ouvrir le menu");
            toggle.textContent = "☰";
        });
    });

    document.addEventListener("click", function (event) {
        if (
            menu.classList.contains("is-open") &&
            !menu.contains(event.target) &&
            !toggle.contains(event.target)
        ) {
            menu.classList.remove("is-open");
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-label", "Ouvrir le menu");
            toggle.textContent = "☰";
        }
    });
});
