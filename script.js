const menuButton = document.querySelector(".menu-button");
const primaryNav = document.querySelector("#menu-principal");

if (menuButton && primaryNav) {
  const getNavLinks = () => Array.from(primaryNav.querySelectorAll("a"));
  const openMenu = () => {
    menuButton.setAttribute("aria-expanded", "true");
    primaryNav.classList.add("is-open");
    menuButton.classList.add("is-open");
    menuButton.setAttribute("aria-label", "Tancar menú");
    menuButton.lastChild.nodeValue = "Tancar";
  };

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
    menuButton.classList.remove("is-open");
    menuButton.setAttribute("aria-label", "Menú");
    menuButton.lastChild.nodeValue = "Menú";
  };

  const focusNavLink = (currentLink, direction) => {
    const links = getNavLinks();
    if (!links.length) return;

    const index = links.indexOf(currentLink);
    if (index === -1) return;

    const nextIndex = (index + direction + links.length) % links.length;
    links[nextIndex].focus();
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuButton.addEventListener("keydown", (event) => {
    const links = getNavLinks();
    if (!links.length) return;

    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowRight")) {
      event.preventDefault();
      openMenu();
      links[0]?.focus();
      return;
    }

    if (!isOpen) return;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      links[0]?.focus();
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      links[links.length - 1]?.focus();
    }
  });

  primaryNav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuButton.setAttribute("aria-expanded", "false");
      primaryNav.classList.remove("is-open");
      menuButton.focus();
    }
  });

  primaryNav.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLAnchorElement)) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const links = getNavLinks();
      if (event.target === links[links.length - 1]) {
        menuButton.focus();
      } else {
        focusNavLink(event.target, 1);
      }
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const links = getNavLinks();
      if (event.target === links[0]) {
        menuButton.focus();
      } else {
        focusNavLink(event.target, -1);
      }
    } else if (event.key === "Home") {
      event.preventDefault();
      getNavLinks()[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      const links = getNavLinks();
      links[links.length - 1]?.focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;

    closeMenu();
    menuButton.focus();
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

    if (!link.querySelector(".external-link-note")) {
      const note = document.createElement("span");
      note.className = "sr-only external-link-note";
      note.textContent = " (s'obre en una finestra nova)";
      link.appendChild(note);
    }
  });
};

markExternalLinks();
