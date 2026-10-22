(function () {
  function startPartnersMarquee() {
    document.querySelectorAll(".gems-partners-grid").forEach(function (grid) {
      if (grid.dataset.marqueeReady === "true") return;
      var cards = Array.prototype.slice.call(grid.children);
      if (!cards.length) return;
      cards.forEach(function (card) {
        var clone = card.cloneNode(true);
        clone.setAttribute("ar-hidden", "true");
        grid.appendChild(clone);
      });
      grid.dataset.marqueeReady = "true";
      grid.classList.add("partners-marquee-active");
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startPartnersMarquee);
  } else {
    startPartnersMarquee();
  }
  window.addEventListener("load", startPartnersMarquee);
})();

