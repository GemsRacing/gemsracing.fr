/* ============================================================
   MENU MOBILE GEMS RACING - SITE PUBLIC
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector("header.top nav.menu");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();

    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
    toggle.textContent = isOpen ? "✕" : "☰";
  });

  // Fermer le menu uniquement si on clique en dehors
  document.addEventListener("click", function (event) {
    if (menu.classList.contains("is-open") && !menu.contains(event.target) && !toggle.contains(event.target)) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Ouvrir le menu");
      toggle.textContent = "☰";
    }
  });
});