/*
  A11y Easy Checks Panel
  Bookmarklet educativo basado en W3C Easy Checks.
*/
(function () {
  "use strict";

  const PANEL_ID = "apcf-panel";
  const STYLE_ID = "apcf-styles";
  const PAGE_SHIFT = "apcf-page-shift";
  const MARK = "apcf-mark";
  const LABEL = "apcf-label";
  const FLOATING = "apcf-floating";
  const SCRIPT_BASE = (() => {
    const src = document.currentScript && document.currentScript.src;
    return src ? src.slice(0, src.lastIndexOf("/") + 1) : "";
  })();
  let markId = 0;
  let listenersReady = false;

  const profiles = [
    { id: "visual-total", short: "Sin visión", label: "Sin visión total", icon: "visual_total.svg" },
    { id: "baja-vision", short: "Baja visión", label: "Baja visión", icon: "baja_vision.svg" },
    { id: "motriz", short: "Motriz", label: "Motriz", icon: "motriz.svg" },
    { id: "auditiva", short: "Auditiva", label: "Auditiva", icon: "auditivo.svg" },
    { id: "cognitiva", short: "Cognitiva", label: "Cognitiva y aprendizaje", icon: "intelectual.svg" }
  ];

  const checks = [
    {
      id: "images",
      title: "Texto alternativo de imágenes",
      category: "Contenido",
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/images/"
    },
    {
      id: "page-title",
      title: "Título de la página",
      category: "Contenido",
      profiles: ["visual-total", "cognitiva"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/page-title/"
    },
    {
      id: "headings",
      title: "Encabezados",
      category: "Estructura",
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/headings/"
    },
    {
      id: "landmarks",
      title: "Puntos de referencia",
      category: "Estructura",
      profiles: ["visual-total", "motriz"],
      guide: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/"
    },
    {
      id: "contrast",
      title: "Contraste de color",
      category: "Visual",
      profiles: ["baja-vision", "cognitiva"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/color-contrast/"
    },
    {
      id: "link-text",
      title: "Texto de enlaces",
      category: "Contenido",
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/link-text/"
    },
    {
      id: "skip-link",
      title: "Enlace de salto",
      category: "Interacción",
      profiles: ["visual-total", "motriz"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/skip-link/"
    },
    {
      id: "language",
      title: "Idioma de la página",
      category: "Contenido",
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/language/"
    },
    {
      id: "grayscale",
      title: "Blanco y negro",
      category: "Visual",
      profiles: ["baja-vision"],
      guide: "Simula una vista sin color."
    },
    {
      id: "audio",
      title: "Audio",
      category: "Audio y video",
      profiles: ["visual-total", "auditiva", "cognitiva"],
      guide: "https://www.w3.org/WAI/media/av/transcripts/"
    },
    {
      id: "video",
      title: "Vídeo",
      category: "Audio y video",
      profiles: ["visual-total", "auditiva", "cognitiva"],
      guide: "https://www.w3.org/WAI/media/av/"
    },
    {
      id: "form-labels",
      title: "Etiquetas",
      category: "Formularios",
      profiles: ["visual-total", "motriz", "cognitiva"],
      wcag: "1.3.1, 3.3.2",
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/forms/"
    },
    {
      id: "form-required",
      title: "Campos obligatorios",
      category: "Formularios",
      profiles: ["visual-total", "baja-vision", "motriz", "cognitiva"],
      wcag: "3.3.2",
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/forms/"
    },
    {
      id: "focus-order",
      title: "Orden de foco",
      category: "Interacción",
      profiles: ["visual-total", "motriz"],
      guide: "https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html"
    },
    {
      id: "focus-visible",
      title: "Forzar foco",
      category: "Interacción",
      profiles: ["visual-total", "baja-vision", "motriz"],
      guide: "https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html"
    },
    {
      id: "zoom",
      title: "Zoom",
      category: "Visual",
      profiles: ["baja-vision"],
      guide: "https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html"
    },
    {
      id: "form-errors",
      title: "Errores",
      category: "Formularios",
      profiles: ["visual-total", "baja-vision", "cognitiva"],
      wcag: "3.3.1, 3.3.3",
      guide: "https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html"
    }
  ];

  const state = {
    profile: "visual-total",
    active: new Set(),
    results: [],
    lastCheck: "",
    wandVisible: true,
    headingsVisible: true,
    landmarksVisible: true,
    hiddenPanels: new Set(),
    currentPanelId: "",
    grayscale: false
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.${PAGE_SHIFT} {
        padding-left: min(430px, 100vw) !important;
        box-sizing: border-box !important;
      }

      html.${PAGE_SHIFT} body {
        margin-left: 0 !important;
        max-width: calc(100vw - min(430px, 100vw)) !important;
        box-sizing: border-box !important;
        overflow-x: auto !important;
      }

      #${PANEL_ID} {
        all: initial;
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 2147483647;
        width: min(430px, 100vw);
        height: 100vh;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        background: #f7f7f5;
        color: #171717;
        border-right: 1px solid #d7d7d2;
        box-shadow: 16px 0 40px rgb(0 0 0 / .2);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      #${PANEL_ID} *, #${PANEL_ID} *::before, #${PANEL_ID} *::after {
        box-sizing: border-box;
        font-family: inherit;
      }

      #${PANEL_ID} button, #${PANEL_ID} input { font: inherit; }

      #${PANEL_ID} .apcf-header {
        min-height: 104px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: .75rem;
        align-items: center;
        padding: .9rem;
        background: #831451;
        color: white;
      }

      #${PANEL_ID} .apcf-title {
        margin: 0;
        color: white;
        font-size: 1.6rem;
        line-height: 1.05;
        font-weight: 950;
      }

      #${PANEL_ID} .apcf-title-row {
        display: flex;
        align-items: center;
        gap: .45rem;
        flex-wrap: wrap;
      }

      #${PANEL_ID} .apcf-beta {
        color: #ffffff;
        font-size: 1.05rem;
        line-height: 1;
        font-weight: 950;
      }

      #${PANEL_ID} .apcf-subtitle {
        display: block;
        margin-top: .12rem;
        color: rgb(255 255 255 / .92);
        font-size: .96rem;
        font-weight: 800;
      }

      #${PANEL_ID} .apcf-close {
        min-width: 2.75rem;
        min-height: 2.75rem;
        border: 3px solid rgb(255 255 255 / .32);
        border-radius: 999px;
        background: rgb(255 255 255 / .1);
        color: white;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
      }

      #${PANEL_ID} .apcf-status {
        min-height: 4.2rem;
        padding: .8rem .95rem;
        border-bottom: 1px solid #dadad7;
        background: #fff8e7;
        color: #312200;
        font-size: 1rem;
        line-height: 1.3;
        font-weight: 850;
      }

      #${PANEL_ID} .apcf-status strong { display: block; color: #111; font-size: 1.08rem; }
      #${PANEL_ID} .apcf-status span { display: block; margin-top: .15rem; color: #5b4712; font-weight: 750; font-size: .98rem; }

      #${PANEL_ID} .apcf-list {
        overflow: auto;
        min-height: 0;
        padding: .75rem .85rem 1rem;
      }

      #${PANEL_ID} .apcf-group-title {
        margin: 1rem 0 .55rem;
        color: #831451;
        font-size: 1.08rem;
        font-weight: 1000;
        letter-spacing: .01em;
        text-transform: uppercase;
      }

      #${PANEL_ID} .apcf-check-shell {
        width: 100%;
        margin: 0;
      }

      #${PANEL_ID} .apcf-check {
        width: 100%;
        min-height: 4.15rem;
        display: grid;
        grid-template-columns: 1.35rem 1fr auto;
        gap: .7rem;
        align-items: center;
        margin: .45rem 0;
        border: 2px solid #bdbdb8;
        border-radius: .95rem;
        background: #fbfbf9;
        color: #171717;
        padding: .82rem .78rem;
        text-align: left;
        cursor: pointer;
        box-shadow: 0 7px 18px rgb(0 0 0 / .09);
      }

      #${PANEL_ID} .apcf-check[aria-pressed="true"] {
        border-color: #171717;
        background: #fff4cc;
        box-shadow: 0 0 0 4px rgb(247 189 61 / .36), 0 7px 18px rgb(0 0 0 / .1);
        outline: 3px solid #f7bd3d;
        outline-offset: -2px;
      }

      #${PANEL_ID} .apcf-option-dot {
        width: 1.25rem;
        height: 1.25rem;
        border: 3px solid #8a8a84;
        border-radius: 999px;
        background: white;
      }

      #${PANEL_ID} .apcf-check[aria-pressed="true"] .apcf-option-dot {
        border: 5px solid #171717;
        background: #f7bd3d;
      }

      #${PANEL_ID} .apcf-check-title {
        color: #171717;
        font-size: 1.06rem;
        line-height: 1.15;
        font-weight: 800;
      }

      #${PANEL_ID} .apcf-switch {
        min-width: 3.2rem;
        border-radius: 999px;
        background: #e4e4df;
        color: #42423e;
        padding: .34rem .5rem;
        font-size: .84rem;
        font-weight: 950;
        text-align: center;
      }

      #${PANEL_ID} .apcf-check[aria-pressed="true"] .apcf-switch {
        background: #171717;
        color: #ffffff;
      }

      #${PANEL_ID} .apcf-beta {
        display: inline-flex;
        align-items: center;
        gap: .35rem;
        border-radius: 999px;
        background: #fff0a8;
        color: #171717;
        padding: .2rem .55rem;
        font-size: .82rem;
        font-weight: 1000;
        letter-spacing: 0;
      }

      #${PANEL_ID} .apcf-version {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: #171717;
        color: #ffffff;
        padding: .2rem .55rem;
        font-size: .82rem;
        font-weight: 950;
      }

      #${PANEL_ID} .apcf-profiles {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        border: 0;
        border-top: 1px solid #dadad7;
        margin: 0;
        padding: 0;
        background: white;
        box-shadow: 0 -10px 24px rgb(0 0 0 / .1);
      }

      #${PANEL_ID} .apcf-profiles legend,
      #${PANEL_ID} .apcf-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }

      #${PANEL_ID} .apcf-profile-wrap { position: relative; }
      #${PANEL_ID} .apcf-profile-wrap input {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      #${PANEL_ID} .apcf-profile {
        min-height: 116px;
        display: grid;
        place-items: center;
        gap: .28rem;
        border-right: 1px solid #e1e1de;
        color: #4d4d4d;
        padding: .55rem .2rem;
        font-size: .84rem;
        line-height: 1.05;
        font-weight: 850;
        text-align: center;
      }

      #${PANEL_ID} .apcf-profile-icon {
        display: block;
        width: 2.8rem;
        height: 2.8rem;
        object-fit: contain;
      }

      #${PANEL_ID} .apcf-profile-wrap input:checked + .apcf-profile {
        background: #fff5d6;
        color: #831451;
        box-shadow: inset 0 5px 0 #f7bd3d;
        outline: 3px solid #171717;
        outline-offset: -2px;
      }

      #${PANEL_ID} .apcf-close:focus-visible,
      #${PANEL_ID} .apcf-check:focus-visible,
      #${PANEL_ID} .apcf-profile-wrap input:focus-visible + .apcf-profile {
        outline: 4px solid #0b66d8;
        outline-offset: -3px;
      }

      .${MARK} {
        outline: 4px solid #f7bd3d !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 8px rgb(247 189 61 / .28) !important;
      }

      .${MARK}[data-apcf-severity="error"] {
        outline-color: #c1121f !important;
        box-shadow: 0 0 0 8px rgb(193 18 31 / .24) !important;
      }

      .${MARK}[data-apcf-severity="ok"] {
        outline-color: #f7bd3d !important;
        box-shadow: 0 0 0 8px rgb(247 189 61 / .28) !important;
      }

      .${LABEL} {
        position: absolute !important;
        z-index: 2147483646 !important;
        max-width: 25rem !important;
        border: 2px solid #171717 !important;
        border-radius: .6rem !important;
        background: #f7bd3d !important;
        color: #171717 !important;
        padding: .38rem .55rem !important;
        font: 850 13px/1.22 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        box-shadow: 0 8px 18px rgb(0 0 0 / .25) !important;
      }

      .${LABEL}[data-apcf-severity="error"] { background: #c1121f !important; color: white !important; }
      .${LABEL}[data-apcf-severity="ok"] { background: #f7bd3d !important; color: #171717 !important; }

      .${FLOATING} {
        position: fixed !important;
        z-index: 2147483646 !important;
        left: calc(430px + 1rem) !important;
        right: 1rem !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: auto !important;
        max-width: min(900px, calc(100vw - 430px - 2rem)) !important;
        max-height: min(74vh, calc(100vh - 2rem)) !important;
        overflow: auto !important;
        border: 1px solid #2f2f2f !important;
        border-radius: 1rem !important;
        background: #202020 !important;
        color: #f2f2f2 !important;
        box-shadow: 0 24px 72px rgb(0 0 0 / .38) !important;
        padding: 0 !important;
        font: 600 17px/1.46 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      .${FLOATING}.apcf-floating-minimized {
        top: auto !important;
        bottom: 1rem !important;
        transform: none !important;
        max-height: 3.9rem !important;
        overflow: hidden !important;
      }

      .${FLOATING} .apcf-floating-head {
        display: grid !important;
        grid-template-columns: 1fr auto auto !important;
        gap: .45rem !important;
        align-items: center !important;
        padding: .9rem 1rem !important;
        border-bottom: 1px solid #555 !important;
        cursor: grab !important;
      }

      .${FLOATING} h2 {
        margin: 0 !important;
        color: #f2f2f2 !important;
        font-size: 1.7rem !important;
      }

      .${FLOATING} .apcf-floating-control {
        min-width: 2.2rem !important;
        min-height: 2.2rem !important;
        border: 2px solid #ffffff !important;
        border-radius: .5rem !important;
        background: #202020 !important;
        color: #ffffff !important;
        font-weight: 950 !important;
        cursor: pointer !important;
      }

      .${FLOATING} .apcf-floating-control:hover {
        background: #ffffff !important;
        color: #171717 !important;
      }

      .${FLOATING} .apcf-floating-head:active {
        cursor: grabbing !important;
      }

      .${FLOATING} .apcf-floating-body {
        padding: 1rem 1.05rem 1.1rem !important;
        overflow-x: hidden !important;
      }

      .${FLOATING}.apcf-floating-minimized .apcf-floating-body {
        display: none !important;
      }
      .${FLOATING}.apcf-floating-minimized .apcf-floating-head {
        padding: .72rem .9rem !important;
      }
      .${FLOATING}.apcf-floating-minimized h2 {
        font-size: 1.15rem !important;
      }

      .${FLOATING} p { margin: .4rem 0 !important; color: #e6e6e6 !important; font-size: 1.05rem !important; }
      .${FLOATING} ol, .${FLOATING} ul { margin: .5rem 0 !important; padding-left: 1.45rem !important; }
      .${FLOATING} li { margin: .28rem 0 !important; color: #f2f2f2 !important; font-size: 1.05rem !important; }
      .${FLOATING} .apcf-explain {
        color: #f7bd3d !important;
        font-weight: 800 !important;
      }
      .${FLOATING} .apcf-result {
        color: #ffffff !important;
        font-weight: 650 !important;
      }
      .${FLOATING} .apcf-problem {
        display: flex !important;
        align-items: flex-start !important;
        gap: .5rem !important;
        margin: .45rem 0 !important;
        border-radius: .6rem !important;
        background: #b1121c !important;
        color: #ffffff !important;
        padding: .55rem .7rem !important;
        font-size: 1.08rem !important;
        font-weight: 850 !important;
      }
      .${FLOATING} .apcf-problem span:last-child { display: block !important; }
      .${FLOATING} .apcf-heading-page {
        margin: .35rem 0 .75rem !important;
        padding-bottom: .65rem !important;
        border-bottom: 1px dashed #bdbdbd !important;
        color: #f2f2f2 !important;
        font-size: 1.12rem !important;
        font-weight: 800 !important;
      }
      .${FLOATING} .apcf-tree { list-style: none !important; padding-left: 0 !important; }
      .${FLOATING} .apcf-tree li {
        position: relative !important;
        margin-left: var(--apcf-indent, 0) !important;
        padding-left: 1.05rem !important;
        min-height: 1.65rem !important;
        margin-top: .2rem !important;
      }
      .${FLOATING} .apcf-tree li::before {
        content: "" !important;
        position: absolute !important;
        left: .18rem !important;
        top: .85rem !important;
        width: .7rem !important;
        border-top: 2px solid #8b8b8b !important;
      }
      .${FLOATING} .apcf-tree li::after {
        content: "" !important;
        position: absolute !important;
        left: .18rem !important;
        top: -.2rem !important;
        height: 1.25rem !important;
        border-left: 2px solid #8b8b8b !important;
      }
      .${FLOATING} .apcf-tree .apcf-tree-error { color: #ffb3b3 !important; }
      .${FLOATING} .apcf-heading-level {
        color: #ffffff !important;
        font-weight: 950 !important;
        display: inline-block !important;
        min-width: 1.8rem !important;
        font-size: 1.06rem !important;
      }

      .${FLOATING} .apcf-tree-button {
        display: block !important;
        width: 100% !important;
        border: 0 !important;
        border-radius: .35rem !important;
        background: transparent !important;
        color: inherit !important;
        padding: .15rem .25rem !important;
        text-align: left !important;
        font: inherit !important;
        cursor: pointer !important;
      }

      .${FLOATING} .apcf-tree-button:hover,
      .${FLOATING} .apcf-tree-button:focus-visible {
        outline: 3px solid #ffffff !important;
        outline-offset: 2px !important;
        background: #343434 !important;
      }

      .${FLOATING} .apcf-landmark-map {
        display: grid !important;
        gap: .55rem !important;
        margin: .65rem 0 !important;
      }

      .${FLOATING} .apcf-landmark-box {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        margin-left: var(--apcf-indent, 0) !important;
        border: 2px solid #f2f2f2 !important;
        border-radius: .7rem !important;
        color: #f2f2f2 !important;
        background: #2a2a2a !important;
        padding: .72rem .85rem !important;
        font-weight: 850 !important;
        text-align: left !important;
        cursor: pointer !important;
      }

      .${FLOATING} .apcf-landmark-box .apcf-landmark-label {
        display: block !important;
        margin-top: .18rem !important;
        color: #ffdf8a !important;
        font-size: 1.08rem !important;
        font-weight: 750 !important;
      }

      .${FLOATING} .apcf-landmark-box .apcf-landmark-type {
        display: block !important;
        font-size: 1.16rem !important;
        font-weight: 950 !important;
      }

      .apcf-wand-tip {
        position: fixed !important;
        z-index: 2147483647 !important;
        left: calc(430px + 1rem) !important;
        right: 1rem !important;
        bottom: 1rem !important;
        top: auto !important;
        max-width: calc(100vw - 430px - 2rem) !important;
        min-height: 5.75rem !important;
        border: 2px solid #171717 !important;
        border-radius: .9rem !important;
        background: #202020 !important;
        color: #ffffff !important;
        padding: .8rem .95rem !important;
        box-shadow: 0 12px 30px rgb(0 0 0 / .3) !important;
        pointer-events: none !important;
      }

      .apcf-wand-tip strong,
      .apcf-wand-tip span,
      .apcf-wand-tip em {
        display: block !important;
        font-style: normal !important;
      }

      .apcf-wand-tip strong {
        color: #f7bd3d !important;
        font-size: 1.05rem !important;
        text-transform: uppercase !important;
        letter-spacing: .02em !important;
      }

      .apcf-wand-tip span {
        margin-top: .2rem !important;
        font-size: 1.22rem !important;
        font-weight: 850 !important;
      }

      .apcf-wand-tip em {
        margin-top: .2rem !important;
        color: rgb(255 255 255 / .88) !important;
        font-size: 1.04rem !important;
        font-weight: 650 !important;
      }

      .${FLOATING} .apcf-contrast-sample {
        display: inline-block !important;
        max-width: 100% !important;
        border-radius: .35rem !important;
        padding: .2rem .35rem !important;
        font-weight: 850 !important;
        white-space: normal !important;
      }

      .${FLOATING} .apcf-media-list {
        display: grid !important;
        gap: .45rem !important;
        margin-top: .75rem !important;
      }

      .${FLOATING} .apcf-media-item {
        appearance: none !important;
        width: 100% !important;
        display: grid !important;
        grid-template-columns: auto auto minmax(0, 1fr) minmax(0, 1.2fr) !important;
        gap: .5rem !important;
        align-items: start !important;
        border: 1px solid #595959 !important;
        border-radius: .65rem !important;
        padding: .55rem .6rem !important;
        color: #f2f2f2 !important;
        background: #2a2a2a !important;
        text-align: left !important;
        cursor: pointer !important;
      }

      .${FLOATING} .apcf-media-item strong {
        color: #ffffff !important;
        font-size: 1.12rem !important;
      }

      .${FLOATING} .apcf-media-item span {
        color: #e0e0e0 !important;
        font-size: 1.08rem !important;
      }

      .${FLOATING} .apcf-media-item:focus-visible {
        outline: 3px solid #ffffff !important;
        outline-offset: 2px !important;
        background: #353535 !important;
      }

      .${FLOATING} .apcf-panel-option {
        display: flex !important;
        align-items: center !important;
        gap: .45rem !important;
        margin: .45rem 0 .75rem !important;
        color: #f2f2f2 !important;
        font-weight: 850 !important;
        font-size: 1.1rem !important;
      }

      .${FLOATING} .apcf-panel-option input {
        width: 1.15rem !important;
        height: 1.15rem !important;
        accent-color: #f7bd3d !important;
      }

      .${FLOATING} .apcf-data-table,
      .${FLOATING} .apcf-contrast-table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        margin-top: .65rem !important;
      }

      .${FLOATING} .apcf-data-table caption,
      .${FLOATING} .apcf-contrast-table caption {
        text-align: left !important;
        color: #f2f2f2 !important;
        font-weight: 850 !important;
        font-size: 1.18rem !important;
        margin-bottom: .35rem !important;
      }

      .${FLOATING} .apcf-data-table th,
      .${FLOATING} .apcf-data-table td,
      .${FLOATING} .apcf-contrast-table th,
      .${FLOATING} .apcf-contrast-table td {
        border: 1px solid #747474 !important;
        padding: .4rem !important;
        color: #f2f2f2 !important;
        text-align: left !important;
        vertical-align: top !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
        font-size: 1.08rem !important;
      }

      .${FLOATING} .apcf-data-table code {
        color: #ffdddd !important;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace !important;
        white-space: normal !important;
      }

      .${FLOATING} .apcf-color-chip {
        display: inline-block !important;
        width: .9rem !important;
        height: .9rem !important;
        margin-right: .35rem !important;
        border: 1px solid #ffffff !important;
        border-radius: .2rem !important;
        background: var(--apcf-chip) !important;
        vertical-align: middle !important;
      }

      .${FLOATING} .apcf-data-table th:nth-child(1),
      .${FLOATING} .apcf-data-table td:nth-child(1) { width: 3.2rem !important; }
      .${FLOATING} .apcf-data-table th:nth-child(2),
      .${FLOATING} .apcf-data-table td:nth-child(2) { width: 13% !important; }
      .${FLOATING} .apcf-data-table th:nth-child(3),
      .${FLOATING} .apcf-data-table td:nth-child(3) { width: 18% !important; }
      .${FLOATING} .apcf-data-table th:nth-child(4),
      .${FLOATING} .apcf-data-table td:nth-child(4) { width: 18% !important; }
      .${FLOATING} .apcf-data-table th:nth-child(5),
      .${FLOATING} .apcf-data-table td:nth-child(5) { width: 9rem !important; }
      .${FLOATING} .apcf-data-table th:nth-child(6),
      .${FLOATING} .apcf-data-table td:nth-child(6) { width: 5.8rem !important; }
      .${FLOATING} .apcf-data-table th:nth-child(7),
      .${FLOATING} .apcf-data-table td:nth-child(7) { width: 5.8rem !important; }
      .${FLOATING} .apcf-data-table th:nth-child(8),
      .${FLOATING} .apcf-data-table td:nth-child(8) { width: 5.8rem !important; }

      .${FLOATING} .apcf-data-table tr[data-apcf-severity="error"] td {
        background: rgb(193 18 31 / .16) !important;
        color: #ffdddd !important;
      }

      .${FLOATING} .apcf-data-table tr[data-apcf-severity="warn"] td {
        background: rgb(247 189 61 / .14) !important;
        color: #fff4cf !important;
      }

      .${FLOATING} .apcf-mini-button {
        border: 2px solid #ffffff !important;
        border-radius: .4rem !important;
        background: #202020 !important;
        color: #ffffff !important;
        padding: .18rem .3rem !important;
        min-width: 2.4rem !important;
        font-weight: 900 !important;
        cursor: pointer !important;
      }

      .${FLOATING} .apcf-mini-button:hover,
      .${FLOATING} .apcf-mini-button:focus-visible {
        background: #ffffff !important;
        color: #171717 !important;
        outline: 3px solid #f7bd3d !important;
        outline-offset: 2px !important;
      }

      .${FLOATING} .apcf-contrast-fail {
        color: #ffb3b3 !important;
        font-weight: 950 !important;
      }

      .${FLOATING} .apcf-contrast-pass {
        color: #f7bd3d !important;
        font-weight: 950 !important;
      }

      .apcf-grayscale { filter: grayscale(1) !important; }

      @media (max-width: 760px) {
        html.${PAGE_SHIFT} { padding-left: 0 !important; }
        html.${PAGE_SHIFT} body { max-width: none !important; }
        #${PANEL_ID} {
          inset: auto 0 0 0;
          width: 100vw;
          height: min(92vh, 820px);
          border-right: 0;
          border-top: 1px solid #dadad7;
          border-radius: 1.2rem 1.2rem 0 0;
        }
        .${FLOATING} { inset: auto .75rem calc(min(92vh, 820px) + .75rem) .75rem !important; width: auto !important; max-height: 34vh !important; }
        .apcf-wand-tip {
          left: .75rem !important;
          right: .75rem !important;
          bottom: .75rem !important;
          max-width: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function currentProfile() {
    return profiles.find(profile => profile.id === state.profile) || profiles[0];
  }

  function visibleElements(selector) {
    return [...document.querySelectorAll(selector)]
      .filter(el => !el.closest(`#${PANEL_ID}`))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });
  }

  function pageElements(selector) {
    return [...document.querySelectorAll(selector)]
      .filter(el => !el.closest(`#${PANEL_ID}`))
      .filter(el => {
        const style = getComputedStyle(el);
        return style.visibility !== "hidden" && style.display !== "none";
      });
  }

  function panelFocusableElements(box) {
    return [...box.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter(el => el instanceof HTMLElement)
      .filter(el => {
        const style = getComputedStyle(el);
        return style.visibility !== "hidden" && style.display !== "none";
      });
  }

  function clearVisuals() {
    document.querySelectorAll(`.${MARK}`).forEach(el => {
      el.classList.remove(MARK);
      el.removeAttribute("data-apcf-severity");
      el.removeAttribute("data-apcf-mark-id");
      el.removeAttribute("data-apcf-link-mark");
      el.removeAttribute("data-apcf-wand-order");
    });
    document.querySelectorAll(`.${LABEL}, .${FLOATING}`).forEach(el => el.remove());
    document.documentElement.classList.remove("apcf-grayscale");
    state.grayscale = false;
  }

  function closePanel() {
    clearVisuals();
    state.hiddenPanels.clear();
    state.active.clear();
    state.lastCheck = "";
    state.currentPanelId = "";
    document.documentElement.classList.remove(PAGE_SHIFT);
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
  }

  function syncGrayscale() {
    document.documentElement.classList.toggle("apcf-grayscale", state.grayscale);
  }

  function mark(el, text, severity = "warn") {
    if (!el) return;
    const id = el.getAttribute("data-apcf-mark-id") || `apcf-${++markId}`;
    el.setAttribute("data-apcf-mark-id", id);
    el.classList.add(MARK);
    el.setAttribute("data-apcf-severity", severity);
    const label = document.createElement("span");
    label.className = LABEL;
    label.dataset.apcfSeverity = severity;
    label.dataset.apcfTarget = id;
    label.textContent = text;
    document.body.appendChild(label);
    positionLabel(label);
  }

  function positionLabel(label) {
    const targetId = label.dataset.apcfTarget;
    const target = targetId ? document.querySelector(`[data-apcf-mark-id="${CSS.escape(targetId)}"]`) : null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    label.style.left = `${Math.max(6, rect.left + window.scrollX)}px`;
    label.style.top = `${Math.max(6, rect.top + window.scrollY - 30)}px`;
  }

  function updateLabels() {
    document.querySelectorAll(`.${LABEL}`).forEach(positionLabel);
  }

  function ensurePositionListeners() {
    if (listenersReady) return;
    listenersReady = true;
    window.addEventListener("scroll", updateLabels, true);
    window.addEventListener("resize", updateLabels);
  }

  function floating(title, html) {
    const box = document.createElement("aside");
    box.className = FLOATING;
    box.setAttribute("aria-label", title);
    box.innerHTML = `
      <div class="apcf-floating-head">
        <h2>${escapeHtml(title)}</h2>
        <button class="apcf-floating-control" type="button" data-apcf-close aria-label="Cerrar panel">×</button>
      </div>
      <div class="apcf-floating-body">${html}</div>
    `;
    document.body.appendChild(box);
    let dragState = null;
    const head = box.querySelector(".apcf-floating-head");
    const finishPanel = ({ hideOnly = false } = {}) => {
      const id = state.currentPanelId;
      box.remove();
      if (!id) return;
      if (hideOnly) {
        state.hiddenPanels.add(id);
      } else {
        state.hiddenPanels.delete(id);
        state.active.delete(id);
        if (state.lastCheck === id) state.lastCheck = "";
      }
      render(false);
    };
    if (head) {
      head.addEventListener("pointerdown", event => {
        const target = event.target instanceof Element ? event.target : null;
        if (target && target.closest("button")) return;
        const rect = box.getBoundingClientRect();
        dragState = {
          startX: event.clientX,
          startY: event.clientY,
          left: rect.left,
          top: rect.top
        };
        box.style.left = `${rect.left}px`;
        box.style.top = `${rect.top}px`;
        box.style.transform = "none";
        box.style.inset = "auto";
        head.setPointerCapture(event.pointerId);
        event.preventDefault();
      });
      head.addEventListener("pointermove", event => {
        if (!dragState) return;
        const dx = event.clientX - dragState.startX;
        const dy = event.clientY - dragState.startY;
        box.style.left = `${Math.max(12, dragState.left + dx)}px`;
        box.style.top = `${Math.max(12, dragState.top + dy)}px`;
      });
      head.addEventListener("pointerup", () => {
        dragState = null;
      });
      head.addEventListener("pointercancel", () => {
        dragState = null;
      });
    }
    box.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        finishPanel({ hideOnly: false });
        return;
      }
      const focusables = panelFocusableElements(box);
      if (!focusables.length) return;
      const activeIndex = focusables.indexOf(document.activeElement);
      const focusAt = index => {
        event.preventDefault();
        focusables[Math.max(0, Math.min(focusables.length - 1, index))]?.focus({ preventScroll: true });
      };
      if (event.key === "ArrowDown" || event.key === "PageDown") focusAt(activeIndex >= 0 ? activeIndex + 1 : 0);
      else if (event.key === "ArrowUp" || event.key === "PageUp") focusAt(activeIndex >= 0 ? activeIndex - 1 : 0);
      else if (event.key === "Home") focusAt(0);
      else if (event.key === "End") focusAt(focusables.length - 1);
    });
    box.querySelector("[data-apcf-close]").addEventListener("click", () => {
      const id = state.currentPanelId;
      finishPanel({ hideOnly: !!id && keepActiveWhenClosed(id) });
    });
    return box;
  }

  function result(check, count, type) {
    const status = type || (count ? "warn" : "ok");
    state.results.push({ title: check.title, count, status });
  }

  function textValue(el) {
    return (el.textContent || "").replace(/\s+/g, " ").trim();
  }

  function explainResult(explain, result) {
    return `<p class="apcf-explain">${escapeHtml(explain)}</p><p class="apcf-result">${result}</p>`;
  }

  function problemResult(message) {
    return `<p class="apcf-explain">${escapeHtml("Comprueba este elemento en la página.")}</p><p class="apcf-problem"><span aria-hidden="true">⚠</span><span>${escapeHtml(message)}</span></p>`;
  }

  function keepActiveWhenClosed(id) {
    return new Set(["images", "headings", "landmarks", "contrast", "link-text", "skip-link", "audio", "video", "focus-order", "focus-visible", "grayscale"]).has(id);
  }

  function labelForField(field) {
    const id = field.getAttribute("id");
    if (id) {
      const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (explicit) return textValue(explicit);
    }
    const wrapped = field.closest("label");
    if (wrapped) return textValue(wrapped);
    const labelledby = field.getAttribute("aria-labelledby");
    if (labelledby) {
      return labelledby.split(/\s+/).map(part => {
        const ref = document.getElementById(part);
        return ref ? textValue(ref) : "";
      }).join(" ").trim();
    }
    return field.getAttribute("aria-label") || "";
  }

  function revealElement(el, label, severity = "warn") {
    if (!el) return;
    const needsTempFocus = !el.matches("a,button,input,select,textarea,[tabindex],summary");
    let cleanup = null;
    if (needsTempFocus) {
      el.setAttribute("tabindex", "-1");
      cleanup = () => el.removeAttribute("tabindex");
    }
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    try {
      el.focus({ preventScroll: true });
    } catch (_error) {
      try { el.focus(); } catch (_ignored) {}
    }
    mark(el, label, severity);
    if (cleanup) window.setTimeout(cleanup, 1500);
  }

  function hideCurrentFloatingPanel() {
    if (!state.currentPanelId) return;
    const panel = document.querySelector(`.${FLOATING}`);
    if (!panel) return;
    state.hiddenPanels.add(state.currentPanelId);
    panel.remove();
    render(false);
  }

  function describedText(el) {
    const ids = (el.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    return ids.map(id => {
      const ref = document.getElementById(id);
      return ref ? textValue(ref) : "";
    }).join(" ").trim();
  }

  function labelledByText(el) {
    const labelledby = el.getAttribute("aria-labelledby");
    if (!labelledby) return "";
    return labelledby.split(/\s+/).map(id => {
      const ref = document.getElementById(id);
      return ref ? textValue(ref) : "";
    }).filter(Boolean).join(" ").trim();
  }

  function accessibleName(el) {
    const ariaLabel = el.getAttribute("aria-label");
    const labelled = labelledByText(el);
    const formLabel = el.matches("input,select,textarea") ? labelForField(el) : "";
    const text = textValue(el);
    const title = el.getAttribute("title");
    const imgAlt = [...el.querySelectorAll("img[alt]")].map(img => img.getAttribute("alt").trim()).filter(Boolean).join(" ");
    return ariaLabel || labelled || formLabel || text || imgAlt || title || "";
  }

  function visibleLandmarkTitle(el) {
    const heading = el.querySelector("h1,h2,h3,h4,h5,h6");
    if (heading) return textValue(heading);
    const labelled = accessibleName(el);
    if (labelled) return labelled;
    const title = el.querySelector("[title]");
    if (title) return title.getAttribute("title") || "";
    return textValue(el).slice(0, 80);
  }

  function interactiveSelector() {
    return "a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex='-1']),[contenteditable='true'],[role='button'],[role='link'],[role='checkbox'],[role='radio'],[role='switch'],[role='tab'],[role='menuitem'],[role='option']";
  }

  function interactiveElements() {
    return pageElements(interactiveSelector()).filter(el => {
      const style = getComputedStyle(el);
      return style.visibility !== "hidden" && style.display !== "none";
    });
  }

  function injectFocusScript(doc = document) {
    try {
      const script = doc.createElement("script");
      script.src = "https://cdn.jsdelivr.net/gh/pauljadam/bookmarklets@master/focus.js";
      (doc.body || doc.documentElement).appendChild(script);
    } catch (_error) {}
  }

  function forceFocusVisible() {
    injectFocusScript(document);
    const first = interactiveElements()[0];
    if (first && typeof first.focus === "function") {
      try {
        first.focus({ preventScroll: false });
        first.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } catch (_error) {
        try { first.focus(); } catch (_ignored) {}
      }
    }
    const iframes = document.getElementsByTagName("iframe");
    for (let i = 0; i < iframes.length; i += 1) {
      try {
        const frameDoc = iframes[i].contentDocument;
        if (frameDoc && frameDoc.body) injectFocusScript(frameDoc);
      } catch (_error) {}
    }
  }

  function roleLabel(role) {
    const labels = {
      "banner": "Banner",
      "header": "Banner",
      "navigation": "Navigation",
      "nav": "Navigation",
      "main": "Main",
      "search": "Search",
      "contentinfo": "Content information",
      "footer": "Content information",
      "complementary": "Complementary",
      "aside": "Complementary",
      "region": "Region",
      "section": "Region"
    };
    return labels[role] || role;
  }

  function landmarkRole(el) {
    const explicit = el.getAttribute("role");
    if (explicit && /^(banner|navigation|main|contentinfo|complementary|search|region)$/i.test(explicit)) {
      return explicit.toLowerCase();
    }
    const tag = el.tagName.toLowerCase();
    if (tag === "aside") return "complementary";
    if (tag === "footer" && !el.parentElement.closest("article,aside,main,nav,section")) return "contentinfo";
    if (tag === "header" && !el.parentElement.closest("article,aside,main,nav,section")) return "banner";
    if (tag === "main") return "main";
    if (tag === "nav") return "navigation";
    if (tag === "search") return "search";
    if (tag === "section" && accessibleName(el)) return "region";
    return "";
  }

  function landmarkElements() {
    const selector = "aside,footer,header,main,nav,search,section[aria-label],section[aria-labelledby],[role='banner'],[role='navigation'],[role='main'],[role='contentinfo'],[role='complementary'],[role='search'],[role='region']";
    return pageElements(selector).filter(landmarkRole);
  }

  function landmarkDepth(el) {
    let depth = 0;
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (parent.matches && landmarkRole(parent)) depth += 1;
      parent = parent.parentElement;
    }
    return depth;
  }

  function nearestBg(el) {
    let node = el;
    while (node && node.nodeType === 1) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && bg !== "transparent" && !bg.endsWith(", 0)")) return bg;
      node = node.parentElement;
    }
    return "rgb(255, 255, 255)";
  }

  function parseRgb(value) {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const parts = match[1].split(",").map(part => Number.parseFloat(part));
    return parts.length >= 3 ? parts.slice(0, 3) : null;
  }

  function luminance(rgb) {
    return rgb.map(channel => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }).reduce((sum, c, index) => sum + c * [0.2126, 0.7152, 0.0722][index], 0);
  }

  function contrastRatio(fg, bg) {
    const fgRgb = parseRgb(fg);
    const bgRgb = parseRgb(bg);
    if (!fgRgb || !bgRgb) return null;
    const lighter = Math.max(luminance(fgRgb), luminance(bgRgb));
    const darker = Math.min(luminance(fgRgb), luminance(bgRgb));
    return (lighter + 0.05) / (darker + 0.05);
  }

  function mediaAttrText(el) {
    return [
      el.tagName,
      el.id,
      el.className,
      el.getAttribute("href"),
      el.getAttribute("src"),
      el.getAttribute("title"),
      el.getAttribute("aria-label"),
      el.getAttribute("role"),
      el.getAttribute("data-player"),
      el.getAttribute("data-testid")
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function isMediaPlayer(el, type) {
    const tag = el.tagName.toLowerCase();
    const text = mediaAttrText(el);
    const genericPlayer = /player|reproductor|media|jwplayer|kaltura|brightcove|loom|vidyard|streamable|twitch|facebook|tiktok/.test(text);
    const videoPlayer = /youtube|youtu\.be|vimeo|wistia|dailymotion|video|jwplayer|kaltura|brightcove|loom|vidyard|streamable|twitch|facebook|tiktok/.test(text);
    const audioPlayer = /soundcloud|spotify|podcast|audio|jwplayer|kaltura|brightcove|media/.test(text);
    if (type === "audio") return tag === "audio" || audioPlayer || genericPlayer;
    return tag === "video" || (tag === "iframe" && videoPlayer) || (tag === "embed" && videoPlayer) || (tag === "object" && videoPlayer) || genericPlayer;
  }

  function mediaPlayers(type) {
    const selector = [
      "audio",
      "video",
      "iframe",
      "embed",
      "object",
      "iframe[src*='youtube']",
      "iframe[src*='youtu.be']",
      "iframe[src*='vimeo']",
      "iframe[src*='soundcloud']",
      "iframe[src*='spotify']",
      "iframe[src*='dailymotion']",
      "iframe[src*='twitch']",
      "iframe[src*='loom']",
      "iframe[src*='vidyard']",
      "iframe[src*='jwplayer']",
      "iframe[src*='kaltura']",
      "iframe[src*='brightcove']",
      "iframe[src*='facebook']",
      "iframe[src*='tiktok']",
      "[id*='player']",
      "[class*='player']",
      "[title*='player']",
      "[aria-label*='player']",
      "[id*='jw']",
      "[class*='jw']",
      "[title*='jw']",
      "[aria-label*='jw']",
      "[id*='kaltura']",
      "[class*='kaltura']",
      "[title*='kaltura']",
      "[aria-label*='kaltura']",
      "[id*='brightcove']",
      "[class*='brightcove']",
      "[title*='brightcove']",
      "[aria-label*='brightcove']",
      "[id*='Player']",
      "[class*='Player']",
      "[title*='Player']",
      "[aria-label*='Player']",
      "[id*='reproductor']",
      "[class*='reproductor']",
      "[title*='reproductor']",
      "[aria-label*='reproductor']",
      "a[href*='youtube']",
      "a[href*='youtu.be']",
      "a[href*='vimeo']"
    ].join(",");
    return visibleElements(selector).filter(el => isMediaPlayer(el, type));
  }

  function cssPath(el) {
    if (el.id) return `#${el.id}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body && parts.length < 4) {
      const tag = node.tagName.toLowerCase();
      const siblings = [...node.parentElement.children].filter(child => child.tagName === node.tagName);
      const index = siblings.indexOf(node) + 1;
      parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${index})` : tag);
      node = node.parentElement;
    }
    return parts.join(" > ");
  }

  function runCheck(check) {
    state.currentPanelId = check.id;
    switch (check.id) {
      case "images": {
        const imgs = visibleElements("img");
        let issues = 0;
        const rows = imgs.map((img, index) => {
          const alt = img.getAttribute("alt");
          if (alt === null) {
            issues += 1;
            mark(img, "Sin atributo alt", "error");
            return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>Imagen ${index + 1}</strong><span>Sin atributo alt</span><span>Revisar imagen decorativa o informativa.</span></button>`;
          }
          if (alt.trim() === "") {
            mark(img, "alt vacio: decorativa", "ok");
            return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>Imagen ${index + 1}</strong><span>Alt vacío</span><span>Decorativa.</span></button>`;
          }
          mark(img, `alt: ${alt.slice(0, 80)}`, "ok");
          return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>Imagen ${index + 1}</strong><span>${escapeHtml(alt.slice(0, 140))}</span><span>Texto alternativo visible en la lista.</span></button>`;
        });
        const box = floating("Texto alternativo de imágenes", `
          <p class="apcf-explain">Revisa el texto alternativo de cada imagen.</p>
          <p class="apcf-result">${escapeHtml(`${imgs.length} imagen(es) visibles.`)}</p>
          <div class="apcf-media-list">${rows.length ? rows.join("") : "<p>No hay imagenes visibles.</p>"}</div>
        `);
        box.querySelectorAll("[data-apcf-show-image]").forEach(button => {
          button.addEventListener("click", () => {
            const img = imgs[Number(button.dataset.apcfShowImage)];
            if (!img) return;
            const alt = img.getAttribute("alt");
            revealElement(img, alt ? `Imagen: ${alt.slice(0, 80)}` : "Imagen sin alt", alt && alt.trim() ? "warn" : "error");
            hideCurrentFloatingPanel();
          });
        });
        result(check, issues);
        break;
      }

      case "page-title": {
        const title = document.title.trim();
        const issue = !title || /^(home|inicio|untitled|document)$/i.test(title);
        floating("Título de la página", issue
          ? problemResult("Problema: no se encontró este elemento.")
          : explainResult(
              "Comprueba que el titulo de la página se ajusta a la información que se muestra en ella.",
              `<strong>Título:</strong> ${escapeHtml(title)}`
            ));
        result(check, issue ? 1 : 0);
        break;
      }

      case "headings": {
        const headings = visibleElements("h1,h2,h3,h4,h5,h6");
        let issues = 0;
        let previous = 0;
        let h1Count = 0;
        const items = headings.map((heading, index) => {
          const level = Number(heading.tagName.slice(1));
          const skipped = previous && level > previous + 1;
          previous = level;
          if (level === 1) h1Count += 1;
          if (skipped) issues += 1;
          if (state.headingsVisible) mark(heading, `H${level}`, skipped ? "error" : "warn");
          const indent = Math.max(0, level - 1) * 30;
          return `<li class="${skipped ? "apcf-tree-error" : ""}" style="--apcf-indent:${indent}px"><button class="apcf-tree-button" type="button" data-apcf-scroll-heading="${index}"><span class="apcf-heading-level">H${level}</span> - ${escapeHtml(textValue(heading).slice(0, 90) || "Sin texto")}${skipped ? " · salto de nivel" : ""}</button></li>`;
        }).join("");
        if (h1Count !== 1) issues += 1;
        const box = floating("Encabezados", `
          <p class="apcf-explain">Comprueba la jerarquía de los encabezados. H1 es el principal y los demás cuelgan de él.</p>
          ${headings.length ? `<p class="apcf-result">${escapeHtml(h1Count === 1 ? "H1 principal detectado." : `H1 encontrados: ${h1Count}.`)}</p>` : problemResult("Problema: no se encontró este elemento.")}
          <div class="apcf-heading-page">${escapeHtml(document.title || "Página actual")}</div>
          <label class="apcf-panel-option"><input type="checkbox" data-apcf-show-headings-page ${state.headingsVisible ? "checked" : ""}> Ver encabezados en la página</label>
          <ul class="apcf-tree">${items || "<li>No se encontraron encabezados.</li>"}</ul>
        `);
        box.querySelectorAll("[data-apcf-scroll-heading]").forEach(button => {
          button.addEventListener("click", () => {
            const heading = headings[Number(button.dataset.apcfScrollHeading)];
            if (!heading) return;
            revealElement(heading, `Seleccionado ${heading.tagName}`, "ok");
            hideCurrentFloatingPanel();
          });
        });
        box.querySelector("[data-apcf-show-headings-page]")?.addEventListener("change", event => {
          state.headingsVisible = event.currentTarget.checked;
          refreshVisuals();
        });
        result(check, issues);
        break;
      }

      case "landmarks": {
        const landmarks = landmarkElements();
        let mainCount = 0;
        const boxes = landmarks.map((el, index) => {
          const role = landmarkRole(el);
          if (role === "main") mainCount += 1;
          const label = labelledByText(el) || el.getAttribute("aria-label") || "";
          const title = visibleLandmarkTitle(el);
          if (state.landmarksVisible) mark(el, `${roleLabel(role)}${label ? `: ${label.slice(0, 50)}` : ""}`, "warn");
          const depth = Math.max(0, Math.min(5, landmarkDepth(el)));
          return `<button class="apcf-landmark-box" type="button" data-apcf-landmark="${index}" style="--apcf-indent:${Math.min(70, depth * 20)}px"><span class="apcf-landmark-type">${escapeHtml(roleLabel(role))}</span><span class="apcf-landmark-label">${escapeHtml(label ? `Etiqueta: ${label.slice(0, 70)}` : "Sin etiqueta")}</span>${title ? `<span class="apcf-landmark-label">${escapeHtml(title.slice(0, 70))}</span>` : ""}</button>`;
        }).join("");
        const issues = mainCount === 1 ? 0 : 1;
        const box = floating("Puntos de referencia", `
          <p class="apcf-explain">Comprueba que las zonas estructuran la página y que cada una se reconoce por su tipo y su etiqueta visible.</p>
          ${landmarks.length ? `<p class="apcf-result">${escapeHtml(`${landmarks.length} puntos marcados. Main encontrados: ${mainCount}.`)}</p>` : problemResult("Problema: no se encontró este elemento.")}
          <label class="apcf-panel-option"><input type="checkbox" data-apcf-show-landmarks-page ${state.landmarksVisible ? "checked" : ""}> Ver puntos de referencia en la página</label>
          <div class="apcf-landmark-map">${boxes || "<p>No se encontraron puntos de referencia.</p>"}</div>
        `);
        box.querySelectorAll("[data-apcf-landmark]").forEach(button => {
          button.addEventListener("click", () => {
            const landmark = landmarks[Number(button.dataset.apcfLandmark)];
            if (!landmark) return;
            const title = visibleLandmarkTitle(landmark);
            revealElement(landmark, `${roleLabel(landmarkRole(landmark))}${title ? `: ${title}` : ""}`, "warn");
            hideCurrentFloatingPanel();
          });
        });
        box.querySelector("[data-apcf-show-landmarks-page]")?.addEventListener("change", event => {
          state.landmarksVisible = event.currentTarget.checked;
          refreshVisuals();
        });
        result(check, issues);
        break;
      }

      case "grayscale": {
        state.grayscale = true;
        syncGrayscale();
        result(check, 0, "manual");
        break;
      }

      case "contrast": {
        const candidates = visibleElements("p,li,a,button,label,h1,h2,h3,h4,h5,h6,span,td,th").filter(el => textValue(el).length);
        let issues = 0;
        const rows = [];
        candidates.slice(0, 250).forEach((el, index) => {
          const style = getComputedStyle(el);
          const ratio = contrastRatio(style.color, nearestBg(el));
          if (!ratio) return;
          const fontSize = Number.parseFloat(style.fontSize);
          const isBold = Number.parseInt(style.fontWeight, 10) >= 700;
          const large = fontSize >= 24 || (isBold && fontSize >= 18.66);
          const limit = large ? 3 : 4.5;
          const fails = ratio < limit;
          const format = `${Math.round(fontSize)}px / ${style.fontWeight}`;
          if (fails) {
            issues += 1;
            mark(el, `Contraste ${ratio.toFixed(1)}:1`, "error");
          }
          if (fails || rows.length < 18) {
            rows.push(`<tr><td><button class="apcf-mini-button" type="button" data-apcf-show-contrast="${index}">Ver</button></td><td><span class="apcf-contrast-sample" style="color:${escapeHtml(style.color)};background:${escapeHtml(nearestBg(el))}">${escapeHtml(textValue(el).slice(0, 48))}</span></td><td><span class="apcf-color-chip" style="--apcf-chip:${escapeHtml(style.color)}"></span>${escapeHtml(style.color)}</td><td><span class="apcf-color-chip" style="--apcf-chip:${escapeHtml(nearestBg(el))}"></span>${escapeHtml(nearestBg(el))}</td><td>${escapeHtml(format)}</td><td>${ratio.toFixed(2)}:1</td><td>${limit}:1</td><td class="${fails ? "apcf-contrast-fail" : "apcf-contrast-pass"}">${fails ? "Revisar" : "Pasa"}</td></tr>`);
          }
        });
        const box = floating("Contraste de color", `
          <p class="apcf-explain">Revisa el primer plano y el fondo de cada texto. La tabla muestra el mismo color detectado en la página.</p>
          <p class="apcf-result">${escapeHtml(issues ? `${issues} posible(s) fallo(s) de contraste.` : "No se detectaron fallos automáticos en los primeros textos visibles. Revisa también hover, focus y texto sobre imagen.")}</p>
          <table class="apcf-contrast-table">
            <caption>Evaluador de contraste</caption>
            <thead><tr><th>Ver</th><th>Texto</th><th>Primer plano</th><th>Fondo</th><th>Formato</th><th>Ratio</th><th>Mínimo</th><th>Estado</th></tr></thead>
            <tbody>${rows.join("") || "<tr><td colspan='8'>No se encontraron textos evaluables.</td></tr>"}</tbody>
          </table>
        `);
        box.querySelectorAll("[data-apcf-show-contrast]").forEach(button => {
          button.addEventListener("click", () => {
            const el = candidates[Number(button.dataset.apcfShowContrast)];
            if (!el) return;
            const style = getComputedStyle(el);
            revealElement(el, `Contraste ${style.color} / ${nearestBg(el)}`, "warn");
            hideCurrentFloatingPanel();
          });
        });
        result(check, issues);
        break;
      }

      case "link-text": {
        const links = visibleElements("a[href],[role='link']");
        let issues = 0;
        const rows = links.map((link, index) => {
          const visibleText = textValue(link);
          const name = accessibleName(link);
          const normalizedVisible = visibleText.replace(/\s+/g, " ").trim().toLowerCase();
          const normalizedName = name.replace(/\s+/g, " ").trim().toLowerCase();
          let severity = "warn";
          let note = "Sin incidencias automáticas.";
          if (!visibleText) {
            severity = "error";
            note = "Sin texto visible!";
            issues += 1;
          } else if (normalizedVisible !== normalizedName) {
            severity = "warn";
            note = "El texto visible no coincide con el nombre accesible. Revisar si el texto es adecuado.";
            issues += 1;
          }
          const href = link.getAttribute("href") || "";
          return `
            <tr data-apcf-link-row="${index}" data-apcf-severity="${severity}">
              <td><button class="apcf-mini-button" type="button" data-apcf-show-link="${index}">Ver</button></td>
              <td>${escapeHtml(visibleText || "Sin texto visible!")}</td>
              <td>${escapeHtml(name || "Sin nombre")}</td>
              <td>${escapeHtml(note)}<br><small>${href ? `Destino: ${escapeHtml(href.slice(0, 80))}` : `Selector: ${escapeHtml(cssPath(link))}`}</small></td>
            </tr>
          `;
        }).join("");
        const box = floating("Texto de enlaces", `
          <label class="apcf-panel-option"><input type="checkbox" data-apcf-show-all-links> Ver enlaces en la página</label>
          <p class="apcf-explain">Revisa si el nombre accesible es correcto.</p>
          <table class="apcf-data-table">
            <caption>Lista de enlaces de esta página</caption>
            <thead><tr><th>Ver</th><th>Texto visible</th><th>Nombre accesible</th><th>Notas</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='4'>No se encontraron enlaces.</td></tr>"}</tbody>
          </table>
        `);
        const showLink = index => {
          const link = links[index];
          if (!link) return;
          const visibleText = textValue(link);
          const name = accessibleName(link);
          const hasVisible = !!visibleText;
          const different = visibleText && visibleText.replace(/\s+/g, " ").trim().toLowerCase() !== name.replace(/\s+/g, " ").trim().toLowerCase();
          mark(link, `Enlace ${index + 1}: ${name.slice(0, 60) || "sin nombre"}`, hasVisible ? (different ? "warn" : "ok") : "error");
          link.scrollIntoView({ behavior: "smooth", block: "center" });
          hideCurrentFloatingPanel();
        };
        box.querySelectorAll("[data-apcf-show-link]").forEach(button => {
          button.addEventListener("click", () => showLink(Number(button.dataset.apcfShowLink)));
        });
        box.querySelector("[data-apcf-show-all-links]")?.addEventListener("change", event => {
          document.querySelectorAll(`.${MARK}[data-apcf-link-mark="true"]`).forEach(el => {
            el.classList.remove(MARK);
            el.removeAttribute("data-apcf-severity");
            el.removeAttribute("data-apcf-mark-id");
            el.removeAttribute("data-apcf-link-mark");
          });
          document.querySelectorAll(`.${LABEL}[data-apcf-link-label="true"]`).forEach(el => el.remove());
          if (!event.currentTarget.checked) return;
          links.forEach((link, index) => {
            const visibleText = textValue(link);
            const name = accessibleName(link);
            const different = visibleText && visibleText.replace(/\s+/g, " ").trim().toLowerCase() !== name.replace(/\s+/g, " ").trim().toLowerCase();
            mark(link, `Enlace ${index + 1}`, visibleText ? (different ? "warn" : "ok") : "error");
            link.setAttribute("data-apcf-link-mark", "true");
            const label = document.querySelector(`.${LABEL}[data-apcf-target="${CSS.escape(link.getAttribute("data-apcf-mark-id"))}"]`);
            if (label) label.setAttribute("data-apcf-link-label", "true");
          });
        });
        result(check, issues);
        break;
      }

      case "skip-link": {
        const internal = visibleElements("a[href^='#']").filter(a => (a.getAttribute("href") || "").length > 1);
        const first = internal[0];
        let issues = 0;
        if (!first) {
          issues = 1;
          floating("Enlace de salto", explainResult(
            "Comprueba que exista un enlace de salto al contenido y que lleve a la zona correcta.",
            "No se encontró enlace de salto al contenido."
          ));
        } else {
          const targetId = first.getAttribute("href").slice(1);
          const target = document.getElementById(targetId);
          mark(first, `Skip link -> #${targetId}`, target ? "ok" : "error");
          if (target) mark(target, `Destino de skip link: #${targetId}`, "ok");
          else issues = 1;
          floating("Enlace de salto", explainResult(
            "Comprueba que exista un enlace de salto al contenido y que lleve a la zona correcta.",
            `Origen: ${escapeHtml(textValue(first) || first.getAttribute("href"))}<br>Destino: #${escapeHtml(targetId)} ${target ? "encontrado" : "no encontrado"}`
          ));
        }
        result(check, issues);
        break;
      }

      case "language": {
        const lang = document.documentElement.getAttribute("lang");
        floating("Idioma de la página", explainResult(
          "Comprueba que coincide con el idioma principal del texto de la página.",
          lang
            ? `<strong>Idioma declarado:</strong> ${escapeHtml(lang)}`
            : `<strong>Idioma declarado:</strong> No declarado<br>${escapeHtml("Problema: no se encontró este elemento.")}`
        ));
        result(check, lang ? 0 : 1);
        break;
      }

      case "audio":
      case "video": {
        const media = check.id === "video"
          ? [...visibleElements("video"), ...visibleElements("iframe[src*='youtube'],iframe[src*='youtu.be'],iframe[src*='vimeo'],a[href*='youtube'],a[href*='youtu.be'],a[href*='vimeo']")]
          : mediaPlayers(check.id);
        let issues = 0;
        const items = media.map((el, index) => {
          const container = el.closest("figure,section,article,div") || el.parentElement || el;
          const heading = textValue(container.querySelector("h1,h2,h3,h4,h5,h6"));
          const mediaTitle = accessibleName(el) || heading || textValue(container).slice(0, 80) || `${check.id} ${index + 1}`;
          let label = "Audio localizado";
          if (check.id === "video") {
            const kind = el.tagName.toLowerCase() === "video" ? "Vídeo" : (el.tagName.toLowerCase() === "a" ? "Vídeo (enlace)" : "Vídeo (incrustado)");
            label = `${kind} localizado`;
          }
          mark(el, label, "warn");
          return `
            <button class="apcf-media-item" type="button" data-apcf-show-media="${index}">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${escapeHtml(el.tagName.toLowerCase())}</strong>
              <span>${escapeHtml(mediaTitle)}</span>
              <span>${escapeHtml(label)}</span>
            </button>
          `;
        });
        const box = floating(check.title, `
          <p class="apcf-explain">${escapeHtml(check.id === "audio" ? "Debe incluir una transcripción textual del audio." : "Busca la etiqueta video y resalta el elemento.")}</p>
          <p class="apcf-result">${escapeHtml(media.length ? `${media.length} reproductor(es) marcado(s).` : check.id === "audio" ? "No se encontraron elementos de audio." : "No se encontró video ni referencia a YouTube/Vimeo.")}</p>
          ${items.length ? `<div class="apcf-media-list">${items.join("")}</div>` : ""}
        `);
        if (check.id === "video" && media[0]) {
          revealElement(media[0], "Vídeo encontrado", "warn");
        }
        box.querySelectorAll("[data-apcf-show-media]").forEach(button => {
          button.addEventListener("click", () => {
            const el = media[Number(button.dataset.apcfShowMedia)];
            if (!el) return;
            const label = check.id === "video" ? "Vídeo" : "Audio";
            revealElement(el, `${label} ${Number(button.dataset.apcfShowMedia) + 1}`, "warn");
            hideCurrentFloatingPanel();
          });
        });
        result(check, check.id === "video" ? 0 : issues, media.length ? undefined : "manual");
        break;
      }

      case "focus-order": {
        const focusable = pageElements("a[href],button,input,select,textarea,[tabindex],summary,[contenteditable='true']")
          .filter(el => {
            const style = getComputedStyle(el);
            return style.visibility !== "hidden" && style.display !== "none";
          })
          .filter(el => {
            const tabindex = el.getAttribute("tabindex");
            return tabindex !== "-1";
          });
        let issues = 0;
        if (!focusable.length) {
          floating("Orden de foco", explainResult("Comprueba que el foco avance en el orden visible y que no haya `tabindex` positivo.", "No se encontraron elementos enfocables."));
          result(check, 0, "manual");
          break;
        }
        focusable.forEach((el, index) => {
          const tabindexAttr = el.getAttribute("tabindex");
          const positive = tabindexAttr && Number(tabindexAttr) > 0;
          if (positive) issues += 1;
          mark(el, `#${index + 1}`, positive ? "warn" : "ok");
        });
        result(check, issues);
        break;
      }

      case "focus-visible": {
        forceFocusVisible();
        floating("Forzar foco", explainResult("Activa el foco visible para navegar con teclado y ver claramente qué elemento tiene el foco.", "Se ha cargado el script de foco visible en la página y en los iframes accesibles."));
        result(check, 0, "manual");
        break;
      }

      case "zoom": {
        floating("Zoom", explainResult("Esta comprobación es manual. Cierra el panel y amplía la página con Control + + hasta llegar al 200%.", "No se aplica zoom automático al panel. Comprueba que la página sigue siendo legible y usable al 200%."));
        result(check, 0, "manual");
        break;
      }

      case "form-labels": {
        const fields = visibleElements("input:not([type='hidden']),select,textarea");
        let issues = 0;
        if (!fields.length) {
          floating("Etiquetas", explainResult("Observa si hay campos visibles y si están correctamente etiquetados.", "No hay formularios visibles en esta página."));
          result(check, 0, "manual");
          break;
        }
        fields.forEach(field => {
          const label = labelForField(field);
          if (!label) {
            issues += 1;
            mark(field, "Sin etiqueta o nombre", "error");
          } else {
            mark(field, `Label: ${label.slice(0, 70)}`, "ok");
          }
        });
        result(check, issues);
        break;
      }

      case "form-required": {
        const fields = visibleElements("input:not([type='hidden']),select,textarea");
        let issues = 0;
        if (!fields.length) {
          floating("Campos obligatorios", explainResult("Observa si los campos obligatorios están señalados de forma clara.", "No hay formularios visibles en esta página."));
          result(check, 0, "manual");
          break;
        }
        fields.forEach(field => {
          const required = field.required || field.getAttribute("aria-required") === "true";
          const label = labelForField(field);
          const visibleRequired = /oblig|requer|required|\*/i.test(`${label} ${textValue(field.parentElement || field)}`);
          if (required && !visibleRequired) {
            issues += 1;
            mark(field, "Obligatorio no visible", "error");
          } else if (required) {
            mark(field, "Obligatorio", "warn");
          }
        });
        result(check, issues);
        break;
      }

      case "form-errors": {
        const invalid = visibleElements("[aria-invalid='true'], input:invalid, select:invalid, textarea:invalid");
        let issues = 0;
        if (!invalid.length) {
          const fields = visibleElements("input:not([type='hidden']),select,textarea");
          if (!fields.length) {
            floating("Errores", explainResult("Observa si aparecen errores claros cuando el formulario falla.", "No hay formularios visibles en esta página."));
            result(check, 0, "manual");
            break;
          }
          floating("Errores", explainResult("Observa si aparecen errores claros cuando el formulario falla.", "No hay errores visibles ahora. Al provocar un error, debe indicarse el campo, el mensaje y una sugerencia."));
          result(check, 0, "manual");
          break;
        }
        invalid.forEach(field => {
          const described = describedText(field);
          const hasAlert = !!document.querySelector("[role='alert'],[aria-live]");
          if (!described) issues += 1;
          mark(field, described ? `Error: ${described.slice(0, 80)}` : "Error sin descripcion asociada", described ? "warn" : "error");
          if (!hasAlert) issues += 1;
        });
        result(check, issues);
        break;
      }
    }
  }

  function refreshVisuals() {
    clearVisuals();
    state.results = [];
    state.active.forEach(id => {
      const check = checks.find(item => item.id === id);
      if (check) runCheck(check);
    });
    state.grayscale = state.active.has("grayscale");
    syncGrayscale();
    updateLabels();
  }

  function checksForProfile() {
    return checks.filter(check => check.profiles.includes(state.profile));
  }

  function statusHtml() {
    if (!state.active.size) {
      return "<strong>Evalua</strong><span>Activa un check y observa las marcas en la pagina.</span>";
    }
    const last = checks.find(check => check.id === state.lastCheck);
    const guidance = last ? {
      "images": "Observa alt faltante o si el texto alternativo es util.",
      "page-title": "Comprueba que el titulo describa la pagina.",
      "headings": "Observa saltos de nivel y orden logico.",
      "landmarks": "Comprueba que las zonas estructuren la pagina.",
      "contrast": "Observa textos con contraste insuficiente.",
      "link-text": "Comprueba que cada enlace se entienda solo.",
      "skip-link": "Observa origen y destino del salto al contenido.",
      "language": "Comprueba que el idioma declarado coincida con el texto.",
      "grayscale": "Comprueba si la página sigue siendo legible en blanco y negro.",
      "audio": "Comprueba que exista transcripcion textual.",
      "video": "Comprueba subtitulos, audiodescripcion y transcripcion.",
      "focus-order": "Comprueba que el foco siga el orden visible.",
      "focus-visible": "Comprueba que el foco se vea claramente al tabular.",
      "zoom": "Comprueba la pagina al 200% con zoom manual.",
      "form-labels": "Observa campos sin etiqueta clara.",
      "form-required": "Comprueba que obligatorio sea visible.",
      "form-errors": "Provoca errores y revisa mensajes asociados."
    }[last.id] : "";
    if (guidance) return `<strong>Evalua ${escapeHtml(last.title)}</strong><span>${escapeHtml(guidance)}</span>`;
    const errors = state.results.filter(item => item.status !== "ok" && item.status !== "manual" && item.count > 0);
    const manual = state.results.filter(item => item.status === "manual");
    if (errors.length) {
      const total = errors.reduce((sum, item) => sum + item.count, 0);
      return `<strong>${total} posible(s) problema(s)</strong><span>${escapeHtml(errors.map(item => item.title).join(", "))}</span>`;
    }
    if (manual.length) {
      return `<strong>Comprobacion manual</strong><span>${escapeHtml(manual.map(item => item.title).join(", "))}</span>`;
    }
    return "<strong>Evalua</strong><span>Observa las marcas y confirma manualmente.</span>";
  }

  function groupedChecks(list) {
    const groups = [];
    list.forEach(check => {
      let group = groups.find(item => item.category === check.category);
      if (!group) {
        group = { category: check.category, items: [] };
        groups.push(group);
      }
      group.items.push(check);
    });
    return groups;
  }

  function render(focusClose = true) {
    injectStyles();
    ensurePositionListeners();
    document.documentElement.classList.add(PAGE_SHIFT);
    const existing = document.getElementById(PANEL_ID);
    const previousListScroll = existing ? (existing.querySelector(".apcf-list")?.scrollTop || 0) : 0;
    if (existing) existing.remove();

    const profile = currentProfile();
    const groups = groupedChecks(checksForProfile());
    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.setAttribute("role", "complementary");
    panel.setAttribute("aria-label", "A11y Easy Checks");
    panel.innerHTML = `
      <header class="apcf-header">
        <div>
          <div class="apcf-title-row">
            <h1 class="apcf-title">A11y Easy Checks</h1>
            <span class="apcf-beta">Beta</span>
            <span class="apcf-version">v1</span>
          </div>
          <span class="apcf-subtitle">${escapeHtml(profile.label)}</span>
        </div>
        <button class="apcf-close" type="button" aria-label="Cerrar panel">×</button>
      </header>
      <section class="apcf-status" role="status" aria-live="polite" aria-atomic="true">${statusHtml()}</section>
      <nav class="apcf-list" aria-label="Comprobaciones W3C Easy Checks">
        ${groups.map(group => `
          <div class="apcf-group-title">${escapeHtml(group.category)}</div>
          ${group.items.map(check => `
            <div class="apcf-check-shell">
              <button class="apcf-check" type="button" data-check="${escapeHtml(check.id)}" aria-pressed="${state.active.has(check.id) ? "true" : "false"}">
                <span class="apcf-option-dot" aria-hidden="true"></span>
                <span class="apcf-check-title">${escapeHtml(check.title)}</span>
                <span class="apcf-switch">${state.active.has(check.id) ? "On" : "Off"}</span>
              </button>
            </div>
          `).join("")}
        `).join("")}
      </nav>
      <fieldset class="apcf-profiles">
        <legend>Filtrar por discapacidad</legend>
        ${profiles.map(item => `
          <span class="apcf-profile-wrap">
            <input type="radio" id="apcf-profile-${escapeHtml(item.id)}" name="apcf-profile" value="${escapeHtml(item.id)}" ${item.id === state.profile ? "checked" : ""}>
            <label class="apcf-profile" for="apcf-profile-${escapeHtml(item.id)}">
              <img class="apcf-profile-icon" src="${escapeHtml(SCRIPT_BASE)}iconosDisc/${escapeHtml(item.icon)}" alt="">
              ${escapeHtml(item.short)}
            </label>
          </span>
        `).join("")}
      </fieldset>
    `;

    document.body.appendChild(panel);
    const listEl = panel.querySelector(".apcf-list");
    if (listEl) listEl.scrollTop = previousListScroll;
    panel.querySelector(".apcf-close").addEventListener("click", closePanel);
    panel.querySelectorAll("[data-check]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.check;
        const active = state.active.has(id);
        const hidden = state.hiddenPanels.has(id);
        if (active && hidden) {
          state.hiddenPanels.delete(id);
          state.lastCheck = id;
        } else if (active) {
          state.active.clear();
          state.lastCheck = "";
          state.hiddenPanels.delete(id);
        } else {
          state.active = new Set([id]);
          state.lastCheck = id;
          state.hiddenPanels.delete(id);
        }
        refreshVisuals();
        render(false);
        const next = document.querySelector(`#${PANEL_ID} [data-check="${CSS.escape(id)}"]`);
        if (next) next.focus({ preventScroll: true });
      });
    });
    panel.querySelectorAll("input[name='apcf-profile']").forEach(input => {
      input.addEventListener("change", () => {
        state.profile = input.value;
        const visibleIds = new Set(checksForProfile().map(check => check.id));
        state.active = new Set([...state.active].filter(id => visibleIds.has(id)));
        refreshVisuals();
        render(false);
        const next = document.querySelector(`#${PANEL_ID} input[name='apcf-profile'][value="${CSS.escape(state.profile)}"]`);
        if (next) next.focus({ preventScroll: true });
      });
    });
    if (focusClose) panel.querySelector(".apcf-close").focus();
  }

  function open() { render(); }
  function close() { closePanel(); }
  function toggle() {
    if (document.getElementById(PANEL_ID)) closePanel();
    else render();
  }

  window.A11yProfileCheckerFunkify = {
    open,
    close,
    toggle,
    checks,
    profiles
  };

  open();
})();
