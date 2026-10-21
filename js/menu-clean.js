/* ============================================================
   MENU MOBILE GEMS RACING - SITE PUBLIC
   (Logique JavaScript finale)
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".menu");

  if (!toggle || !menu) {
    console.warn("Menu toggle ou menu introuvable. Le script de menu mobile ne peut pas s'initialiser.");
    return;
  }

  toggle.addEventListener("click", function (event) {
    event.preventDefault(); // Empêche le comportement par défaut du bouton
    event.stopPropagation(); // Empêche le clic de se propager au document

    const isOpen = menu.classList.toggle("is-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Fermer le menu" : "Ouvrir le menu"
    );
    toggle.textContent = isOpen ? "✕" : "☰"; // Caractères UTF-8 corrects
  });

  // Fermer le menu si on clique sur un lien du menu
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
      toggle.textContent = "☰"; // Caractère UTF-8 correct
    });
  });

  // Fermer le menu si on clique en dehors du menu (sur le reste du document)
  document.addEventListener("click", function (event) {
    if (menu.classList.contains("is-open") && !menu.contains(event.target) && !toggle.contains(event.target)) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
      toggle.textContent = "☰";
    }
  });
});
