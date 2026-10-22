(function () {
  window.showTab = function (tabName, clickedItem) {
    document.querySelectorAll(".tab-content").forEach(function (tab) {
      tab.hidden = true;
    });
    document.querySelectorAll(".intra-nav-item").forEach(function (item) {
      item.classList.remove("active");
    });
    var target = document.getElementById("tab-" + tabName);
    if (target) {
      target.hidden = false;
    }
    if (clickedItem) {
      clickedItem.classList.add("active");
    }
  };
  window.checkPass = function () {
    var input = document.getElementById("pass-input");
    if (!input) {
      return;
    }
    if (input.value === "GemsRacing88") {
      sessionStorage.setItem("gems_auth", "true");
      var overlay = document.getElementById("login-overlay");
      if (overlay) {
        overlay.style.display = "none";
      }
    } else {
      alert("Mot de passe incorrect");
      input.value = "";
      input.focus();
    }
  };
  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("pass-input");
    var loginCard = document.querySelector(".login-card");
    if (input) {
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          window.checkPass();
        }
      });
    }
    if (input && loginCard && !document.getElementById("toggle-password")) {
      var toggle = document.createElement("button");
      toggle.id = "toggle-password";
      toggle.type = "button";
      toggle.textContent = "👁 Afficher le mot de passe";
      toggle.style.cssText =
        "width:100%;margin:-8px 0 18px;padding:8px;color:#fff;" +
        "background:rgba(255,255,255,.10);" +
        "border:1px solid rgba(255,255,255,.18);" +
        "border-radius:7px;cursor:pointer;font-weight:700;";
      toggle.addEventListener("click", function () {
        if (input.type === "password") {
          input.type = "text";
          toggle.textContent = "🙈 Masquer le mot de passe";
        } else {
          input.type = "password";
          toggle.textContent = "👁 Afficher le mot de passe";
        }
      });
      input.insertAdjacentElement("afterend", toggle);
    }
    if (sessionStorage.getItem("gems_auth") === "true") {
      var overlay = document.getElementById("login-overlay");
      if (overlay) {
        overlay.style.display = "none";
      }
    }
  });
})();
