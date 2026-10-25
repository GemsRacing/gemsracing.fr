document.addEventListener("DOMContentLoaded", function () {
  const dropdowns = document.querySelectorAll(".menu-dropdown");

  dropdowns.forEach(function (drop) {
    const link = drop.querySelector(".menu-dropdown-link");
    if (link) {
      link.addEventListener("click", function (e) {
        // Uniquement sur mobile
        if (window.innerWidth <= 800) {
          e.preventDefault();
          e.stopPropagation();

          // Ferme les autres pour un effet accordéon propre
          dropdowns.forEach(function (other) {
            if (other !== drop) {
              other.classList.remove("is-open");
            }
          });

          // Ouvre ou ferme le sous-menu cliqué
          drop.classList.toggle("is-open");
        }
      });
    }
  });
});