const menuButton = document.querySelector(".menu-button");
const primaryNav = document.querySelector("#menu-principal");

if (menuButton && primaryNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    primaryNav.classList.toggle("is-open", !isOpen);
  });

  primaryNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuButton.setAttribute("aria-expanded", "false");
      primaryNav.classList.remove("is-open");
    }
  });
}

const markExternalLinks = () => {
  document.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }

    if (url.origin === window.location.origin) {
      return;
    }

    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const currentLabel = (link.getAttribute("aria-label") || link.textContent || "").trim();
    if (currentLabel && !/s['’]obre en nova finestra/i.test(currentLabel)) {
      link.setAttribute("aria-label", `${currentLabel} (s'obre en nova finestra)`);
    }
  });
};

markExternalLinks();
