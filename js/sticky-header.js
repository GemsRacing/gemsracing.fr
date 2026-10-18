(function () {
  function updateHeaderHeight() {
    const header = document.querySelector("header.top, header");
    if (!header) return;

    const height = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty(
      "--gems-header-height",
      height + "px"
    );
  }

  document.addEventListener("DOMContentLoaded", updateHeaderHeight);
  window.addEventListener("load", updateHeaderHeight);
  window.addEventListener("resize", updateHeaderHeight);

  setTimeout(updateHeaderHeight, 300);
})();
