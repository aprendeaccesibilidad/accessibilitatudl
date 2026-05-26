/*
  A11yEvalBasic Panel
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
  const FOCUS_INFO_ID = "wai-info-box";
  const FOCUS_STYLE_ID = "wai-styles";
  const BUILD = "438";
  const PANEL_WIDTH_VAR = "--apcf-panel-width";
  const PANEL_WIDTH_OPEN = "410px";
  const PANEL_WIDTH_COLLAPSED = "4.25rem";
  const INFO_URL = "https://accessibilitat.udl.cat/A11yEvalBasic/";
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
      id: "page-title",
      title: "Título de la página",
      category: "Contenido",
      profiles: ["visual-total", "cognitiva"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/page-title/"
    },
    {
      id: "language",
      title: "Idioma de la página",
      category: "Contenido",
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/language/"
    },
    {
      id: "images",
      title: "Texto alternativo de imágenes",
      category: "Contenido",
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/images/"
    },
    {
      id: "link-text",
      title: "Texto de enlaces",
      category: "Contenido",
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/link-text/"
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
      profiles: ["visual-total"],
      guide: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/"
    },
    {
      id: "skip-link",
      title: "Enlace de salto",
      category: "Interacción",
      profiles: ["visual-total", "motriz"],
      guide: "https://www.w3.org/WAI/test-evaluate/easy-checks/skip-link/"
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
      category: "Multimedia",
      profiles: ["visual-total", "auditiva", "cognitiva"],
      guide: "https://www.w3.org/WAI/media/av/transcripts/"
    },
    {
      id: "video",
      title: "Vídeo",
      category: "Multimedia",
      profiles: ["visual-total", "auditiva", "cognitiva"],
      guide: "https://www.w3.org/WAI/media/av/"
    },
    {
      id: "form-labels",
      title: "Etiquetas",
      category: "Formularios",
      profiles: ["visual-total"],
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
      id: "focus-view",
      title: "Mostrar foco",
      category: "Interacción",
      profiles: ["motriz", "baja-vision"],
      guide: "https://w3.org/wai/test-evaluate/easy-checks/keyboard-focus/"
    },
  ];

  const state = {
    profile: "visual-total",
    active: new Set(),
    results: [],
    lastCheck: "",
    wandVisible: true,
    imagesVisible: true,
    headingsVisible: true,
    landmarksVisible: true,
    contrastVisible: true,
    audioVisible: true,
    videoVisible: true,
    linkTextVisible: true,
    hiddenPanels: new Set(),
    panelSummaries: new Map(),
    currentPanelId: "",
    lastSelectedElement: null,
    floatingPosition: null,
    summaryFloatingPosition: null,
    grayscale: false,
    panelCollapsed: false
  };

  function syncPanelWidth() {
    document.documentElement.style.setProperty(PANEL_WIDTH_VAR, state.panelCollapsed ? PANEL_WIDTH_COLLAPSED : PANEL_WIDTH_OPEN);
    document.documentElement.classList.toggle("apcf-panel-collapsed", state.panelCollapsed);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function sentenceCase(value) {
    const text = String(value).trim().toLocaleLowerCase("es-ES");
    if (!text) return text;
    return text.charAt(0).toLocaleUpperCase("es-ES") + text.slice(1);
  }

  function listHead(className, cells) {
    return `<div class="apcf-list-head ${className}">${cells.map(cell => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.${PAGE_SHIFT} {
        --apcf-panel-width: ${PANEL_WIDTH_OPEN};
        padding-left: var(${PANEL_WIDTH_VAR}) !important;
        box-sizing: border-box !important;
        font-size: 16px !important;
      }

      html.${PAGE_SHIFT}.apcf-panel-collapsed {
        --apcf-panel-width: ${PANEL_WIDTH_COLLAPSED};
      }

      html.${PAGE_SHIFT} body {
        margin-left: 0 !important;
        max-width: calc(100vw - var(${PANEL_WIDTH_VAR})) !important;
        box-sizing: border-box !important;
        overflow-x: auto !important;
        font-size: 16px !important;
      }

      #${PANEL_ID} {
        all: initial;
        position: fixed;
        inset: 0 auto 0 0;
        z-index: 2147483647;
        width: var(${PANEL_WIDTH_VAR});
        height: 100vh;
        display: grid;
        grid-template-rows: auto auto auto auto minmax(0, 1fr) auto;
        background: #f7f7f5;
        color: #171717;
        border-right: 1px solid #d7d7d2;
        box-shadow: 16px 0 40px rgb(0 0 0 / .2);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 16px;
        line-height: 1.4;
      }

      #${PANEL_ID} *, #${PANEL_ID} *::before, #${PANEL_ID} *::after {
        box-sizing: border-box;
        font-family: inherit;
      }

      #${PANEL_ID} :where(header, nav, section, fieldset, legend, div, span, h1, h2, h3, p, ol, ul, li, table, thead, tbody, tr, th, td, button, input, label, a, img),
      .${FLOATING} :where(header, nav, section, fieldset, legend, div, span, h1, h2, h3, p, ol, ul, li, table, thead, tbody, tr, th, td, button, input, label, a, img) {
        all: revert;
        box-sizing: border-box !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        letter-spacing: 0 !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed {
        overflow-y: scroll !important;
        overflow-x: hidden !important;
        scrollbar-gutter: stable !important;
        background: transparent !important;
        border-right: 0 !important;
        box-shadow: none !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed > :not(.apcf-panel-toggle) {
        display: none !important;
      }

      #${PANEL_ID} > .apcf-panel-toggle {
        position: absolute !important;
        top: .44rem !important;
        right: 0 !important;
        left: auto !important;
        z-index: 2147483647 !important;
        width: 2rem !important;
        height: 2rem !important;
        padding: 0 !important;
        border: 2px solid #000000 !important;
        border-radius: 999px !important;
        background: #8a1f66 !important;
        color: #ffffff !important;
        box-shadow: 0 8px 18px rgb(0 0 0 / .22) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
      }

      #${PANEL_ID}:not(.apcf-panel-collapsed) > .apcf-panel-toggle {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        border: 0 !important;
        padding: 0 !important;
      }

      #${PANEL_ID} .apcf-panel-toggle-header {
        position: static !important;
        width: 4rem !important;
        min-width: 3.9rem !important;
        height: 3.78rem !important;
        padding: 0 !important;
        border: 2px solid #000000 !important;
        border-radius: 0 1.02rem 1.02rem 0 !important;
        background: #8a1f66 !important;
        color: #ffffff !important;
        box-shadow: 0 8px 18px rgb(0 0 0 / .22) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        cursor: pointer !important;
        align-self: flex-start !important;
        margin-right: -40px !important;
        margin-top: -.2rem !important;
      }

      #${PANEL_ID} .apcf-header-actions {
        display: flex !important;
        gap: .45rem !important;
        flex-wrap: nowrap !important;
        margin-left: auto !important;
        justify-self: end !important;
        align-items: center !important;
        margin-top: -.04rem !important;
      }

      #${PANEL_ID} .apcf-window-title {
        gap: .45rem !important;
        font-size: 1.34rem !important;
      }

      #${PANEL_ID} .apcf-title-icon {
        width: 2.05rem !important;
        height: 2.05rem !important;
        max-width: 2.05rem !important;
        min-width: 2.05rem !important;
      }

      #${PANEL_ID} .apcf-panel-toggle-icon {
        display: none !important;
        width: 1.5rem !important;
        height: 1.5rem !important;
        object-fit: contain !important;
        filter: none !important;
        pointer-events: none !important;
        flex: 0 0 auto !important;
        background: transparent !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed .apcf-panel-toggle-header .apcf-panel-toggle-icon {
        display: block !important;
        width: 1.9rem !important;
        height: 1.9rem !important;
        margin-right: .08rem !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed .apcf-panel-toggle-header {
        width: 4rem !important;
        min-width: 4rem !important;
        height: 4rem !important;
        padding: 0 .35rem 0 .46rem !important;
        justify-content: space-between !important;
        border-radius: 0 1.02rem 1.02rem 0 !important;
      }

      #${PANEL_ID} .apcf-panel-toggle-header::after {
        content: "" !important;
        display: block !important;
        width: 1.1rem !important;
        height: 1.1rem !important;
        border-top: .32rem solid #ffffff !important;
        border-right: .32rem solid #ffffff !important;
        transform: rotate(225deg) !important;
        margin-left: .35rem !important;
      }

      #${PANEL_ID} button,
      #${PANEL_ID} input,
      .${FLOATING} button,
      .${FLOATING} input {
        appearance: none !important;
        -webkit-appearance: none !important;
        font: inherit !important;
      }

      #${PANEL_ID} img,
      .${FLOATING} img {
        max-width: 100% !important;
        height: auto !important;
      }

      #${PANEL_ID} .apcf-header {
        min-height: 3.35rem;
        display: grid;
        grid-template-rows: auto auto;
        padding: .52rem .35rem 0 .62rem;
        background: #831451;
        color: #ffffff;
        border-bottom: 0;
      }

      #${PANEL_ID} .apcf-window-bar {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: .28rem;
        align-items: center;
        width: 100%;
        padding: 0;
        background: transparent;
        border-bottom: 0;
      }

      #${PANEL_ID} .apcf-window-title {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        gap: .38rem;
        color: #ffffff;
        font-size: 1.31rem;
        line-height: 1;
        font-weight: 950;
        justify-self: start;
        text-align: left;
        letter-spacing: 0;
        flex-wrap: wrap;
      }

      #${PANEL_ID} .apcf-title-icon {
        width: 2rem;
        height: 2rem;
        padding: 0;
        border-radius: 0;
        background: transparent;
        object-fit: contain;
        flex: 0 0 auto;
        filter: none;
        opacity: 1;
      }

      #${PANEL_ID} .apcf-release-note {
        display: block;
        display: inline-block;
        margin: .24rem 0 0;
        padding: .16rem .32rem .2rem;
        width: fit-content;
        max-width: 100%;
        
        background: #ffffff;
        color: #171717;
        font-size: .7rem;
        font-weight: 850;
        line-height: 1.15;
        text-align: right;
        white-space: nowrap;
      }

      #${PANEL_ID} .apcf-release-note a {
        color: #315bdc;
        font-weight: 900;
        text-decoration: underline;
        text-underline-offset: .12em;
      }

      #${PANEL_ID} .apcf-header-main {
        display: block;
        margin: .14rem -0.62rem -0.3rem;
        padding: .16rem .62rem .2rem;
        background: #ffffff;
      }

      #${PANEL_ID} .apcf-title {
        margin: 0;
        color: #000000;
        font-size: 1.36rem;
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
        font-size: 1.1rem;
        line-height: 1;
        font-weight: 950;
      }

      #${PANEL_ID} .apcf-profile-banner {
        display: flex;
        align-items: center;
        gap: .5rem;
        width: 100%;
        padding: .14rem .85rem .14rem .32rem;
        background: #000000;
        color: #ffffff;
        font-size: 1.08rem;
        font-weight: 950;
      }

      #${PANEL_ID} .apcf-profile-banner-icon {
        width: 1.15rem;
        height: 1.15rem;
        object-fit: contain;
        filter: brightness(0) invert(1);
        flex: 0 0 auto;
      }

      #${PANEL_ID} .apcf-header-actions {
        display: flex;
        gap: .28rem;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
        margin-left: auto;
      }

      #${PANEL_ID} .apcf-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        min-height: 2rem;
        border: 2px solid rgb(255 255 255 / .42);
        border-radius: 999px;
        background: rgb(255 255 255 / .12);
        color: #ffffff;
        line-height: 1;
        text-decoration: none;
        padding: 0 .22rem;
        font-size: .6rem;
        font-weight: 950;
      }

      #${PANEL_ID} .apcf-close {
        width: 1.62rem;
        height: 1.62rem;
        position: relative;
        padding: 0;
        cursor: pointer;
        transform: translateY(-.02rem);
      }

      #${PANEL_ID} .apcf-panel-toggle-header {
        position: relative !important;
        align-self: stretch !important;
        width: 3.65rem !important;
        min-width: 3.65rem !important;
        height: 3.88rem !important;
        padding: 0 !important;
        border-width: 2px 2px 2px 0 !important;
        border-radius: 0 1.02rem 1.02rem 0 !important;
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / .06), 0 8px 18px rgb(0 0 0 / .22) !important;
        margin-right: -30px !important;
        transform: translateY(-.16rem) !important;
      }

      #${PANEL_ID}:not(.apcf-panel-collapsed) > .apcf-panel-toggle {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        border: 0 !important;
        padding: 0 !important;
      }

      #${PANEL_ID} .apcf-close::before,
      #${PANEL_ID} .apcf-close::after {
        content: "";
        position: absolute;
        width: .72rem;
        height: .12rem;
        border-radius: 999px;
        background: #ffffff;
      }

      #${PANEL_ID} .apcf-close::before { transform: rotate(45deg); }
      #${PANEL_ID} .apcf-close::after { transform: rotate(-45deg); }

      #${PANEL_ID} .apcf-info {
        display: inline-flex;
        justify-content: flex-start;
        width: max-content;
        max-width: 100%;
        border: 1px solid #e5e5e5;
        border-radius: .35rem;
        background: #ffffff;
        color: #777777;
        padding: .22rem .35rem;
        font-size: .9rem;
        font-weight: 750;
        line-height: 1.1;
        text-decoration: none;
        justify-self: start;
      }

      #${PANEL_ID} .apcf-status {
        display: grid;
        grid-template-rows: auto auto;
        align-content: start;
        gap: .06rem;
        width: 100%;
        min-height: 4.45rem;
        padding: .16rem .95rem .12rem .3rem;
        margin: 0 !important;
        border: 0;
        border-bottom: 1px solid #dadad7;
        background: #fff9e6;
        color: #312200;
        font-size: 1.02rem;
        line-height: 1.04;
        font-weight: 850;
        align-self: start;
      }

      #${PANEL_ID} .apcf-status strong { display: block; margin: 0; color: #111; font-size: 1.1rem; line-height: 1.02; }
      #${PANEL_ID} .apcf-status span { display: block; margin: 0; color: #5b4712; font-weight: 850; font-size: 1.08rem; line-height: 1.02; }

      #${PANEL_ID} .apcf-list {
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-gutter: stable;
        min-height: 0;
        align-self: stretch;
        padding: 0 .38rem .35rem;
      }

      #${PANEL_ID} .apcf-group-title {
        margin: .16rem .06rem .14rem;
        color: #831451;
        font-size: 1.34rem;
        font-weight: 1000;
        letter-spacing: .01em;
        text-transform: uppercase;
      }

      #${PANEL_ID} .apcf-check-shell {
        width: 100%;
        margin: .05rem 0;
      }

      #${PANEL_ID} .apcf-check {
        width: 100%;
        min-height: 4.15rem;
        display: grid;
        grid-template-columns: 1.95rem 1fr auto;
        gap: .34rem;
        align-items: center;
        margin: 0;
        border: 2px solid #bdbdb8;
        border-radius: 1.4rem;
        background: #fbfbf9;
        color: #171717;
        padding: .44rem .64rem;
        text-align: left;
        cursor: pointer;
        box-shadow: 0 7px 18px rgb(0 0 0 / .09);
      }

      #${PANEL_ID} .apcf-check > * {
        min-width: 0;
      }

      #${PANEL_ID} .apcf-check[aria-pressed="true"] {
        border-color: #171717;
        background: #fff4cc;
        box-shadow: 0 0 0 4px rgb(247 189 61 / .36), 0 7px 18px rgb(0 0 0 / .1);
        outline: 3px solid #f7bd3d;
        outline-offset: -2px;
      }

      #${PANEL_ID} .apcf-option-dot {
        width: 1.35rem;
        height: 1.35rem;
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
        font-size: .98rem;
        line-height: 1.08;
        font-weight: 950;
        overflow-wrap: anywhere;
        hyphens: auto;
      }

      #${PANEL_ID} .apcf-switch {
        min-width: 3.15rem;
        border-radius: 999px;
        background: #e4e4df;
        color: #42423e;
        padding: .36rem .52rem;
        font-size: .92rem;
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
        gap: .28rem;
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
        width: 1px;
        height: 1px;
        margin: -1px;
        padding: 0;
        border: 0;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
      }

      #${PANEL_ID} .apcf-profile {
        min-height: 86px;
        display: grid;
        grid-template-rows: 2.35rem 1fr;
        align-items: center;
        justify-items: center;
        gap: 0;
        border-right: 1px solid #e1e1de;
        color: #4d4d4d;
        padding: .38rem .16rem .02rem;
        font-size: .84rem;
        line-height: 1.05;
        font-weight: 850;
        text-align: center;
      }

      #${PANEL_ID} .apcf-profile-icon {
        display: block;
        width: 2.2rem;
        height: 2.2rem;
        max-width: 2.2rem;
        max-height: 2.2rem;
        min-width: 2.2rem;
        min-height: 2.2rem;
        object-fit: contain;
        margin-top: .26rem;
      }

      #${PANEL_ID} .apcf-profile-wrap input:checked + .apcf-profile {
        background: #fff5d6;
        color: #831451;
        box-shadow: inset 0 6px 0 #821550;
        outline: 3px solid #821550;
        outline-offset: -2px;
      }

      #${PANEL_ID} .apcf-close:focus-visible,
      #${PANEL_ID} .apcf-panel-toggle:focus-visible,
      #${PANEL_ID} .apcf-release-note a:focus-visible,
      #${PANEL_ID} .apcf-check:focus-visible,
      #${PANEL_ID} .apcf-profile-wrap input:focus-visible + .apcf-profile {
        outline: 4px solid #0b66d8;
        outline-offset: -3px;
      }

      .${MARK} {
        outline: 2px solid #171717 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 6px rgb(247 189 61 / .36) !important;
      }

      .${MARK}[data-apcf-severity="error"] {
        box-shadow: 0 0 0 6px rgb(155 28 43 / .28) !important;
      }

      .${MARK}[data-apcf-skip-link="true"] {
        box-shadow: 0 0 0 6px rgb(247 189 61 / .36) !important;
      }

      .${MARK}[data-apcf-mark-kind="media"],
      .${MARK}[data-apcf-mark-kind="link"] {
        outline: 2px solid #171717 !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 6px rgb(247 189 61 / .36) !important;
      }

      .${MARK}[data-apcf-severity="ok"] {
        box-shadow: 0 0 0 6px rgb(247 189 61 / .28) !important;
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
        white-space: pre-line !important;
      }

      .${LABEL}[data-apcf-subtle="true"] {
        max-width: 28rem !important;
        padding: .46rem .62rem !important;
        font-size: 12px !important;
        opacity: .95 !important;
      }

      .${LABEL}[data-apcf-severity="error"] { background: #9b1c2b !important; color: white !important; }
      .${LABEL}[data-apcf-severity="warn"] { background: #f7bd3d !important; color: #171717 !important; }
      .${LABEL}[data-apcf-severity="ok"] { background: #f7bd3d !important; color: #171717 !important; }
      .${LABEL}[data-apcf-skip-link="true"] {
        max-width: 32rem !important;
        padding: .62rem .82rem !important;
        font-size: 18px !important;
        line-height: 1.25 !important;
      }

      .${FLOATING} {
        position: fixed !important;
        z-index: 2147483647 !important;
        left: calc(var(${PANEL_WIDTH_VAR}) + 1rem) !important;
        right: 1rem !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: min(900px, calc(100vw - var(${PANEL_WIDTH_VAR}) - 2rem)) !important;
        max-width: min(900px, calc(100vw - var(${PANEL_WIDTH_VAR}) - 2rem)) !important;
        max-height: min(74vh, calc(100vh - 2rem)) !important;
        display: grid !important;
        grid-template-rows: auto minmax(0, 1fr) !important;
        overflow: hidden !important;
        border: 1px solid #2f2f2f !important;
        border-radius: 1rem !important;
        background: #202020 !important;
        color: #f2f2f2 !important;
        box-shadow: 0 24px 72px rgb(0 0 0 / .38) !important;
        padding: 0 !important;
        font: 600 17px/1.46 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      .${FLOATING}, .${FLOATING} * {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      .${FLOATING}.apcf-floating-minimized {
        top: auto !important;
        bottom: 1rem !important;
        transform: none !important;
        max-height: 3.9rem !important;
        overflow: hidden !important;
      }

      .${FLOATING}.apcf-floating-summary {
        z-index: 2147483647 !important;
        left: calc(var(${PANEL_WIDTH_VAR}) + 1rem) !important;
        right: 1rem !important;
        top: auto !important;
        bottom: 1rem !important;
        transform: none !important;
        width: min(900px, calc(100vw - var(${PANEL_WIDTH_VAR}) - 2rem)) !important;
        max-width: calc(100vw - var(${PANEL_WIDTH_VAR}) - 2rem) !important;
        max-height: none !important;
        grid-template-rows: auto !important;
      }

      .${FLOATING} *, .${FLOATING} *::before, .${FLOATING} *::after {
        box-sizing: border-box !important;
      }

      .${FLOATING} .apcf-floating-head {
        display: grid !important;
        grid-template-columns: 1fr auto auto !important;
        gap: .45rem !important;
        align-items: center !important;
        padding: .9rem 1rem !important;
        border-bottom: 1px solid #555 !important;
        cursor: grab !important;
        user-select: none !important;
        touch-action: none !important;
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

      .${FLOATING} .apcf-floating-control-primary {
        min-width: 8rem !important;
      }

      .${FLOATING}.apcf-floating-summary .apcf-floating-head {
        cursor: grab !important;
        touch-action: none !important;
      }

      .${FLOATING}.apcf-floating-summary h2 {
        font-size: 1.12rem !important;
      }

      .${FLOATING}.apcf-floating-summary .apcf-summary-text {
        min-width: 0 !important;
        overflow-wrap: anywhere !important;
        hyphens: auto !important;
      }

      .${FLOATING}.apcf-floating-summary .apcf-summary-text p.apcf-summary-alert {
        display: inline-block !important;
        width: fit-content !important;
        max-width: 100% !important;
        margin: .06rem 0 0 !important;
        padding: .18rem .42rem !important;
        border-radius: .38rem !important;
        background: #8f1d2c !important;
        color: #ffffff !important;
      }

      .${FLOATING}.apcf-floating-summary .apcf-summary-text .apcf-summary-alert-inline {
        display: inline-block !important;
        margin: .06rem 0 0 .35rem !important;
        padding: .18rem .42rem !important;
        border-radius: .38rem !important;
        background: #8f1d2c !important;
        color: #ffffff !important;
        font-weight: 700 !important;
      }

      .${FLOATING}.apcf-floating-summary .apcf-summary-text .apcf-summary-alert-block {
        display: block !important;
        width: fit-content !important;
        margin: .18rem 0 0 !important;
      }

      .${FLOATING}.apcf-floating-summary p {
        margin: .18rem 0 0 !important;
        color: #f2f2f2 !important;
        font-size: 1rem !important;
        font-weight: 650 !important;
        overflow-wrap: anywhere !important;
        hyphens: auto !important;
      }

      .${FLOATING}.apcf-floating-summary p:first-of-type {
        color: #f7bd3d !important;
        font-weight: 800 !important;
      }

      .${FLOATING}.apcf-floating-summary[data-apcf-severity="error"] .apcf-floating-head {
        border-bottom-color: rgb(255 255 255 / .42) !important;
      }

      .${FLOATING}.apcf-floating-summary[data-apcf-severity="error"] .apcf-floating-control {
        border-color: #ffffff !important;
        background: #7a0010 !important;
        color: #ffffff !important;
      }

      .${FLOATING} .apcf-floating-head:active {
        cursor: grabbing !important;
      }

      .${FLOATING} .apcf-floating-head:focus-visible {
        outline: 3px solid #f7bd3d !important;
        outline-offset: -3px !important;
      }

      .${FLOATING} .apcf-floating-body {
        padding: 1rem 1.05rem 1.1rem !important;
        min-height: 0 !important;
        overflow: auto !important;
        overflow-wrap: anywhere !important;
        hyphens: auto !important;
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
      .${FLOATING} li { margin: .28rem 0 !important; color: #f2f2f2 !important; font-size: 1.08rem !important; }
      .${FLOATING} .apcf-explain {
        color: #f7bd3d !important;
        font-weight: 800 !important;
        font-size: 1.08rem !important;
        line-height: 1.45 !important;
      }
      .${FLOATING} .apcf-result {
        color: #ffffff !important;
        font-weight: 650 !important;
        font-size: 1.05rem !important;
        line-height: 1.45 !important;
      }
      .${FLOATING} .apcf-problem {
        display: flex !important;
        align-items: flex-start !important;
        gap: .5rem !important;
        margin: .45rem 0 !important;
        border-radius: .6rem !important;
        background: #8f1d2c !important;
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

      .${FLOATING} .apcf-heading-text {
        display: inline-block !important;
        color: inherit !important;
      }

      .${FLOATING} .apcf-tree-button {
        display: grid !important;
        grid-template-columns: auto 1fr !important;
        gap: .45rem !important;
        align-items: start !important;
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

      .${FLOATING} .apcf-landmark-tree {
        display: grid !important;
        gap: .55rem !important;
      }

      .${FLOATING} .apcf-landmark-node {
        position: relative !important;
        display: grid !important;
        gap: .45rem !important;
        margin-left: var(--apcf-indent, 0) !important;
      }

      .${FLOATING} .apcf-landmark-node::before {
        content: "" !important;
        position: absolute !important;
        left: -1rem !important;
        top: .75rem !important;
        bottom: .2rem !important;
        width: 2px !important;
        background: rgb(242 242 242 / .22) !important;
      }

      .${FLOATING} .apcf-landmark-node > .apcf-landmark-box {
        margin-left: 0 !important;
      }

      .${FLOATING} .apcf-landmark-box {
        display: grid !important;
        grid-template-columns: minmax(0, .9fr) minmax(0, 1.05fr) minmax(0, 1.05fr) !important;
        gap: .45rem !important;
        align-items: start !important;
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
        margin-top: 0 !important;
        color: #ffdf8a !important;
        font-size: 1.08rem !important;
        font-weight: 750 !important;
      }

      .${FLOATING} .apcf-landmark-box .apcf-landmark-type {
        display: block !important;
        font-size: 1.16rem !important;
        font-weight: 950 !important;
      }

      .${FLOATING} .apcf-landmark-children {
        display: grid !important;
        gap: .55rem !important;
        padding-left: 1rem !important;
      }

      .apcf-wand-tip {
        position: fixed !important;
        z-index: 2147483647 !important;
        left: calc(var(${PANEL_WIDTH_VAR}) + 1rem) !important;
        right: 1rem !important;
        bottom: 1rem !important;
        top: auto !important;
        max-width: calc(100vw - var(${PANEL_WIDTH_VAR}) - 2rem) !important;
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
        display: inline-flex !important;
        align-items: center !important;
        max-width: 100% !important;
        border-radius: .35rem !important;
        padding: .28rem .45rem !important;
        font-weight: 850 !important;
        line-height: 1.2 !important;
        white-space: normal !important;
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / .08) !important;
      }

      .${FLOATING} .apcf-muted-note {
        color: #5f5f5f !important;
        font-weight: 650 !important;
        font-size: .95em !important;
      }

      .${FLOATING} .apcf-media-list {
        display: grid !important;
        gap: 0 !important;
        margin-top: 0 !important;
        max-height: min(46vh, 28rem) !important;
        overflow: auto !important;
        border: 1px solid #747474 !important;
        border-top: 0 !important;
        border-radius: 0 0 .65rem .65rem !important;
      }

      .${FLOATING} .apcf-list-head {
        display: grid !important;
        gap: 0 !important;
        margin-top: .75rem !important;
        margin-bottom: 0 !important;
        padding: 0 !important;
        border: 1px solid #747474 !important;
        border-bottom: 0 !important;
        border-radius: .65rem .65rem 0 0 !important;
        background: #202020 !important;
        color: #f7bd3d !important;
        font-size: .92rem !important;
        font-weight: 900 !important;
        line-height: 1.1 !important;
        position: sticky !important;
        top: 3.2rem !important;
        z-index: 2 !important;
      }

      .${FLOATING} .apcf-list-head span {
        color: inherit !important;
        font: inherit !important;
        display: block !important;
        min-width: 0 !important;
        padding: .5rem .6rem !important;
        border-right: 1px solid #747474 !important;
        border-bottom: 1px solid #747474 !important;
      }

      .${FLOATING} .apcf-list-head > span:first-child {
        text-align: center !important;
      }

      .${FLOATING} .apcf-list-head span:last-child {
        border-right: 0 !important;
      }

      .${FLOATING} .apcf-list-head--image,
      .${FLOATING} .apcf-list-head--media {
        grid-template-columns: 3.4rem minmax(3rem, 4.8rem) minmax(0, 1.2fr) minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-list-head--video {
        grid-template-columns: 3rem minmax(8rem, .85fr) minmax(3.25rem, .45fr) minmax(0, 1.55fr) minmax(7rem, .95fr) minmax(0, 1.2fr) !important;
      }

      .${FLOATING} .apcf-list-head--image > span:first-child {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 3.4rem !important;
        text-align: center !important;
      }

      .${FLOATING} .apcf-list-head--link {
        grid-template-columns: 3rem minmax(3rem, 4.8rem) minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-list-head--form {
        grid-template-columns: 3rem minmax(10rem, 16%) minmax(0, 1fr) minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-list-head--heading {
        grid-template-columns: 4rem minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-list-head--landmark {
        grid-template-columns: minmax(9rem, .9fr) minmax(0, 1.05fr) minmax(0, 1.05fr) !important;
      }

      .${FLOATING} .apcf-landmark-map {
        margin-top: 0 !important;
        max-height: none !important;
        overflow: hidden !important;
        border: 1px solid #747474 !important;
        border-top: 0 !important;
        border-radius: 0 0 .65rem .65rem !important;
      }

      .${FLOATING} .apcf-media-item {
        appearance: none !important;
        width: 100% !important;
        display: grid !important;
        grid-template-columns: 3.4rem minmax(3rem, 4.8rem) minmax(0, 1.2fr) minmax(0, 1fr) !important;
        gap: 0 !important;
        align-items: start !important;
        border: 1px solid #595959 !important;
        border-radius: 0 !important;
        margin-top: -1px !important;
        padding: 0 !important;
        color: #f2f2f2 !important;
        background: #2a2a2a !important;
        text-align: left !important;
        cursor: pointer !important;
        overflow: hidden !important;
      }

      .${FLOATING} .apcf-media-item > :first-child {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .${FLOATING} .apcf-link-item > :first-child,
      .${FLOATING} .apcf-form-item > :first-child {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }

      .${FLOATING} .apcf-media-item > * {
        min-width: 0 !important;
        padding: .55rem .6rem !important;
        border-right: 1px solid #595959 !important;
      }

      .${FLOATING} .apcf-media-item > *:last-child {
        border-right: 0 !important;
      }

      .${FLOATING} .apcf-media-list > .apcf-media-item:first-child {
        margin-top: 0 !important;
      }

      .${FLOATING} .apcf-media-list > .apcf-media-item:last-child {
        border-radius: 0 0 .65rem .65rem !important;
      }

      .${FLOATING} .apcf-form-item {
        grid-template-columns: 3rem minmax(10rem, 16%) minmax(0, 1fr) minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-video-item {
        grid-template-columns: 3rem minmax(8rem, .85fr) minmax(3.25rem, .45fr) minmax(0, 1.55fr) minmax(7rem, .95fr) minmax(0, 1.2fr) !important;
      }

      .${FLOATING} .apcf-form-item strong {
        font-size: 1rem !important;
      }

      .${FLOATING} .apcf-form-item span {
        font-size: .96rem !important;
      }

      .${FLOATING} .apcf-link-item {
        grid-template-columns: 3rem minmax(3rem, 4.8rem) minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-link-item span:nth-of-type(5) {
        color: #ffdf8a !important;
        font-size: .98rem !important;
      }

      .${FLOATING} .apcf-link-item span:last-child {
        color: #e0e0e0 !important;
        font-size: .98rem !important;
      }

      .${FLOATING} .apcf-link-item > :nth-child(2) {
        text-align: left !important;
        font-variant-numeric: tabular-nums !important;
      }

      .${FLOATING} .apcf-link-item > :first-child,
      .${FLOATING} .apcf-form-item > :first-child,
      .${FLOATING} .apcf-contrast-table th:first-child,
      .${FLOATING} .apcf-contrast-table td:first-child {
        text-align: center !important;
      }

      .${FLOATING} .apcf-media-item > :nth-child(2) {
        text-align: left !important;
        font-variant-numeric: tabular-nums !important;
      }

      .${FLOATING} .apcf-contrast-table td:first-child {
        text-align: center !important;
        vertical-align: middle !important;
      }

      .${FLOATING} .apcf-contrast-table td:first-child .apcf-mini-button {
        margin: 0 auto !important;
      }

      .${FLOATING} .apcf-link-item[data-apcf-severity="error"] {
        border-color: #8f1d2c !important;
        background: rgb(143 29 44 / .22) !important;
      }

      .${FLOATING} .apcf-media-item[data-apcf-severity="error"] {
        border-color: #8f1d2c !important;
        background: #8f1d2c !important;
        color: #ffffff !important;
      }

      .${FLOATING} .apcf-media-item[data-apcf-severity="error"] > * {
        border-color: rgb(255 255 255 / .42) !important;
        color: #ffffff !important;
      }

      .${FLOATING} .apcf-media-item[data-apcf-severity="error"] .apcf-mini-button {
        background: #ffffff !important;
        color: #7a0010 !important;
        border-color: #ffffff !important;
      }

      .${FLOATING} .apcf-media-item[data-apcf-severity="warn"] {
        border-color: #7d5e12 !important;
        background: rgb(247 189 61 / .16) !important;
      }

      .${FLOATING} .apcf-media-item[data-apcf-severity="ok"] {
        border-color: #4f7d3a !important;
        background: rgb(79 125 58 / .22) !important;
      }

      .${FLOATING} .apcf-link-item[data-apcf-severity="warn"] {
        border-color: #7d5e12 !important;
        background: rgb(247 189 61 / .16) !important;
      }

      .${FLOATING} .apcf-link-item[data-apcf-severity="ok"] {
        border-color: #4f7d3a !important;
        background: rgb(79 125 58 / .22) !important;
      }

      .${FLOATING} .apcf-media-item strong {
        color: #ffffff !important;
        font-size: 1.08rem !important;
      }

      .${FLOATING} .apcf-media-item span {
        color: #e0e0e0 !important;
        font-size: 1.04rem !important;
      }

      .${FLOATING} .apcf-video-item strong,
      .${FLOATING} .apcf-video-item span {
        font-size: .92rem !important;
      }

      .${FLOATING} .apcf-video-item > :nth-child(2) {
        word-break: break-word !important;
      }

      .${FLOATING} .apcf-video-item > :nth-child(3) {
        text-align: center !important;
        font-variant-numeric: tabular-nums !important;
      }

      .${FLOATING} .apcf-video-item > :nth-child(4),
      .${FLOATING} .apcf-video-item > :nth-child(6) {
        word-break: break-word !important;
      }

      .${FLOATING} .apcf-media-item strong,
      .${FLOATING} .apcf-media-item span {
        display: block !important;
      }

      .${FLOATING} .apcf-media-item strong {
        text-align: center !important;
        line-height: 1 !important;
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

      .${FLOATING} .apcf-panel-option + .apcf-explain {
        margin-top: .1rem !important;
      }

      .${FLOATING} .apcf-table-scroll {
        max-height: min(48vh, 31rem) !important;
        overflow: auto !important;
        margin-top: .65rem !important;
        border: 1px solid #747474 !important;
        scrollbar-gutter: stable both-edges !important;
      }

      .${FLOATING} .apcf-data-table,
      .${FLOATING} .apcf-contrast-table {
        width: 100% !important;
        table-layout: fixed !important;
        border-collapse: collapse !important;
        border: 1px solid #747474 !important;
        margin-top: 0 !important;
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
        box-sizing: border-box !important;
        padding: .55rem .65rem !important;
        color: #f2f2f2 !important;
        text-align: left !important;
        vertical-align: middle !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
        font-size: 1.03rem !important;
        line-height: 1.3 !important;
      }

      .${FLOATING} .apcf-data-table thead th,
      .${FLOATING} .apcf-contrast-table thead th {
        position: sticky !important;
        top: 3.2rem !important;
        z-index: 1 !important;
        background: #202020 !important;
        color: #f7bd3d !important;
        box-shadow: inset 0 -1px 0 #747474 !important;
        vertical-align: middle !important;
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
      .${FLOATING} .apcf-data-table td:nth-child(1),
      .${FLOATING} .apcf-contrast-table th:nth-child(1),
      .${FLOATING} .apcf-contrast-table td:nth-child(1) {
        width: 1% !important;
        min-width: 3.85rem !important;
        max-width: 4rem !important;
        padding-left: .25rem !important;
        padding-right: .25rem !important;
        text-align: center !important;
        white-space: nowrap !important;
      }
      .${FLOATING} .apcf-contrast-table th:nth-child(2),
      .${FLOATING} .apcf-contrast-table td:nth-child(2) { width: 27% !important; }
      .${FLOATING} .apcf-contrast-table th:nth-child(3),
      .${FLOATING} .apcf-contrast-table td:nth-child(3) { width: 16% !important; }
      .${FLOATING} .apcf-contrast-table th:nth-child(4),
      .${FLOATING} .apcf-contrast-table td:nth-child(4) { width: 16% !important; }
      .${FLOATING} .apcf-contrast-table th:nth-child(5),
      .${FLOATING} .apcf-contrast-table td:nth-child(5) { width: 8.2rem !important; }
      .${FLOATING} .apcf-contrast-table th:nth-child(6),
      .${FLOATING} .apcf-contrast-table td:nth-child(6) { width: 6.1rem !important; }
      .${FLOATING} .apcf-contrast-table th:nth-child(7),
      .${FLOATING} .apcf-contrast-table td:nth-child(7) { width: 5.9rem !important; }
      .${FLOATING} .apcf-contrast-table th:nth-child(8),
      .${FLOATING} .apcf-contrast-table td:nth-child(8) { width: 5.9rem !important; }
      .${FLOATING} .apcf-contrast-table th:nth-child(6),
      .${FLOATING} .apcf-contrast-table td:nth-child(6),
      .${FLOATING} .apcf-contrast-table th:nth-child(7),
      .${FLOATING} .apcf-contrast-table td:nth-child(7),
      .${FLOATING} .apcf-contrast-table th:nth-child(8),
      .${FLOATING} .apcf-contrast-table td:nth-child(8) {
        text-align: center !important;
        font-variant-numeric: tabular-nums !important;
        white-space: nowrap !important;
      }
      .${FLOATING} .apcf-data-table th:nth-child(2),
      .${FLOATING} .apcf-data-table td:nth-child(2) { width: 13% !important; }
      .${FLOATING} .apcf-data-table th:nth-child(3),
      .${FLOATING} .apcf-data-table td:nth-child(3) { width: 18% !important; }
      .${FLOATING} .apcf-data-table th:nth-child(4),
      .${FLOATING} .apcf-data-table td:nth-child(4) { width: 18% !important; }
      .${FLOATING} .apcf-link-table th:nth-child(1),
      .${FLOATING} .apcf-link-table td:nth-child(1) {
        width: 1% !important;
        min-width: 2.7rem !important;
        max-width: 3.1rem !important;
        white-space: nowrap !important;
      }
      .${FLOATING} .apcf-link-table th:nth-child(2),
      .${FLOATING} .apcf-link-table td:nth-child(2) { width: 18% !important; }
      .${FLOATING} .apcf-link-table th:nth-child(3),
      .${FLOATING} .apcf-link-table td:nth-child(3) { width: 24% !important; }
      .${FLOATING} .apcf-link-table th:nth-child(4),
      .${FLOATING} .apcf-link-table td:nth-child(4) { width: auto !important; }
      .${FLOATING} .apcf-link-table .apcf-mini-button {
        min-width: 2.1rem !important;
        padding-left: .18rem !important;
        padding-right: .18rem !important;
      }
      .${FLOATING} .apcf-data-table th:nth-child(5),
      .${FLOATING} .apcf-data-table td:nth-child(5) { width: 9rem !important; }
      .${FLOATING} .apcf-data-table th:nth-child(6),
      .${FLOATING} .apcf-data-table td:nth-child(6) { width: 5.8rem !important; }
      .${FLOATING} .apcf-data-table th:nth-child(7),
      .${FLOATING} .apcf-data-table td:nth-child(7) { width: 5.8rem !important; }
      .${FLOATING} .apcf-data-table th:nth-child(8),
      .${FLOATING} .apcf-data-table td:nth-child(8) { width: 5.8rem !important; }

      .${FLOATING} .apcf-data-table tr[data-apcf-severity="error"] td {
        background: rgb(143 29 44 / .22) !important;
        color: #ffdddd !important;
      }

      .${FLOATING} .apcf-data-table tr[data-apcf-severity="warn"] td {
        background: rgb(247 189 61 / .14) !important;
        color: #fff4cf !important;
      }

      .${FLOATING} .apcf-data-table tr[data-apcf-severity="ok"] td {
        background: rgb(125 94 18 / .28) !important;
        color: #fff1c2 !important;
      }

      .${FLOATING} .apcf-contrast-table tr[data-apcf-severity="error"] td {
        background: rgb(143 29 44 / .22) !important;
        color: #ffdddd !important;
      }

      .${FLOATING} .apcf-contrast-table tr[data-apcf-severity="warn"] td {
        background: rgb(247 189 61 / .16) !important;
        color: #fff4cf !important;
      }

      .${FLOATING} .apcf-contrast-table tr[data-apcf-severity="ok"] td {
        background: rgb(79 125 58 / .22) !important;
        color: #f1ffe6 !important;
      }

      .${FLOATING} .apcf-contrast-table tr[data-apcf-severity="review"] td {
        background: rgb(120 120 120 / .18) !important;
        color: #f3f3f3 !important;
      }

      .${FLOATING} .apcf-mini-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        border: 2px solid #ffffff !important;
        border-radius: .4rem !important;
        background: #202020 !important;
        color: #ffffff !important;
        padding: .12rem .2rem !important;
        min-width: 1.8rem !important;
        font-size: .82rem !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        cursor: pointer !important;
        box-sizing: border-box !important;
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

      #${PANEL_ID},
      #${PANEL_ID} * {
        text-transform: none !important;
        letter-spacing: 0 !important;
        text-shadow: none !important;
        filter: none !important;
        animation: none !important;
        transition: none !important;
      }

      #${PANEL_ID} {
        position: fixed !important;
        inset: 0 auto 0 0 !important;
        z-index: 2147483647 !important;
        width: var(${PANEL_WIDTH_VAR}) !important;
        height: 100vh !important;
        display: grid !important;
        grid-template-rows: auto auto auto auto minmax(0, 1fr) auto !important;
        align-content: start !important;
        justify-content: start !important;
        overflow: visible !important;
        background: #f7f7f5 !important;
        color: #171717 !important;
        border: 0 !important;
        border-right: 1px solid #d7d7d2 !important;
        border-radius: 0 !important;
        box-shadow: 16px 0 40px rgb(0 0 0 / .2) !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        font-size: 16px !important;
        line-height: 1.4 !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed {
        overflow: hidden !important;
        background: transparent !important;
        border-right: 0 !important;
        box-shadow: none !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed > :not(.apcf-panel-toggle) {
        display: none !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed {
        width: var(--apcf-panel-width) !important;
        min-width: var(--apcf-panel-width) !important;
        max-width: var(--apcf-panel-width) !important;
        border-right: 0 !important;
        overflow: visible !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed > .apcf-panel-toggle {
        position: absolute !important;
        top: 0 !important;
        right: 0 !important;
        left: auto !important;
        z-index: 2147483647 !important;
        width: 4.55rem !important;
        height: 4.55rem !important;
        margin: 0 !important;
        padding: 0 .42rem 0 .48rem !important;
        border: 2px solid #000000 !important;
        border-right: 0 !important;
        border-radius: 0 1.2rem 1.2rem 0 !important;
        background: #8a1f66 !important;
        color: #ffffff !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        cursor: pointer !important;
        box-shadow: 0 10px 22px rgb(0 0 0 / .24) !important;
        overflow: visible !important;
        box-sizing: border-box !important;
        visibility: visible !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed > .apcf-panel-toggle .apcf-panel-toggle-icon {
        display: block !important;
        width: 1.72rem !important;
        height: 1.72rem !important;
        margin-right: 0 !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed > .apcf-panel-toggle .apcf-panel-toggle-arrow {
        display: block !important;
        font-size: 2.08rem !important;
        line-height: 1 !important;
        font-weight: 900 !important;
        color: #ffffff !important;
        flex: 0 0 auto !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed > .apcf-panel-toggle .apcf-panel-toggle-label {
        display: inline-block !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        position: absolute !important;
        white-space: nowrap !important;
      }

      #${PANEL_ID} .apcf-panel-toggle-icon {
        display: none !important;
        width: 1.2rem !important;
        height: 1.2rem !important;
        object-fit: contain !important;
        filter: none !important;
        pointer-events: none !important;
        flex: 0 0 auto !important;
        background: transparent !important;
      }

      #${PANEL_ID} .apcf-panel-toggle::after {
        content: "" !important;
        display: block !important;
        width: .9rem !important;
        height: .9rem !important;
        border-top: .28rem solid #ffffff !important;
        border-right: .28rem solid #ffffff !important;
        transform: rotate(225deg) !important;
        margin-left: .18rem !important;
      }

      #${PANEL_ID}.apcf-panel-collapsed > .apcf-panel-toggle::after {
        display: none !important;
      }

      #${PANEL_ID} .apcf-header {
        min-height: 4.38rem !important;
        display: grid !important;
        grid-template-rows: auto auto !important;
        padding: .5rem .35rem .12rem !important;
        background: #831451 !important;
        color: #ffffff !important;
        border: 0 !important;
        border-radius: 0 !important;
      }

      #${PANEL_ID} .apcf-window-bar {
        display: flex !important;
        align-items: center !important;
        gap: .35rem !important;
        width: 100% !important;
        justify-items: stretch !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
      }

      #${PANEL_ID} .apcf-window-title {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        justify-self: start !important;
        gap: .35rem !important;
        margin-left: 0 !important;
        margin-top: 0 !important;
        margin-right: 0 !important;
        margin-bottom: 0 !important;
        color: #ffffff !important;
        font-size: 1.31rem !important;
        line-height: .96 !important;
        font-weight: 950 !important;
        text-align: left !important;
        white-space: normal !important;
        transform: translateY(0) !important;
      }

      #${PANEL_ID} .apcf-title-icon {
        display: block !important;
        width: 2rem !important;
        height: 2rem !important;
        max-width: 2rem !important;
        min-width: 2rem !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        object-fit: contain !important;
        filter: none !important;
        opacity: 1 !important;
      }

      #${PANEL_ID} .apcf-release-note {
        display: block !important;
        display: inline-block !important;
        margin: .26rem 0 0 !important;
        padding: .18rem .35rem .18rem !important;
        background: #ffffff !important;
        color: #171717 !important;
        width: fit-content !important;
        max-width: 100% !important;
        font-size: .72rem !important;
        font-weight: 850 !important;
        line-height: 1.15 !important;
        text-align: left !important;
        white-space: nowrap !important;
      }

      #${PANEL_ID} .apcf-release-note a {
        color: #315bdc !important;
        font-weight: 900 !important;
        text-decoration: underline !important;
        text-underline-offset: .12em !important;
      }

      #${PANEL_ID} .apcf-udl-inline-logo {
        display: inline-block !important;
        width: 1rem !important;
        height: 1rem !important;
        object-fit: contain !important;
        vertical-align: text-bottom !important;
        margin: 0 .18rem 0 .08rem !important;
        border: 0 !important;
        background: transparent !important;
      }

      #${PANEL_ID} .apcf-profile-banner {
        display: flex !important;
        align-items: center !important;
        gap: .5rem !important;
        width: 100% !important;
        margin: 0 !important;
        padding: .16rem .95rem .16rem .35rem !important;
        background: #000000 !important;
        color: #ffffff !important;
        font-size: 1.15rem !important;
        font-weight: 950 !important;
      }

      #${PANEL_ID} .apcf-status {
        display: grid !important;
        grid-template-rows: auto auto !important;
        align-content: start !important;
        gap: .06rem !important;
        width: 100% !important;
        min-height: 4.45rem !important;
        padding: .16rem .95rem .12rem .3rem !important;
        margin: 0 !important;
        border: 0 !important;
        border-bottom: 1px solid #dadad7 !important;
        background: #fff9e6 !important;
        color: #312200 !important;
        font-size: 1.05rem !important;
        line-height: 1.04 !important;
        font-weight: 850 !important;
        align-self: start !important;
      }

      #${PANEL_ID} .apcf-list {
        display: block !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        scrollbar-gutter: stable !important;
        min-height: 0 !important;
        align-self: stretch !important;
        margin: 0 !important;
        padding: 0 .45rem .4rem !important;
        background: transparent !important;
      }

      #${PANEL_ID} .apcf-group-title {
        display: block !important;
        margin: 0 .08rem .18rem !important;
        color: #831451 !important;
        font-size: 1.45rem !important;
        line-height: 1.08 !important;
        font-weight: 1000 !important;
        text-transform: uppercase !important;
      }

      #${PANEL_ID} .apcf-check {
        width: 100% !important;
        min-height: 4.6rem !important;
        display: grid !important;
        grid-template-columns: 2.1rem 1fr auto !important;
        gap: .38rem !important;
        align-items: center !important;
        margin: 0 !important;
        border: 2px solid #bdbdb8 !important;
        border-radius: 1.4rem !important;
        background: #fbfbf9 !important;
        color: #171717 !important;
        padding: .58rem .68rem !important;
        text-align: left !important;
        cursor: pointer !important;
        box-shadow: 0 7px 18px rgb(0 0 0 / .09) !important;
      }

      #${PANEL_ID} .apcf-profiles {
        display: grid !important;
        grid-template-columns: repeat(5, 1fr) !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-top: 1px solid #dadad7 !important;
        background: #ffffff !important;
        box-shadow: 0 -10px 24px rgb(0 0 0 / .1) !important;
      }

      #${PANEL_ID} .apcf-profile {
        min-height: 86px !important;
        display: grid !important;
        grid-template-rows: 2.35rem 1fr !important;
        align-items: center !important;
        justify-items: center !important;
        gap: 0 !important;
        margin: 0 !important;
        border: 0 !important;
        border-right: 1px solid #e1e1de !important;
        color: #4d4d4d !important;
        background: transparent !important;
        padding: .38rem .16rem .02rem !important;
        font-size: .84rem !important;
        line-height: 1.05 !important;
        font-weight: 850 !important;
        text-align: center !important;
      }

      #${PANEL_ID} .apcf-profile-icon {
        display: block !important;
        width: 2.2rem !important;
        height: 2.2rem !important;
        max-width: 2.2rem !important;
        max-height: 2.2rem !important;
        min-width: 2.2rem !important;
        min-height: 2.2rem !important;
        object-fit: contain !important;
        margin-top: .26rem !important;
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
    clearPageAnnotations();
    clearFocusView();
    document.querySelectorAll(`.${FLOATING}`).forEach(el => el.remove());
    document.documentElement.classList.remove("apcf-grayscale");
    state.grayscale = false;
  }

  function clearPageAnnotations() {
    document.querySelectorAll(`.${MARK}`).forEach(el => {
      el.classList.remove(MARK);
      el.removeAttribute("data-apcf-severity");
      el.removeAttribute("data-apcf-mark-id");
      el.removeAttribute("data-apcf-mark-kind");
      el.removeAttribute("data-apcf-link-mark");
      el.removeAttribute("data-apcf-wand-order");
    });
    document.querySelectorAll(`.${LABEL}`).forEach(el => el.remove());
  }

  function clearFocusView() {
    document.getElementById(FOCUS_STYLE_ID)?.remove();
    document.getElementById(FOCUS_INFO_ID)?.remove();
    document.querySelectorAll("[data-apcf-focus-style]").forEach(el => {
      const previous = el.getAttribute("data-apcf-focus-style") || "";
      if (previous) el.setAttribute("style", previous);
      else el.removeAttribute("style");
      el.removeAttribute("data-apcf-focus-style");
    });
  }

  function closePanel() {
    clearVisuals();
    state.hiddenPanels.clear();
    state.active.clear();
    state.panelCollapsed = false;
    state.lastCheck = "";
    state.currentPanelId = "";
    state.lastSelectedElement = null;
    document.documentElement.classList.remove(PAGE_SHIFT);
    syncPanelWidth();
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
  }

  function syncGrayscale() {
    document.documentElement.classList.toggle("apcf-grayscale", state.grayscale);
  }

  function mark(el, text, severity = "warn", kind = "") {
    if (!el) return null;
    const id = el.getAttribute("data-apcf-mark-id") || `apcf-${++markId}`;
    el.setAttribute("data-apcf-mark-id", id);
    el.classList.add(MARK);
    el.setAttribute("data-apcf-severity", severity);
    if (kind) el.setAttribute("data-apcf-mark-kind", kind);
    const label = document.createElement("span");
    label.className = LABEL;
    label.dataset.apcfSeverity = severity;
    label.dataset.apcfTarget = id;
    label.textContent = text;
    document.body.appendChild(label);
    positionLabel(label);
    return label;
  }

  function positionLabel(label) {
    const targetId = label.dataset.apcfTarget;
    const target = targetId ? document.querySelector(`[data-apcf-mark-id="${CSS.escape(targetId)}"]`) : null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    label.style.left = `${Math.max(6, rect.left + window.scrollX)}px`;
    if (label.dataset.apcfLinkPlacement === "below" || label.dataset.apcfMediaPlacement === "below") {
      label.style.top = `${rect.bottom + window.scrollY + 8}px`;
    } else {
      label.style.top = `${Math.max(6, rect.top + window.scrollY - 30)}px`;
    }
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

  function clampFloatingPanelPosition(box, left, top) {
    const rect = box.getBoundingClientRect();
    const maxLeft = Math.max(12, window.innerWidth - rect.width - 12);
    const maxTop = Math.max(12, window.innerHeight - rect.height - 12);
    return {
      left: Math.min(Math.max(12, left), maxLeft),
      top: Math.min(Math.max(12, top), maxTop)
    };
  }

  function applyFloatingPanelPosition(box, position, stateKey) {
    if (!position) return;
    const next = clampFloatingPanelPosition(box, position.left, position.top);
    state[stateKey] = next;
    box.style.setProperty("inset", "auto", "important");
    box.style.setProperty("left", `${next.left}px`, "important");
    box.style.setProperty("top", `${next.top}px`, "important");
    box.style.setProperty("right", "auto", "important");
    box.style.setProperty("bottom", "auto", "important");
    box.style.setProperty("transform", "none", "important");
  }

  function enableFloatingDrag(box, head, stateKey, ariaLabel) {
    if (!head) return;
    head.setAttribute("tabindex", "0");
    if (ariaLabel) head.setAttribute("aria-label", ariaLabel);
    let dragState = null;
    const stopDrag = () => {
      dragState = null;
    };
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
      applyFloatingPanelPosition(box, { left: rect.left, top: rect.top }, stateKey);
      try { head.setPointerCapture(event.pointerId); } catch (_error) {}
      event.preventDefault();
    });
    head.addEventListener("pointermove", event => {
      if (!dragState) return;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;
      applyFloatingPanelPosition(box, { left: dragState.left + dx, top: dragState.top + dy }, stateKey);
    });
    head.addEventListener("pointerup", stopDrag);
    head.addEventListener("pointercancel", stopDrag);
    head.addEventListener("keydown", event => {
      const step = event.shiftKey ? 48 : 12;
      const rect = box.getBoundingClientRect();
      let left = rect.left;
      let top = rect.top;
      if (event.key === "ArrowLeft") left -= step;
      else if (event.key === "ArrowRight") left += step;
      else if (event.key === "ArrowUp") top -= step;
      else if (event.key === "ArrowDown") top += step;
      else return;
      event.preventDefault();
      event.stopPropagation();
      applyFloatingPanelPosition(box, { left, top }, stateKey);
    });
  }

  function isLargePanel(id) {
    return new Set(["images", "page-title", "headings", "landmarks", "link-text", "skip-link", "language", "grayscale", "audio", "video", "focus-order", "focus-view", "form-labels", "form-required"]).has(id);
  }

  function renderFloatingSummary(id, title, summary, summaryDetail = "", summaryResult = "", summaryResultMarkup = "") {
    document.querySelectorAll(`.${FLOATING}.apcf-floating-summary`).forEach(el => el.remove());
    const box = document.createElement("aside");
    box.className = `${FLOATING} apcf-floating-summary`;
    const severity = state.panelSummaries.get(id)?.severity || "";
    box.setAttribute("aria-label", `Panel minimizado: ${title}`);
    box.innerHTML = `
      <div class="apcf-floating-head" tabindex="0" aria-label="Mover panel minimizado ${escapeHtml(title)}. Usa las flechas para desplazarlo.">
        <div class="apcf-summary-text">
          <h2>${escapeHtml(summary)}</h2>
          ${summaryDetail ? `<p>${escapeHtml(summaryDetail)}</p>` : ""}
          ${summaryResult ? `<p class="${severity && !summaryResultMarkup ? "apcf-summary-alert" : ""}">${summaryResultMarkup || escapeHtml(summaryResult)}</p>` : ""}
        </div>
        <button class="apcf-floating-control apcf-floating-control-primary" type="button" data-apcf-open-panel>Ver panel</button>
        <button class="apcf-floating-control" type="button" data-apcf-close aria-label="Cerrar ${escapeHtml(title)}">×</button>
      </div>
    `;
    document.body.appendChild(box);
    enableFloatingDrag(box, box.querySelector(".apcf-floating-head"), "summaryFloatingPosition", `Mover panel minimizado ${title}. Usa las flechas para desplazarlo.`);
    if (state.summaryFloatingPosition) {
      requestAnimationFrame(() => applyFloatingPanelPosition(box, state.summaryFloatingPosition, "summaryFloatingPosition"));
    }
    box.querySelector("[data-apcf-open-panel]")?.addEventListener("click", () => {
      state.hiddenPanels.delete(id);
      refreshVisuals();
      render(false);
    });
    box.querySelector("[data-apcf-close]")?.addEventListener("click", () => {
      state.hiddenPanels.delete(id);
      state.active.delete(id);
      if (state.lastCheck === id) state.lastCheck = "";
      refreshVisuals();
      render(false);
    });
    return box;
  }

  function floating(title, html, options = {}) {
    const id = state.currentPanelId;
    const summary = options.summary || "";
    const summaryDetail = options.summaryDetail || "";
    const summaryResult = options.summaryResult || "";
    const summarySeverity = options.summarySeverity || "";
    if (id && summary) {
      state.panelSummaries.set(id, { title, summary, summaryDetail, summaryResult, severity: summarySeverity });
    }
    if (id && state.hiddenPanels.has(id) && !summary) state.hiddenPanels.delete(id);
    if (id && summary && state.hiddenPanels.has(id)) {
      return renderFloatingSummary(id, title, summary, summaryDetail, summaryResult);
    }

    const box = document.createElement("aside");
    box.className = FLOATING;
    box.setAttribute("aria-label", title);
    box.innerHTML = `
      <div class="apcf-floating-head" tabindex="0" aria-label="Mover panel ${escapeHtml(title)}. Usa las flechas para desplazarlo.">
        <h2>${escapeHtml(title)}</h2>
        ${id && isLargePanel(id) ? `<button class="apcf-floating-control apcf-floating-control-primary" type="button" data-apcf-minimize>Minimizar</button>` : ""}
        <button class="apcf-floating-control" type="button" data-apcf-close aria-label="Cerrar panel">×</button>
      </div>
      <div class="apcf-floating-body">${html}</div>
    `;
    document.body.appendChild(box);
    if (!summary) {
      clearPageAnnotations();
    }
    const head = box.querySelector(".apcf-floating-head");
    if (state.floatingPosition) {
      requestAnimationFrame(() => applyFloatingPanelPosition(box, state.floatingPosition, "floatingPosition"));
    }
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
      refreshVisuals();
      render(false);
    };
    enableFloatingDrag(box, head, "floatingPosition", `Mover panel ${title}. Usa las flechas para desplazarlo.`);
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
      finishPanel({ hideOnly: false });
    });
    box.querySelector("[data-apcf-minimize]")?.addEventListener("click", () => {
      finishPanel({ hideOnly: true });
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
    return `<p class="apcf-problem"><span aria-hidden="true">⚠</span><span>${escapeHtml(message)}</span></p>`;
  }

  function keepActiveWhenClosed(id) {
    return new Set(["images", "headings", "landmarks", "link-text", "skip-link", "audio", "video", "focus-order", "focus-view", "grayscale"]).has(id);
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

  function labelElementForField(field) {
    const id = field.getAttribute("id");
    if (id) {
      const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (explicit) return explicit;
    }
    return field.closest("label");
  }

  function formLabelStatus(field) {
    const id = field.getAttribute("id") || "";
    const explicit = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    const wrapped = field.closest("label");
    const labelledBy = (field.getAttribute("aria-labelledby") || "").trim();
    const labelledByIds = labelledBy ? labelledBy.split(/\s+/).filter(Boolean) : [];
    const ariaLabel = (field.getAttribute("aria-label") || "").trim();
    const name = accessibleName(field).trim();
    const labelText = labelForField(field).trim();
    const source = explicit
      ? `label[for="${id}"]`
      : wrapped
        ? "label envolvente"
        : labelledBy
          ? `aria-labelledby: ${labelledByIds.join(" ")}`
          : ariaLabel
            ? `aria-label: ${ariaLabel}`
            : "";
    const hasLabel = !!(explicit || wrapped || labelledBy || ariaLabel);
    const hasName = !!name;
    const title = hasName
      ? (labelText ? `Etiqueta: ${labelText}` : `Nombre accesible: ${name}`)
      : (id
          ? `Sin etiqueta (no se encontró label para el ID='${id}')`
          : "Sin etiqueta");
    const detail = [
      explicit ? `Etiqueta asociada: ${labelText || "sin texto"}` : "",
      wrapped ? `Etiqueta envolvente: ${labelText || "sin texto"}` : "",
      labelledBy ? `Etiqueta por aria-labelledby: ${labelledByIds.join(" ")}` : "",
      ariaLabel ? `Etiqueta ARIA: ${ariaLabel}` : "",
      source ? `Origen: ${source}` : "",
      hasName ? `Nombre accesible: ${name}` : "Sin nombre accesible"
    ].filter(Boolean).join(" · ");
    return { hasLabel, hasName, title, detail, labelText, name, explicit, wrapped, labelledByIds, ariaLabel };
  }

  function revealElement(el, label, severity = "warn", options = {}) {
    if (!el) return;
    state.lastSelectedElement = el;
    clearPageAnnotations();
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
    const detail = options.detail ? `\n${options.detail}` : "";
    const revealLabel = mark(el, `${label}${detail}`, severity);
    if (revealLabel && options.noLabel) revealLabel.dataset.apcfSubtle = "true";
    if (cleanup) window.setTimeout(cleanup, 1500);
  }

  function focusablePageElements() {
    return pageElements("a[href],button,select,input:not([type='hidden']),textarea,summary,details,area,[tabindex],[contenteditable]:not([contenteditable='false'])")
      .filter(el => {
        const tabindex = el.getAttribute("tabindex");
        return tabindex !== "-1";
      });
  }

  function applyFocusView() {
    clearFocusView();
    const style = document.createElement("style");
    style.id = FOCUS_STYLE_ID;
    style.textContent = `
      #${FOCUS_INFO_ID} {
        z-index: 2147483646;
        color: black;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        border: solid 1px #ddd;
        background-color: #fff;
        box-shadow: 0 4px 8px 0 rgb(0 0 0 / .2), 0 6px 20px 0 rgb(0 0 0 / .19);
      }
      #${FOCUS_INFO_ID} header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        font-weight: 700;
        background-color: #f2f2f2;
        color: #005a6a;
        padding: 8px 16px;
      }
      #${FOCUS_INFO_ID} div { padding: 8px 16px; }
      #${FOCUS_INFO_ID} button {
        border: 2px solid #005a6a;
        background: #ffffff;
        color: #005a6a;
        border-radius: .25rem;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }
      #${FOCUS_INFO_ID} button:focus-visible {
        outline: 3px solid #0b66d8;
        outline-offset: 2px;
      }
      .wai-more-info {
        position: fixed;
        bottom: 5em;
        right: 5em;
      }
    `;
    document.head.appendChild(style);

    const elements = focusablePageElements()
      .filter(el => !el.closest(`#${FOCUS_INFO_ID}, .${FLOATING}`));
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    elements.forEach(el => {
      el.setAttribute("data-apcf-focus-style", el.getAttribute("style") || "");
      el.style.transition = "none";
      try { el.focus({ preventScroll: true }); } catch (_error) { try { el.focus(); } catch (_ignored) {} }
      const computed = getComputedStyle(el);
      let inlineStyle = "";
      for (let index = 0; index < computed.length; index += 1) {
        const property = computed[index];
        inlineStyle += `${property}:${computed.getPropertyValue(property)};`;
      }
      const outlineVisible = computed.outlineStyle !== "none" && computed.outlineWidth !== "0px";
      const boxShadowVisible = computed.boxShadow && computed.boxShadow !== "none";
      if (!outlineVisible && !boxShadowVisible) {
        inlineStyle += "outline:4px solid #0b66d8;outline-offset:3px;box-shadow:0 0 0 7px rgb(11 102 216 / .22);";
      }
      el.setAttribute("style", inlineStyle);
    });
    if (previousActive && document.contains(previousActive)) {
      try { previousActive.focus({ preventScroll: true }); } catch (_error) { try { previousActive.focus(); } catch (_ignored) {} }
    }
    return elements.length;
  }

  function hideCurrentFloatingPanel() {
    if (!state.currentPanelId) return;
    const id = state.currentPanelId;
    const panel = document.querySelector(`.${FLOATING}`);
    const target = state.lastSelectedElement && document.contains(state.lastSelectedElement) ? state.lastSelectedElement : null;
    if (panel) panel.remove();
    state.hiddenPanels.add(id);
    const summary = state.panelSummaries.get(id);
    if (summary) {
      renderFloatingSummary(id, summary.title, summary.summary, summary.summaryDetail, summary.summaryResult);
    }
    render(false);
    if (target) {
      window.setTimeout(() => {
        if (!document.contains(target)) return;
        try { target.focus({ preventScroll: true }); } catch (_error) { try { target.focus(); } catch (_ignored) {} }
      }, 0);
    }
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

  function requiredVisualText(field) {
    const pieces = [];
    const label = labelForField(field);
    if (label) pieces.push(label);
    const labelEl = field.getAttribute("id")
      ? document.querySelector(`label[for="${CSS.escape(field.getAttribute("id"))}"]`)
      : field.closest("label");
    if (labelEl) {
      pieces.push(textValue(labelEl.parentElement || labelEl));
      const requiredSpan = labelEl.querySelector(".required-span, [class*='required']");
      if (requiredSpan) pieces.push(textValue(requiredSpan));
    }
    const parent = field.parentElement;
    if (parent) {
      pieces.push(textValue(parent));
      const nearby = [...parent.querySelectorAll("span, small, em, strong, b")].map(textValue);
      pieces.push(...nearby);
    }
    const prev = field.previousElementSibling;
    const next = field.nextElementSibling;
    if (prev) pieces.push(textValue(prev));
    if (next) pieces.push(textValue(next));
    return pieces.join(" ").replace(/\s+/g, " ").trim();
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

  function landmarkTree(landmarks) {
    const nodes = landmarks.map((el, index) => ({
      el,
      index,
      children: []
    }));
    const roots = [];
    const byElement = new Map(nodes.map(node => [node.el, node]));
    nodes.forEach(node => {
      let parentEl = node.el.parentElement;
      let parentNode = null;
      while (parentEl && parentEl !== document.body) {
        if (byElement.has(parentEl)) {
          parentNode = byElement.get(parentEl);
          break;
        }
        parentEl = parentEl.parentElement;
      }
      if (parentNode) parentNode.children.push(node);
      else roots.push(node);
    });
    return roots;
  }

  function renderLandmarkNode(node, landmarks) {
    const el = node.el;
    const role = landmarkRole(el);
    const label = labelledByText(el) || el.getAttribute("aria-label") || "";
    const title = visibleLandmarkTitle(el);
    const depth = Math.max(0, Math.min(5, landmarkDepth(el)));
    const button = `<button class="apcf-landmark-box" type="button" data-apcf-landmark="${node.index}" style="--apcf-indent:${Math.min(70, depth * 20)}px"><span class="apcf-landmark-type">${escapeHtml(roleLabel(role))}</span><span class="apcf-landmark-label">${escapeHtml(label ? `Etiqueta: ${label.slice(0, 70)}` : "Sin etiqueta")}</span>${title ? `<span class="apcf-landmark-label">${escapeHtml(title.slice(0, 70))}</span>` : ""}</button>`;
    if (!node.children.length) return button;
    return `
      <div class="apcf-landmark-node" style="--apcf-indent:${Math.min(70, depth * 20)}px">
        ${button}
        <div class="apcf-landmark-children">
          ${node.children.map(child => renderLandmarkNode(child, landmarks)).join("")}
        </div>
      </div>
    `;
  }

  function parseColor(value) {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === "transparent") return [0, 0, 0, 0];
    if (normalized.startsWith("#")) {
      const hex = normalized.slice(1);
      if (hex.length === 3) {
        return [
          Number.parseInt(hex[0] + hex[0], 16),
          Number.parseInt(hex[1] + hex[1], 16),
          Number.parseInt(hex[2] + hex[2], 16),
          1
        ];
      }
      if (hex.length === 6) {
        return [
          Number.parseInt(hex.slice(0, 2), 16),
          Number.parseInt(hex.slice(2, 4), 16),
          Number.parseInt(hex.slice(4, 6), 16),
          1
        ];
      }
      return null;
    }
    const rgb = normalized.match(/^rgba?\((.+)\)$/);
    if (!rgb) return null;
    const body = rgb[1].trim();
    if (body.includes(",")) {
      const parts = body.split(",").map(part => Number.parseFloat(part.trim()));
      if (parts.length >= 3) {
        return [parts[0], parts[1], parts[2], parts.length >= 4 ? parts[3] : 1];
      }
      return null;
    }
    const pieces = body.split(/\s+/).filter(Boolean);
    if (pieces.length >= 3) {
      const [r, g, b] = pieces.slice(0, 3).map(part => Number.parseFloat(part));
      const alphaToken = pieces.slice(3).join(" ");
      let alpha = 1;
      if (alphaToken) {
        const cleaned = alphaToken.replace("/", "").trim();
        alpha = Number.parseFloat(cleaned);
        if (!Number.isFinite(alpha)) alpha = 1;
      }
      return [r, g, b, alpha];
    }
    return null;
  }

  function blendColors(top, bottom) {
    const alpha = Math.max(0, Math.min(1, top[3] ?? 1));
    const inv = 1 - alpha;
    return [
      Math.round((top[0] * alpha) + (bottom[0] * inv)),
      Math.round((top[1] * alpha) + (bottom[1] * inv)),
      Math.round((top[2] * alpha) + (bottom[2] * inv)),
      1
    ];
  }

  function rgbaToCss(rgba) {
    return `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`;
  }

  function effectiveBgInfo(el) {
    let node = el;
    let effective = [255, 255, 255, 1];
    let approximate = false;
    while (node && node.nodeType === 1) {
      const style = getComputedStyle(node);
      const bg = parseColor(style.backgroundColor);
      if (style.backgroundImage && style.backgroundImage !== "none") approximate = true;
      if (bg) {
        if (bg[3] === 0) {
          node = node.parentElement;
          continue;
        }
        effective = blendColors(bg, effective);
        if (bg[3] >= 1) break;
      }
      node = node.parentElement;
    }
    return { color: rgbaToCss(effective), approximate };
  }

  function nearestBg(el) {
    return effectiveBgInfo(el).color;
  }

  function parseRgb(value) {
    const parsed = parseColor(value);
    if (!parsed) return null;
    return parsed.slice(0, 3);
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
    const className = typeof el.className === "string" ? el.className : (el.getAttribute("class") || "");
    return [
      el.tagName,
      el.id,
      className,
      el.getAttribute("href"),
      el.getAttribute("src"),
      el.getAttribute("title"),
      el.getAttribute("aria-label"),
      el.getAttribute("role"),
      el.getAttribute("poster"),
      el.getAttribute("playsinline"),
      el.getAttribute("data-src"),
      el.getAttribute("data-video"),
      el.getAttribute("data-url"),
      el.getAttribute("data-player"),
      el.getAttribute("data-testid")
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function isMediaPlayer(el, type) {
    const tag = el.tagName.toLowerCase();
    if (type === "audio") return tag === "audio";
    return tag === "video";
  }

  function mediaMarkTarget(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
    return el.closest("figure,section,article,div") || el.parentElement || el;
  }

  function mediaPlayers(type) {
    const selector = type === "audio" ? "audio" : "video";
    return visibleElements(selector).filter(el => isMediaPlayer(el, type));
  }

  function htmlSourceText() {
    return document.documentElement.outerHTML || "";
  }

  function sourceLineNumber(html, index) {
    if (index < 0) return "";
    return html.slice(0, index).split("\n").length;
  }

  function sourceFragment(html, index, length = 180) {
    if (index < 0) return "";
    const start = Math.max(0, index - 70);
    const end = Math.min(html.length, index + Math.max(length, 120));
    return html.slice(start, end).replace(/\s+/g, " ").trim();
  }

  function videoFileLink(href) {
    return /\.(mp4|webm|ogg|m3u8|mpd)(?:[?#]|$)/i.test(href || "");
  }

  function iframeHasMedia(iframe, selector) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      return !!doc && !!doc.querySelector(selector);
    } catch (_err) {
      return false;
    }
  }

  function currentHtmlFileName() {
    const segments = location.pathname.split("/").filter(Boolean);
    return segments.length ? segments[segments.length - 1] : "HTML de la página";
  }

  function sourceInfoForElement(el, html) {
    const raw = el?.outerHTML || "";
    const index = raw ? html.indexOf(raw) : -1;
    return {
      line: sourceLineNumber(html, index),
      fragment: sourceFragment(html, index, Math.min(raw.length + 60, 240))
    };
  }

  function videoIssueText(item) {
    switch (item.kind) {
      case "video": {
        const parts = [
          item.hasControls ? "Vídeo nativo con controls." : "Vídeo nativo sin controls visibles.",
          item.hasAutoplay ? "autoplay detectado." : "",
          item.hasMuted ? "muted detectado." : "",
          item.hasPlaysinline ? "playsinline detectado." : "",
          item.hasCaptions ? "Pista de subtítulos o captions detectada." : "Comprueba subtítulos o transcripción.",
          item.src ? `src=${item.src}` : "",
          item.poster ? `poster=${item.poster}` : ""
        ].filter(Boolean);
        return parts.join(" ");
      }
      case "source":
        return "Elemento <source> dentro de <video>. Comprueba que el vídeo conserve controles y subtítulos.";
      case "track":
        return item.trackKind === "captions" || item.trackKind === "subtitles"
          ? "Pista de subtítulos o captions detectada."
          : `Pista <track> tipo ${item.trackKind || "desconocido"}. Comprueba que exista una pista de subtítulos o captions.`;
      case "poster":
        return "Atributo poster detectado. No sustituye subtítulos ni transcripción.";
      case "iframe":
        return "Vídeo incrustado en iframe. Comprueba título accesible, controles y subtítulos del reproductor.";
      case "embed":
        return "Vídeo incrustado con embed. Comprueba título accesible, controles y alternativa textual.";
      case "object":
        return "Vídeo incrustado con object. Comprueba alternativa accesible, título y controles.";
      case "link":
        return "Enlace a archivo de vídeo. Comprueba que informe del formato y que el contenido tenga alternativa textual.";
      case "schema":
        return `VideoObject detectado${item.name ? `: ${item.name}` : ""}${item.contentUrl ? ` · contentUrl=${item.contentUrl}` : ""}${item.embedUrl ? ` · embedUrl=${item.embedUrl}` : ""}`;
      case "clue":
        return `Possible video clue${item.cluePhrase ? `: ${item.cluePhrase}` : ""}. Trata esta coincidencia como pista textual de prioridad baja.`;
      default:
        return "Posible vídeo detectado. Comprueba controles, subtítulos y alternativa textual.";
    }
  }

  function rawVideoTagCandidates(html) {
    const rows = [];
    const seen = new Set();
    const pushRow = item => {
      const key = `${item.kind}|${item.line}|${item.fragment}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(item);
    };
    const scan = (regex) => {
      let match;
      while ((match = regex.exec(html))) {
        const index = match.index;
        const endTag = html.indexOf('>', index);
        const end = endTag === -1 ? Math.min(html.length, index + 220) : Math.min(html.length, endTag + 1);
        const fragment = html.slice(index, end).replace(/\s+/g, ' ').trim();
        const tagName = match[1].toLowerCase();
        const snippet = fragment || `<${tagName}`;
        pushRow({
          kind: 'video',
          file: currentHtmlFileName(),
          line: sourceLineNumber(html, index),
          fragment: sourceFragment(html, index, Math.min(snippet.length + 60, 240)) || snippet,
          insertion: `Etiqueta <${tagName}> detectada en el HTML fuente bruto`,
          target: null,
          element: null,
          href: '',
          src: '',
          poster: '',
          hasControls: /\bcontrols\b/i.test(fragment),
          hasCaptions: /<track\b[^>]*\bkind\s*=\s*["']?(captions|subtitles)["']?/i.test(html.slice(index, Math.min(html.length, index + 1200))),
          trackKind: '',
          severity: /\bcontrols\b/i.test(fragment) ? 'warn' : 'error',
          problems: `Etiqueta <${tagName}> detectada en el HTML fuente bruto. Comprueba controles, subtítulos y transcripción.`,
          label: 'Vídeo detectado en HTML bruto',
          rawFallback: true
        });
      }
    };
    scan(/<(video)\b/gi);
    scan(/<(video-cover)\b/gi);
    return rows;
  }

  function rawAudioTagCandidates(html) {
    const rows = [];
    const seen = new Set();
    const pushRow = item => {
      const key = `${item.kind}|${item.line}|${item.fragment}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(item);
    };
    const regex = /<audio\b/gi;
    let match;
    while ((match = regex.exec(html))) {
      const index = match.index;
      const endTag = html.indexOf('>', index);
      const end = endTag === -1 ? Math.min(html.length, index + 220) : Math.min(html.length, endTag + 1);
      const fragment = html.slice(index, end).replace(/\s+/g, ' ').trim();
      const snippet = fragment || '<audio';
      pushRow({
        kind: 'audio',
        file: currentHtmlFileName(),
        line: sourceLineNumber(html, index),
        fragment: sourceFragment(html, index, Math.min(snippet.length + 60, 240)) || snippet,
        insertion: 'Etiqueta <audio> detectada en el HTML fuente bruto',
        target: null,
        element: null,
        src: '',
        type: '',
        provider: '',
        hasControls: /\bcontrols\b/i.test(fragment),
        hasAutoplay: /\bautoplay\b/i.test(fragment),
        hasMuted: /\bmuted\b/i.test(fragment),
        hasLoop: /\bloop\b/i.test(fragment),
        hasPreload: /\bpreload\b/i.test(fragment),
        preload: '',
        hasCrossorigin: /\bcrossorigin\b/i.test(fragment),
        crossorigin: '',
        hasLabel: false,
        severity: /\bcontrols\b/i.test(fragment) ? 'warn' : 'error',
        problems: 'Etiqueta <audio> detectada en el HTML fuente bruto. Comprueba controles, formato y alternativa textual.',
        label: 'Audio detectado en HTML bruto',
        rawFallback: true
      });
    }
    return rows;
  }

  function videoCandidates() {
    const html = htmlSourceText();
    const file = currentHtmlFileName();
    const rows = [];
    const seen = new Set();
    const pushRow = item => {
      const key = `${item.kind}|${item.line}|${item.fragment}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(item);
    };
    const addRow = (el, kind, insertion, extra = {}) => {
      const info = sourceInfoForElement(el, html);
      const raw = el.outerHTML || '';
      const fragment = extra.fragment || sourceFragment(html, html.indexOf(raw), Math.min(raw.length + 80, 260)) || raw.replace(/\s+/g, ' ').trim();
      const item = {
        kind,
        file,
        line: info.line,
        fragment,
        insertion,
        element: el,
        target: el,
        href: el.getAttribute ? el.getAttribute('href') : '',
        src: el.getAttribute ? el.getAttribute('src') : '',
        poster: el.getAttribute ? el.getAttribute('poster') : '',
        hasControls: kind === 'video' ? el.hasAttribute('controls') : false,
        hasAutoplay: kind === 'video' ? el.hasAttribute('autoplay') : false,
        hasMuted: kind === 'video' ? el.hasAttribute('muted') : false,
        hasPlaysinline: kind === 'video' ? el.hasAttribute('playsinline') : false,
        hasCaptions: kind === 'video' ? !!el.querySelector("track[kind='captions'],track[kind='subtitles']") : false,
        trackKind: extra.trackKind || '',
        severity: extra.severity || 'warn'
      };
      item.problems = extra.problems || videoIssueText(item);
      item.label = extra.label || `${kind} localizado`;
      pushRow(item);
    };

    pageElements('video,video-cover').forEach(video => {
      addRow(video, 'video', '<video>', {
        severity: video.hasAttribute('controls') && video.querySelector("track[kind='captions'],track[kind='subtitles']") ? 'warn' : 'error'
      });
      if (video.hasAttribute('poster')) {
        const poster = video.getAttribute('poster');
        addRow(video, 'poster', 'Atributo poster en <video>', {
          fragment: `poster="${poster}"`,
          severity: 'warn',
          problems: `Poster: ${poster}. No sustituye subtítulos ni transcripción.`,
          label: 'Poster detectado'
        });
      }
      video.querySelectorAll('source').forEach(source => {
        addRow(source, 'source', 'Hijo <source> de <video>', {
          severity: 'warn'
        });
      });
      video.querySelectorAll('track').forEach(track => {
        addRow(track, 'track', 'Hijo <track> de <video>', {
          severity: track.getAttribute('kind') === 'captions' || track.getAttribute('kind') === 'subtitles' ? 'ok' : 'warn',
          trackKind: track.getAttribute('kind') || '',
          problems: videoIssueText({ kind: 'track', trackKind: track.getAttribute('kind') || '' })
        });
      });
    });

    if (!rows.some(item => item.kind === 'video') && /<(video|video-cover)\b/i.test(html)) {
      rawVideoTagCandidates(html).forEach(pushRow);
    }

    pageElements('iframe,embed,object').forEach(el => {
      if (el.closest(`#${PANEL_ID}`)) return;
      const tag = el.tagName.toLowerCase();
      if (tag === 'iframe') {
        if (!iframeHasMedia(el, 'video')) return;
        addRow(el, 'iframe', 'iframe con vídeo', { severity: 'warn', problems: 'Vídeo incrustado en iframe. Comprueba título accesible, controles y subtítulos del reproductor.' });
        return;
      }
      const attrText = mediaAttrText(el);
      if (!videoFileLink(attrText) && !/^video\//i.test(attrText) && !/<video\b/i.test(attrText)) return;
      addRow(el, tag === 'embed' ? 'embed' : 'object', `Contenedor <${tag}> con vídeo`, {
        severity: 'warn',
        problems: tag === 'embed'
          ? 'Vídeo incrustado con embed. Comprueba título accesible, controles y alternativa textual.'
          : 'Vídeo incrustado con object. Comprueba alternativa accesible, título y controles.'
      });
    });

    return rows;
  }

  function isVideoLike(el, html = htmlSourceText()) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.closest(`#${PANEL_ID}`)) return false;
    const tag = el.tagName.toLowerCase();
    const raw = el.outerHTML || "";
    if (tag === "video") return true;
    if (tag === "iframe" && iframeHasMedia(el, "video")) return true;
    if (/\.(mp4|webm|ogv|m3u8|mpd)(?:[?#]|$)/i.test(mediaAttrText(el))) return true;
    if (/videoobject/i.test(mediaAttrText(el))) return true;
    if (/<(video|video-cover)\b/i.test(raw)) return true;
    if (html && /<(video|video-cover)\b/i.test(html) && html.indexOf(raw) >= 0) return true;
    return false;
  }

  function isAlreadyMarkedAsVideo(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    return !!el.closest('[data-video-detected], [data-detected-type="video"], [data-media-type="video"], .video-detected, .detected-video');
  }


  function audioAttrText(el) {
    const className = typeof el.className === "string" ? el.className : (el.getAttribute("class") || "");
    return [
      el.tagName,
      el.id,
      className,
      el.getAttribute("src"),
      el.getAttribute("href"),
      el.getAttribute("type"),
      el.getAttribute("controls"),
      el.getAttribute("autoplay"),
      el.getAttribute("muted"),
      el.getAttribute("loop"),
      el.getAttribute("preload"),
      el.getAttribute("crossorigin"),
      el.getAttribute("aria-label"),
      el.getAttribute("aria-labelledby"),
      el.getAttribute("title"),
      el.getAttribute("data-player"),
      textValue(el)
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function audioIssueText(item) {
    switch (item.kind) {
      case "audio":
        return [
          item.hasControls ? "Etiqueta <audio> con controls." : "Etiqueta <audio> sin controls visibles.",
          item.hasAutoplay ? "autoplay detectado." : "",
          item.hasMuted ? "muted detectado." : "",
          item.hasLoop ? "loop detectado." : "",
          item.hasPreload ? `preload="${item.preload}" detectado.` : "",
          item.hasCrossorigin ? `crossorigin="${item.crossorigin}" detectado.` : "",
          item.hasLabel ? "Nombre accesible detectado." : "Sin aria-label, aria-labelledby ni title accesible."
        ].filter(Boolean).join(" ");
      case "source":
        return `Fuente de audio <source> detectada. src=${item.src || "sin src"}. type=${item.type || "sin type"}.`;
      case "iframe":
        return `Audio incrustado en iframe. Comprueba ${item.provider || "reproductor externo"}, título accesible, controles y transcripción.`;
      case "embed":
        return "Audio incrustado con <embed>. Comprueba alternativas accesibles y controles de teclado.";
      case "object":
        return "Audio incrustado con <object>. Comprueba alternativa textual, título y controles accesibles.";
      case "link":
        return "Enlace directo a audio. Comprueba texto descriptivo, formato de archivo y alternativa textual.";
      case "button":
        return "Control personalizado de audio detectado. Comprueba teclado, nombre accesible y estado play/pause/mute/volume.";
      case "accessibility":
        return "Pista de accesibilidad detectada: transcripción, transcript o descripción.";
      default:
        return "Posible audio detectado. Comprueba controles, formato, incrustación y alternativa textual.";
    }
  }

  function audioCandidates() {
    const html = htmlSourceText();
    const file = currentHtmlFileName();
    const rows = [];
    const seen = new Set();
    const pushRow = item => {
      const key = `${item.kind}|${item.line}|${item.fragment}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(item);
    };
    const addRow = (el, kind, insertion, extra = {}) => {
      if (isVideoLike(el, html) || isAlreadyMarkedAsVideo(el)) return;
      const raw = el.outerHTML || '';
      const info = sourceInfoForElement(el, html);
      const fragment = extra.fragment || sourceFragment(html, html.indexOf(raw), Math.min(raw.length + 80, 260)) || raw.replace(/\s+/g, ' ').trim();
      const item = {
        kind,
        file,
        line: info.line,
        fragment,
        insertion,
        element: el,
        target: el,
        src: el.getAttribute ? el.getAttribute('src') : '',
        type: el.getAttribute ? el.getAttribute('type') : '',
        provider: extra.provider || '',
        hasControls: el.hasAttribute ? el.hasAttribute('controls') : false,
        hasAutoplay: el.hasAttribute ? el.hasAttribute('autoplay') : false,
        hasMuted: el.hasAttribute ? el.hasAttribute('muted') : false,
        hasLoop: el.hasAttribute ? el.hasAttribute('loop') : false,
        hasPreload: el.hasAttribute ? el.hasAttribute('preload') : false,
        preload: el.getAttribute ? (el.getAttribute('preload') || '') : '',
        hasCrossorigin: el.hasAttribute ? el.hasAttribute('crossorigin') : false,
        crossorigin: el.getAttribute ? (el.getAttribute('crossorigin') || '') : '',
        hasLabel: !!(el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title'))),
        severity: extra.severity || 'warn'
      };
      item.problems = extra.problems || audioIssueText(item);
      pushRow(item);
    };

    all('audio').forEach(audio => {
      if (isVideoLike(audio, html) || isAlreadyMarkedAsVideo(audio)) return;
      addRow(audio, 'audio', '<audio>', {
        severity: audio.hasAttribute('controls') ? 'warn' : 'error'
      });
      audio.querySelectorAll('source').forEach(source => {
        const src = source.getAttribute('src') || '';
        const type = source.getAttribute('type') || '';
        const invalidType = type && !/^audio\//i.test(type);
        if (invalidType || src) {
          addRow(source, 'source', 'Hijo <source> de <audio>', {
            severity: invalidType || !src ? 'error' : 'warn',
            problems: audioIssueText({ kind: 'source', src, type }),
            fragment: source.outerHTML.replace(/\s+/g, ' ').trim()
          });
        }
      });
    });

    if (!rows.some(item => item.kind === 'audio') && /<audio\b/i.test(html)) {
      rawAudioTagCandidates(html).forEach(pushRow);
    }

    return rows;
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
        state.imagesVisible = true;
        let issues = 0;
        let missingAlt = 0;
        const rows = imgs.map((img, index) => {
          const alt = img.getAttribute("alt");
          if (alt === null) {
            issues += 1;
            missingAlt += 1;
            if (state.imagesVisible) mark(img, "Sin atributo alt", "error", "media");
            return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}" data-apcf-severity="error"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>${index + 1}</strong><span>Sin atributo alt</span><span>La imagen no tiene atributo alt.</span></button>`;
          }
          if (alt.trim() === "") {
            if (state.imagesVisible) mark(img, "Alt vacío: decorativa", "warn", "media");
            return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}" data-apcf-severity="warn"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>${index + 1}</strong><span>Alt vacío</span><span>Comprobar si es una imagen decorativa.</span></button>`;
          }
          if (state.imagesVisible) mark(img, `alt: ${alt.slice(0, 80)}`, "ok", "media");
          return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}" data-apcf-severity="ok"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>${index + 1}</strong><span>${escapeHtml(alt.slice(0, 140))}</span><span>Observar si el texto alternativo corresponde a la imagen que se muestra.</span></button>`;
        });
        const box = floating("Texto alternativo de imágenes", `
          <p class="apcf-explain">Revisa el texto alternativo de cada imagen para comprobar que se ajusta a la información a transmitir.</p>
          <p class="apcf-result">${escapeHtml(`${imgs.length} imagen(es) visibles.`)}</p>
          ${rows.length ? listHead("apcf-list-head--image", ["Ver", "Id", "Texto alternativo", "Observación"]) : ""}
          <div class="apcf-media-list">${rows.length ? rows.join("") : "<p>No hay imagenes visibles.</p>"}</div>
        `, { summary: "Texto alternativo de imágenes", summaryDetail: "Revisa el texto alternativo de cada imagen para comprobar que se ajusta a la información a transmitir.", summaryResult: `${imgs.length} imagen(es) visibles. ${missingAlt} sin atributo alt.`, summaryResultMarkup: missingAlt ? `${escapeHtml(`${imgs.length} imagen(es) visibles.`)}<span class="apcf-summary-alert-inline apcf-summary-alert-block">${escapeHtml(`${missingAlt} sin atributo alt.`)}</span>` : "" });
        box.querySelectorAll("[data-apcf-show-image]").forEach(button => {
          button.addEventListener("click", () => {
            const img = imgs[Number(button.dataset.apcfShowImage)];
            if (!img) return;
            const alt = img.getAttribute("alt");
            if (alt !== null && alt.trim() === "") {
              revealElement(img, "Alt vacío", "warn", { detail: "Comprobar si es una imagen decorativa.", noLabel: true });
            } else {
              revealElement(img, alt ? `Imagen: ${alt.slice(0, 80)}` : "Imagen sin atributo alt", alt && alt.trim() ? "warn" : "error", { detail: alt ? `Texto alternativo: ${alt.slice(0, 160)}\nObservar si el texto alternativo corresponde a la imagen que se muestra.` : "La imagen no tiene atributo alt.", noLabel: true });
            }
            hideCurrentFloatingPanel();
          });
        });
        box.querySelector("[data-apcf-show-images-page]")?.addEventListener("change", event => {
          state.imagesVisible = event.currentTarget.checked;
          refreshVisuals();
        });
        result(check, issues);
        break;
      }

      case "page-title": {
        const title = document.title.trim();
        const issue = !title || /^(home|inicio|untitled|document)$/i.test(title);
        const pageTitleExplain = "Comprueba que el título de la página se ajusta a la información que se muestra en ella.";
        const pageTitleResult = issue ? "Problema: no se encontró este elemento." : `Título: ${title}`;
        floating("Título de la página", issue
          ? problemResult("Problema: no se encontró este elemento.")
          : explainResult(
              pageTitleExplain,
              `<strong>Título:</strong> ${escapeHtml(title)}`
            ), { summary: "Título de la página", summaryDetail: pageTitleExplain, summaryResult: pageTitleResult });
        result(check, issue ? 1 : 0);
        break;
      }

      case "headings": {
        const headings = visibleElements("h1,h2,h3,h4,h5,h6");
        let issues = 0;
        let previous = 0;
        let h1Count = 0;
        let hierarchySkips = 0;
        const items = headings.map((heading, index) => {
          const level = Number(heading.tagName.slice(1));
          const skipped = previous && level > previous + 1;
          previous = level;
          if (level === 1) h1Count += 1;
          if (skipped) {
            hierarchySkips += 1;
            issues += 1;
          }
          if (state.headingsVisible) mark(heading, `H${level}`, skipped ? "error" : "warn");
          const indent = Math.max(0, level - 1) * 30;
          return `<li class="${skipped ? "apcf-tree-error" : ""}" style="--apcf-indent:${indent}px"><button class="apcf-tree-button" type="button" data-apcf-scroll-heading="${index}"><span class="apcf-heading-level">H${level}</span><span class="apcf-heading-text">${escapeHtml(textValue(heading).slice(0, 90) || "Sin texto")}${skipped ? " · salto de nivel" : ""}</span></button></li>`;
        }).join("");
        const h1Problem = h1Count !== 1;
        if (h1Problem) issues += 1;
        const hierarchyProblem = hierarchySkips > 0;
        const headingsStatus = headings.length
          ? [
              h1Problem ? `<p class="apcf-problem"><span aria-hidden="true">⚠</span><span>Error: se detectaron ${h1Count} encabezado(s) H1. Debe haber un H1 principal.</span></p>` : "",
              hierarchyProblem ? `<p class="apcf-problem"><span aria-hidden="true">⚠</span><span>Error: la jerarquía de encabezados no sigue el orden. Hay ${hierarchySkips} salto(s) de nivel.</span></p>` : ""
            ].join("")
          : `<p class="apcf-problem"><span aria-hidden="true">⚠</span><span>Error: no se encontró ningún encabezado H1-H6.</span></p>`;
        const box = floating("Encabezados", `
          <p class="apcf-explain">Comprueba la jerarquía de los encabezados. H1 es el principal y los demás cuelgan de él.</p>
          ${headingsStatus}
          ${headings.length ? listHead("apcf-list-head--heading", ["Nivel", "Texto"]) : ""}
          <ul class="apcf-tree">${items || "<li>No se encontraron encabezados.</li>"}</ul>
        `, {
          summary: "Encabezados",
          summaryDetail: "Comprueba la jerarquía de los encabezados.",
          summaryResult: headings.length ? `${headings.length} encabezado(s) visibles. H1 encontrados: ${h1Count}. Saltos de jerarquía: ${hierarchySkips}.` : "No se encontraron encabezados.",
          summarySeverity: h1Problem || hierarchyProblem ? "error" : ""
        });
        box.querySelectorAll("[data-apcf-scroll-heading]").forEach(button => {
          button.addEventListener("click", () => {
            const heading = headings[Number(button.dataset.apcfScrollHeading)];
            if (!heading) return;
            revealElement(heading, `${heading.tagName}`, "ok", { detail: textValue(heading).slice(0, 160) || "Sin texto visible.", noLabel: true });
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
        const tree = landmarkTree(landmarks);
        let mainCount = 0;
        landmarks.forEach(el => {
          if (landmarkRole(el) === "main") mainCount += 1;
          if (state.landmarksVisible) {
            const label = labelledByText(el) || el.getAttribute("aria-label") || "";
            mark(el, `${roleLabel(landmarkRole(el))}${label ? `: ${label.slice(0, 50)}` : ""}`, "warn");
          }
        });
        const boxes = tree.map(node => renderLandmarkNode(node, landmarks)).join("");
        const mainProblem = mainCount !== 1;
        const issues = mainProblem ? 1 : 0;
        const mainError = mainProblem
          ? problemResult(mainCount === 0 ? "Error: no se encontró ninguna zona main." : `Error: se detectaron ${mainCount} zonas main. Debe haber una sola zona main.`)
          : "";
        const box = floating("Puntos de referencia", `
          <p class="apcf-explain">Comprueba que las zonas estructuran la página y que cada una se reconoce por su tipo y su etiqueta visible.</p>
          ${mainError}
          ${landmarks.length ? (!mainProblem ? `<p class="apcf-result">${escapeHtml(`${landmarks.length} puntos marcados. Main encontrados: ${mainCount}.`)}</p>` : "") : problemResult("Problema: no se encontró ningún punto de referencia.")}
          ${landmarks.length ? listHead("apcf-list-head--landmark", ["Tipo", "Etiqueta", "Título"]) : ""}
          <div class="apcf-landmark-map"><div class="apcf-landmark-tree">${boxes || "<p>No se encontraron puntos de referencia.</p>"}</div></div>
        `, { summary: "Puntos de referencia", summaryDetail: "Comprueba que las zonas estructuran la página y que cada una se reconoce por su tipo y su etiqueta visible.", summaryResult: landmarks.length ? `${landmarks.length} punto(s) de referencia. Main encontrados: ${mainCount}.` : "No se encontraron puntos de referencia.", summarySeverity: landmarks.length === 0 ? "error" : "" });
        box.querySelectorAll("[data-apcf-landmark]").forEach(button => {
          button.addEventListener("click", () => {
            const landmark = landmarks[Number(button.dataset.apcfLandmark)];
            if (!landmark) return;
            const title = visibleLandmarkTitle(landmark);
            revealElement(landmark, `${roleLabel(landmarkRole(landmark))}${title ? `: ${title}` : ""}`, "warn", { detail: `Etiqueta: ${labelledByText(landmark) || landmark.getAttribute("aria-label") || "Sin etiqueta"}`, noLabel: true });
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
        floating("Blanco y negro", explainResult("Simula una vista sin color.", "La página se muestra en blanco y negro para revisar dependencias del color."), { summary: "Blanco y negro", summaryDetail: "Simula una vista sin color.", summaryResult: "Filtro aplicado a la página." });
        result(check, 0, "manual");
        break;
      }

      case "contrast": {
        const candidates = visibleElements("p,li,a,button,label,h1,h2,h3,h4,h5,h6,span,td,th").filter(el => textValue(el).length);
        let issues = 0;
        let approximateCount = 0;
        let reviewCount = 0;
        const rows = [];
        candidates.forEach((el, index) => {
          const style = getComputedStyle(el);
          const bgInfo = effectiveBgInfo(el);
          const bg = bgInfo.color;
          const ratio = contrastRatio(style.color, bg);
          if (!ratio) return;
          const fontSize = Number.parseFloat(style.fontSize);
          const isBold = Number.parseInt(style.fontWeight, 10) >= 700;
          const large = fontSize >= 24 || (isBold && fontSize >= 18.66);
          const limit = large ? 3 : 4.5;
          const fails = ratio < limit;
          const severity = bgInfo.approximate ? "review" : (!fails ? "ok" : (ratio < 3 ? "error" : "warn"));
          const format = `${Math.round(fontSize)}px / ${style.fontWeight}`;
          if (bgInfo.approximate) {
            approximateCount += 1;
            reviewCount += 1;
          } else if (fails) {
            issues += 1;
            if (state.contrastVisible) mark(el, `Contraste ${ratio.toFixed(1)}:1`, "error");
          }
          if (fails || rows.length < 18) {
            rows.push(`<tr data-apcf-severity="${severity}"><td><button class="apcf-mini-button" type="button" data-apcf-show-contrast="${index}">Ver</button></td><td><span class="apcf-contrast-sample" style="color:${escapeHtml(style.color)};background:${escapeHtml(bg)}">${escapeHtml(textValue(el).slice(0, 48))}</span></td><td><span class="apcf-color-chip" style="--apcf-chip:${escapeHtml(style.color)}"></span>${escapeHtml(style.color)}</td><td><span class="apcf-color-chip" style="--apcf-chip:${escapeHtml(bg)}"></span>${escapeHtml(bg)}${bgInfo.approximate ? " (aprox.)" : ""}</td><td>${escapeHtml(format)}</td><td>${ratio.toFixed(2)}:1</td><td>${limit}:1</td><td class="${severity === "ok" ? "apcf-contrast-pass" : "apcf-contrast-fail"}">${severity === "ok" ? "Pasa" : severity === "review" ? "Revisar" : "Revisar"}</td></tr>`);
          }
        });
        const summaryText = issues
          ? `${issues} posible(s) fallo(s) de contraste.`
          : "No se detectaron fallos automáticos de contraste en la página. Revisa también hover, focus y texto sobre imagen.";
        const summaryNote = approximateCount
          ? `${approximateCount} fondo(s) calculado(s) de forma aproximada por capas transparentes o fondos complejos.`
          : "";
        const summaryTail = reviewCount ? `${reviewCount} elemento(s) requieren revisión manual.` : "";
        const box = floating("Contraste de color", `
          <p class="apcf-explain">Revisa el primer plano y el fondo de cada texto. La tabla muestra el mismo color detectado en la página.</p>
          <p class="apcf-result">${escapeHtml(summaryText)}${summaryNote ? ` <span class="apcf-muted-note">${escapeHtml(summaryNote)}</span>` : ""}${summaryTail ? ` <span class="apcf-muted-note">${escapeHtml(summaryTail)}</span>` : ""}</p>
          <div class="apcf-table-scroll">
          <table class="apcf-contrast-table">
            <caption>Evaluador de contraste</caption>
            <colgroup>
              <col style="width:3.9rem">
              <col style="width:27%">
              <col style="width:16%">
              <col style="width:16%">
              <col style="width:8.2rem">
              <col style="width:6.1rem">
              <col style="width:5.9rem">
              <col style="width:5.9rem">
            </colgroup>
            <thead><tr><th>Ver</th><th>Texto</th><th>Primer plano</th><th>Fondo</th><th>Formato</th><th>Ratio</th><th>Mínimo</th><th>Estado</th></tr></thead>
            <tbody>${rows.join("") || "<tr><td colspan='8'>No se encontraron textos evaluables.</td></tr>"}</tbody>
          </table>
          </div>
        `, { summary: "Contraste de color", summaryDetail: "Revisa el primer plano y el fondo de cada texto.", summaryResult: `${summaryText}${summaryNote ? ` ${summaryNote}` : ""}${summaryTail ? ` ${summaryTail}` : ""}` });
        box.querySelector("[data-apcf-show-contrast-page]")?.addEventListener("change", event => {
          state.contrastVisible = event.currentTarget.checked;
          refreshVisuals();
        });
        box.querySelectorAll("[data-apcf-show-contrast]").forEach(button => {
          button.addEventListener("click", () => {
            const el = candidates[Number(button.dataset.apcfShowContrast)];
            if (!el) return;
            const style = getComputedStyle(el);
            const bgInfo = effectiveBgInfo(el);
            const bg = bgInfo.color;
            const ratio = contrastRatio(style.color, bg);
            const fontSize = Number.parseFloat(style.fontSize);
            const isBold = Number.parseInt(style.fontWeight, 10) >= 700;
            const large = fontSize >= 24 || (isBold && fontSize >= 18.66);
            const limit = large ? 3 : 4.5;
            const fails = ratio && ratio < limit;
            const severity = ratio
              ? (fails ? (ratio < 3 ? "error" : "warn") : "ok")
              : "warn";
            revealElement(el, `Contraste ${ratio ? `${ratio.toFixed(1)}:1` : `${style.color} / ${bg}`}`, severity, { detail: `${textValue(el).slice(0, 90) || "Sin texto visible."}${bgInfo.approximate ? "\nFondo aproximado por capas transparentes o fondos complejos." : ""}`, noLabel: true });
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
          let severity = "ok";
          let note = visibleText
            ? "Sin incidencias automáticas."
            : "Sin texto visible.";
          if ((!visibleText || visibleText.trim().toLowerCase() === "sin texto visible") && (!name || name.trim().toLowerCase() === "sin nombre")) {
            severity = "error";
            note = "Sin texto visible y sin nombre accesible.";
            issues += 1;
          } else if (visibleText && !name) {
            severity = "error";
            note = "Texto visible presente y sin nombre accesible.";
            issues += 1;
          }
          return `
            <button class="apcf-media-item apcf-link-item" type="button" data-apcf-show-link="${index}" data-apcf-severity="${severity}">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${index + 1}</strong>
              <span>${escapeHtml(visibleText || "Sin texto visible!")}</span>
              <span>${escapeHtml(name || "Sin nombre")}</span>
              <span>${escapeHtml(note)}</span>
            </button>
          `;
        }).join("");
        const linkProblem = issues > 0;
        const box = floating("Texto de enlaces", `
          <p class="apcf-explain">Revisa si el nombre accesible es correcto.</p>
          ${linkProblem ? problemResult(`Error: ${issues} enlace(s) con texto visible y sin nombre accesible.`) : ""}
          <p class="apcf-result">${escapeHtml(issues ? `${issues} enlace(s) con texto visible y sin nombre accesible.` : "No se detectaron enlaces con texto visible y sin nombre accesible.")}</p>
          ${rows ? listHead("apcf-list-head--link", ["Ver", "Id", "Texto visible", "Nombre accesible", "Estado"]) : ""}
          <div class="apcf-media-list">${rows || "<p>No se encontraron enlaces.</p>"}</div>
        `, { summary: "Texto de enlaces", summaryDetail: "Revisa si el nombre accesible es correcto.", summaryResult: issues ? `${issues} enlace(s) con texto visible y sin nombre accesible.` : "No se detectaron enlaces con texto visible y sin nombre accesible.", summarySeverity: linkProblem || links.length === 0 ? "error" : "" });
        const showLink = index => {
          const link = links[index];
          if (!link) return;
          const visibleText = textValue(link);
          const name = accessibleName(link);
          const hasVisible = !!visibleText;
          const different = visibleText && visibleText.replace(/\s+/g, " ").trim().toLowerCase() !== name.replace(/\s+/g, " ").trim().toLowerCase();
          const missingVisibleAndName = (!visibleText || visibleText.trim().toLowerCase() === "sin texto visible") && (!name || name.trim().toLowerCase() === "sin nombre");
          const severity = missingVisibleAndName
            ? "error"
            : !hasVisible
              ? ((!name || name === "Sin nombre") ? "error" : "warn")
              : (!name ? "error" : (different ? "warn" : "ok"));
          revealElement(link, "Enlace", severity, {
            detail: name ? name.slice(0, 160) : "Sin nombre accesible.",
            noLabel: true
          });
          hideCurrentFloatingPanel();
        };
        box.querySelectorAll("[data-apcf-show-link]").forEach(button => {
          button.addEventListener("click", () => showLink(Number(button.dataset.apcfShowLink)));
        });
        box.querySelector("[data-apcf-show-all-links]")?.addEventListener("change", event => {
          state.linkTextVisible = event.currentTarget.checked;
          document.querySelectorAll(`.${MARK}[data-apcf-link-mark="true"]`).forEach(el => {
            el.classList.remove(MARK);
            el.removeAttribute("data-apcf-severity");
            el.removeAttribute("data-apcf-mark-id");
            el.removeAttribute("data-apcf-mark-kind");
            el.removeAttribute("data-apcf-link-mark");
          });
          document.querySelectorAll(`.${LABEL}[data-apcf-link-label="true"]`).forEach(el => el.remove());
          if (!event.currentTarget.checked) return;
          links.forEach((link, index) => {
            const visibleText = textValue(link);
            const name = accessibleName(link);
            const labelText = visibleText
              ? (name ? name.slice(0, 120) : "Sin nombre accesible!")
              : "Sin texto visible!";
            const severity = visibleText && !name ? "error" : "ok";
            mark(link, labelText, severity, "link");
            link.setAttribute("data-apcf-link-mark", "true");
            const label = document.querySelector(`.${LABEL}[data-apcf-target="${CSS.escape(link.getAttribute("data-apcf-mark-id"))}"]`);
            if (label) {
              label.setAttribute("data-apcf-link-label", "true");
              label.dataset.apcfLinkPlacement = "below";
              positionLabel(label);
            }
          });
        });
        if (state.linkTextVisible) {
          links.forEach((link, index) => {
            const visibleText = textValue(link);
            const name = accessibleName(link);
            const labelText = visibleText
              ? (name ? name.slice(0, 120) : "Sin nombre accesible!")
              : "Sin texto visible!";
            const severity = visibleText && !name ? "error" : "ok";
            mark(link, labelText, severity, "link");
            link.setAttribute("data-apcf-link-mark", "true");
            const label = document.querySelector(`.${LABEL}[data-apcf-target="${CSS.escape(link.getAttribute("data-apcf-mark-id"))}"]`);
            if (label) {
              label.setAttribute("data-apcf-link-label", "true");
              label.dataset.apcfLinkPlacement = "below";
              positionLabel(label);
            }
          });
        }
        result(check, issues);
        break;
      }

      case "skip-link": {
        const internal = visibleElements("a[href^='#']").filter(a => (a.getAttribute("href") || "").length > 1);
        const first = internal[0];
        let issues = 0;
        if (!first) {
          issues = 1;
          window.scrollTo({ top: 0, behavior: "smooth" });
          document.body.setAttribute("tabindex", "-1");
          try { document.body.focus({ preventScroll: true }); } catch (_error) {}
          floating("Enlace de salto", `
            ${problemResult("No se encontró enlace de salto al contenido.")}
            <p class="apcf-explain">Comprueba que exista un enlace de salto al contenido y que lleve a la zona correcta.</p>
          `, { summary: "Enlace de salto", summaryDetail: "Comprueba que exista un enlace de salto al contenido.", summaryResult: "No se encontró enlace de salto al contenido.", summarySeverity: "error" });
        } else {
          const targetId = first.getAttribute("href").slice(1);
          const target = document.getElementById(targetId);
          const originLabel = mark(first, `Skip link -> #${targetId}`, target ? "ok" : "error");
          if (originLabel) originLabel.setAttribute("data-apcf-skip-link", "true");
          if (target) mark(target, `Destino de skip link: #${targetId}`, "ok");
          else issues = 1;
          first.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
          try { first.focus({ preventScroll: true }); } catch (_error) { try { first.focus(); } catch (_ignored) {} }
          floating("Enlace de salto", explainResult(
            "Comprueba que exista un enlace de salto al contenido y que lleve a la zona correcta.",
            `Origen: ${escapeHtml(textValue(first) || first.getAttribute("href"))}<br>Destino: #${escapeHtml(targetId)} ${target ? "encontrado" : "no encontrado"}`
          ), { summary: "Enlace de salto", summaryDetail: "Comprueba origen y destino del salto al contenido.", summaryResult: `1 enlace interno. Destino ${target ? "encontrado" : "no encontrado"}.` });
        }
        result(check, issues);
        break;
      }

      case "language": {
        const lang = document.documentElement.getAttribute("lang");
        const langProblem = !lang || !lang.trim();
        floating("Idioma de la página", explainResult(
          "Comprueba que coincide con el idioma principal del texto de la página.",
          langProblem
            ? problemResult("Problema: no se encontró este elemento.")
            : `<strong>Idioma declarado:</strong> ${escapeHtml(lang)}`
        ), { summary: "Idioma de la página", summaryDetail: "Comprueba que coincide con el idioma principal.", summaryResult: langProblem ? "No hay idioma declarado." : `Idioma declarado: ${lang}.`, summarySeverity: langProblem ? "error" : "" });
        result(check, langProblem ? 1 : 0);
        break;
      }

      case "audio":
      case "video": {
        state[`${check.id}Visible`] = true;
        if (check.id === "audio") {
          const findings = audioCandidates();
          let issues = 0;
          const highlighted = new Set();
          const items = findings.map((item, index) => {
            if (item.severity === "error") issues += 1;
            const target = item.target || item.element;
            if (state.audioVisible && target && !highlighted.has(target)) {
              const label = mark(target, `${item.kind} localizado`, item.severity === "error" ? "error" : "warn", "media");
              if (label) {
                label.dataset.apcfMediaPlacement = "below";
                positionLabel(label);
              }
              highlighted.add(target);
            }
          return `
              <button class="apcf-media-item apcf-video-item" type="button" data-apcf-show-media="${index}" data-apcf-media-title="${escapeHtml(`AUDIO · ${item.file}`)}" data-apcf-media-label="${escapeHtml(item.insertion)}">
                <span class="apcf-mini-button" aria-hidden="true">Ver</span>
                <strong>${escapeHtml(item.file)}</strong>
                <span>${escapeHtml(item.insertion)}</span>
                <span>${escapeHtml(item.problems)}</span>
              </button>
            `;
          });
          const summaryResult = `${findings.length} coincidencia(s) detectada(s).`;
          const box = floating("Audio", `
            <p class="apcf-explain">Observa si en el audio hay una transcripción textual.</p>
            <p class="apcf-result">${escapeHtml(summaryResult)}</p>
            ${items.length ? listHead("apcf-list-head--video", ["Ver", "Archivo", "Inserción", "Problemas"]) : ""}
            ${items.length ? `<div class="apcf-media-list">${items.join("")}</div>` : ""}
          `, { summary: "Audio", summaryDetail: "Observa si en el audio hay una transcripción textual.", summaryResult });
          if (findings.length) {
            requestAnimationFrame(() => {
              const first = findings[0];
              const focusTarget = first.target || first.element;
              if (focusTarget) {
                try { focusTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }); } catch (_error) {}
                try { focusTarget.focus({ preventScroll: true }); } catch (_error) { try { focusTarget.focus(); } catch (_ignored) {} }
              }
            });
          }
          box.querySelectorAll("[data-apcf-show-media]").forEach(button => {
            button.addEventListener("click", () => {
              const item = findings[Number(button.dataset.apcfShowMedia)];
              if (!item) return;
              const target = item.target || item.element;
              if (!target) return;
              revealElement(target, `${item.kind} · línea ${item.line || "?"}`, item.severity === "error" ? "error" : "warn", {
                detail: [
                  `Archivo: ${item.file}`,
                  `Línea: ${item.line || "?"}`,
                  `Fragmento: ${item.fragment}`,
                  `Inserción: ${item.insertion}`,
                  `Problemas: ${item.problems}`
                ].join("\n"),
                noLabel: true
              });
              hideCurrentFloatingPanel();
            });
          });
          result(check, issues, findings.length ? undefined : "manual");
          break;
        }

        state.videoVisible = true;
        const findings = videoCandidates();
        let issues = 0;
        const highlighted = new Set();
        const items = findings.map((item, index) => {
          if (item.severity === "error") issues += 1;
          const target = item.target || item.element;
          if (state.videoVisible && target && !highlighted.has(target)) {
            const label = mark(target, `${item.kind === "poster" ? "Poster" : "Vídeo"} localizado`, "warn", "media");
            if (label) {
              label.dataset.apcfMediaPlacement = "below";
              positionLabel(label);
            }
            highlighted.add(target);
          }
          return `
            <button class="apcf-media-item apcf-video-item" type="button" data-apcf-show-media="${index}" data-apcf-media-title="${escapeHtml(`${item.kind.toUpperCase()} · ${item.file}`)}" data-apcf-media-label="${escapeHtml(item.insertion)}">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${escapeHtml(item.file)}</strong>
              <span>${escapeHtml(item.insertion)}</span>
              <span>${escapeHtml(item.problems)}</span>
            </button>
          `;
        });
        const summaryResult = `${findings.length} coincidencia(s) detectada(s).`;
        const box = floating("Vídeo", `
          <p class="apcf-explain">Observa si el video tiene subtítulos y audiodescripción o transcripción.</p>
          <p class="apcf-result">${escapeHtml(summaryResult)}</p>
          ${items.length ? listHead("apcf-list-head--video", ["Ver", "Archivo", "Inserción", "Problemas"]) : ""}
          ${items.length ? `<div class="apcf-media-list">${items.join("")}</div>` : ""}
        `, { summary: "Vídeo", summaryDetail: "Observa si el video tiene subtítulos y audiodescripción o transcripción.", summaryResult });
        if (findings.length) {
          requestAnimationFrame(() => {
            const first = findings[0];
            const focusTarget = first.target || first.element;
            if (focusTarget) {
              try { focusTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }); } catch (_error) {}
              try { focusTarget.focus({ preventScroll: true }); } catch (_error) { try { focusTarget.focus(); } catch (_ignored) {} }
            }
            updateLabels();
          });
        }
        box.querySelectorAll("[data-apcf-show-media]").forEach(button => {
          button.addEventListener("click", () => {
            const item = findings[Number(button.dataset.apcfShowMedia)];
            if (!item) return;
            const target = item.target || item.element;
            if (!target) return;
            const label = item.kind === "poster" ? "Poster" : `Vídeo ${item.kind}`;
            revealElement(target, `${label} · línea ${item.line || "?"}`, "warn", {
              detail: [
                `Archivo: ${item.file}`,
                `Línea: ${item.line || "?"}`,
                `Fragmento: ${item.fragment}`,
                `Inserción: ${item.insertion}`,
                `Problemas: ${item.problems}`
              ].join("\n"),
              noLabel: true
            });
            hideCurrentFloatingPanel();
          });
        });
        result(check, issues, findings.length ? undefined : "manual");
        break;
      }

      case "focus-order": {
        const focusable = focusablePageElements();
        let issues = 0;
        if (!focusable.length) {
          floating("Orden de foco", explainResult("Comprueba el orden de los elementos de foco", "No se encontraron elementos enfocables."), { summary: "Orden de foco", summaryDetail: "Comprueba el orden de los elementos de foco.", summaryResult: "No se encontraron elementos enfocables." });
          result(check, 0, "manual");
          break;
        }
        focusable.forEach((el, index) => {
          const tabindexAttr = el.getAttribute("tabindex");
          const positive = tabindexAttr && Number(tabindexAttr) > 0;
          if (positive) issues += 1;
          mark(el, `#${index + 1}`, positive ? "warn" : "ok");
        });
        floating("Orden de foco", explainResult("Comprueba el orden de los elementos de foco", `${focusable.length} elemento(s) enfocable(s) numerados.`), { summary: "Orden de foco", summaryDetail: "Comprueba el orden de los elementos de foco.", summaryResult: `${focusable.length} elemento(s) enfocable(s) numerados.` });
        result(check, issues);
        break;
      }

      case "focus-view": {
        const count = applyFocusView();
        floating("Mostrar foco", explainResult(
          "Muestra el estilo que recibe cada elemento cuando obtiene el foco de teclado.",
          count ? `${count} elemento(s) enfocable(s) revisados.` : "No se encontraron elementos enfocables."
        ), { summary: "Mostrar foco", summaryDetail: "Muestra el estilo que recibe cada elemento enfocable.", summaryResult: count ? `${count} elemento(s) enfocable(s) revisados.` : "No se encontraron elementos enfocables." });
        result(check, 0, count ? "manual" : "ok");
        break;
      }

      case "form-labels": {
        const fields = visibleElements("input:not([type='hidden']),select,textarea");
        let issues = 0;
        if (!fields.length) {
          floating("Etiquetas", explainResult("Observa si hay campos visibles y si están correctamente etiquetados.", "No hay formularios visibles en esta página."), { summary: "Etiquetas", summaryDetail: "Observa si hay campos visibles y correctamente etiquetados.", summaryResult: "No hay formularios visibles." });
          result(check, 0, "manual");
          break;
        }
        const items = fields.map((field, index) => {
          const status = formLabelStatus(field);
          const labelEl = labelElementForField(field);
          const hasLabel = status.hasLabel;
          const hasName = status.hasName;
          const severity = hasLabel && hasName ? "ok" : "error";
          const labelNote = status.title;
          if (!hasLabel || !hasName) {
            issues += 1;
            mark(field, hasLabel ? "Sin nombre accesible" : "Sin etiqueta", "error");
          } else {
            mark(field, status.labelText ? `Etiqueta: ${status.labelText.slice(0, 70)}` : `Nombre accesible: ${status.name.slice(0, 70)}`, "ok");
            if (labelEl) {
              mark(labelEl, field.id ? `Etiqueta del campo con ID='${field.id}'` : "Etiqueta del campo", "ok", "media");
            }
            if (status.labelledByIds.length) {
              status.labelledByIds.forEach(id => {
                const ref = document.getElementById(id);
                if (ref) mark(ref, `Etiqueta para ID='${field.id || "campo"}'`, "ok", "media");
              });
            }
          }
          return `
            <button class="apcf-media-item apcf-form-item" type="button" data-apcf-show-field="${index}" data-apcf-severity="${severity}">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${escapeHtml(field.tagName.toLowerCase())}</strong>
              <span>${escapeHtml(labelNote.slice(0, 90))}</span>
              <span>${escapeHtml(hasName ? `Nombre accesible: ${status.name.slice(0, 90)}` : "Sin nombre accesible")}</span>
            </button>
          `;
        }).join("");
        document.querySelectorAll("label[for]").forEach(labelEl => {
          const targetId = labelEl.getAttribute("for");
          if (!targetId) return;
          if (!document.getElementById(targetId)) {
            mark(labelEl, `Etiqueta sin campo asociado con ID='${targetId}'`, "error", "media");
          }
        });
        const box = floating("Etiquetas", `
          <p class="apcf-explain">Observa si hay campos visibles y si están correctamente etiquetados.</p>
          <p class="apcf-result">${escapeHtml(`${fields.length} campo(s) visible(s). ${issues} incidencia(s) automática(s).`)}</p>
          ${items ? listHead("apcf-list-head--form", ["Ver", "Campo", "Etiqueta", "Nombre accesible"]) : ""}
          <div class="apcf-media-list">${items}</div>
        `, { summary: "Etiquetas", summaryDetail: "Observa si hay campos visibles y correctamente etiquetados.", summaryResult: `${fields.length} campo(s) visible(s). ${issues} incidencia(s) automática(s).`, summaryResultMarkup: issues ? `${escapeHtml(`${fields.length} campo(s) visible(s).`)}<span class="apcf-summary-alert-inline apcf-summary-alert-block">${escapeHtml(`${issues} incidencia(s) automática(s).`)}</span>` : "" });
        box.querySelectorAll("[data-apcf-show-field]").forEach(button => {
          button.addEventListener("click", () => {
            const field = fields[Number(button.dataset.apcfShowField)];
            if (!field) return;
            const status = formLabelStatus(field);
            revealElement(field, status.hasName ? (status.labelText ? `Etiqueta: ${status.labelText.slice(0, 60)}` : `Nombre accesible: ${status.name.slice(0, 60)}`) : "Sin nombre accesible", status.hasName ? "ok" : "error", {
              detail: [
                status.title,
                status.detail || "Sin datos adicionales."
              ].join("\n"),
              noLabel: true
            });
            hideCurrentFloatingPanel();
          });
        });
        result(check, issues);
        break;
      }

      case "form-required": {
        const fields = visibleElements("input:not([type='hidden']),select,textarea");
        if (!fields.length) {
          floating("Campos obligatorios", explainResult("Observa si los campos obligatorios están señalados de forma clara.", "No hay formularios visibles en esta página."), { summary: "Campos obligatorios", summaryDetail: "Observa si los obligatorios están señalados.", summaryResult: "No hay formularios visibles." });
          result(check, 0, "manual");
          break;
        }
        const labels = Array.prototype.slice.call(document.querySelectorAll("label"));
        const requiredItems = [];
        const seen = new Set();
        labels.forEach(labelEl => {
          let field = labelEl.querySelector("input,select,textarea");
          if (!field && labelEl.getAttribute("for")) field = document.getElementById(labelEl.getAttribute("for"));
          if (!field) return;
          const labelText = textValue(labelEl);
          const required = field.required || field.getAttribute("aria-required") === "true" || /\*/.test(labelText) || /oblig|requer|required/i.test(labelText);
          if (!required) return;
          const key = field.getAttribute("data-apcf-required-key") || `${field.tagName.toLowerCase()}|${field.getAttribute("id") || labelText}`;
          if (seen.has(key)) return;
          seen.add(key);
          requiredItems.push({ field, labelEl, labelText });
        });
        const items = requiredItems.map((item, index) => {
          const { field, labelEl, labelText } = item;
          const label = labelForField(field);
          const hasAsterisk = /\*/.test(labelText);
          const keyword = (labelText.match(/\b(obligatorio|requerido|required)\b/i) || [])[0] || "";
          const requiredText = hasAsterisk ? "*" : keyword;
          const status = requiredText ? `Marcado correctamente con '${requiredText}'?` : "Campo obligatorio";
          mark(field, status, "warn");
          mark(labelEl, status, "warn", "media");
          return `
            <button class="apcf-media-item apcf-form-item" type="button" data-apcf-show-required="${index}" data-apcf-severity="warn">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${escapeHtml(field.tagName.toLowerCase())}</strong>
              <span>${escapeHtml(label || labelText || "Sin etiqueta")}</span>
              <span>${escapeHtml(status)}</span>
            </button>
          `;
        }).join("");
        const requiredCount = requiredItems.length;
        const requiredSummary = requiredCount
          ? `${requiredCount} campo(s) obligatorio(s) detectado(s).`
          : "No hay campos obligatorios visibles.";
        const box = floating("Campos obligatorios", `
          <p class="apcf-explain">Observa si los campos obligatorios están señalados de forma clara.</p>
          <p class="apcf-result">${escapeHtml(requiredSummary)}</p>
          ${items ? listHead("apcf-list-head--form", ["Ver", "Campo", "Etiqueta", "Estado"]) : ""}
          <div class="apcf-media-list">${items}</div>
        `, { summary: "Campos obligatorios", summaryDetail: "Observa si los obligatorios están señalados.", summaryResult: requiredSummary });
        const requiredBox = document.querySelector(`.${FLOATING}`);
        requiredBox?.querySelectorAll("[data-apcf-show-required]").forEach(button => {
          button.addEventListener("click", () => {
            const item = requiredItems[Number(button.dataset.apcfShowRequired)];
            if (!item) return;
            const { field, labelEl, labelText } = item;
            const label = labelForField(field) || labelText;
            const hasAsterisk = /\*/.test(labelText);
            const keyword = (labelText.match(/\b(obligatorio|requerido|required)\b/i) || [])[0] || "";
            const requiredText = hasAsterisk ? "*" : keyword;
            const status = requiredText ? `Marcado correctamente con '${requiredText}'?` : "Campo obligatorio";
            revealElement(field, "Campo obligatorio", "warn", {
              detail: [
                label ? `Etiqueta: ${label.slice(0, 120)}` : "Sin etiqueta.",
                status,
                requiredVisualText(field) ? `Texto visible detectado: ${requiredVisualText(field).slice(0, 120)}` : "Sin texto visible detectado."
              ].join("\n"),
              noLabel: true
            });
            if (labelEl) {
              mark(labelEl, status, "warn", "media");
            }
            hideCurrentFloatingPanel();
          });
        });
        result(check, 0, "manual");
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
    return "<strong>Evaluar</strong><span>Elige una opción y observa las marcas en la página.</span>";
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
    syncPanelWidth();
    document.documentElement.classList.add(PAGE_SHIFT);
    const existing = document.getElementById(PANEL_ID);
    const priorScrollTop = existing?.querySelector(".apcf-list")?.scrollTop || 0;
    if (existing) existing.remove();

    const profile = currentProfile();
    const groups = groupedChecks(checksForProfile());
    const panel = document.createElement("aside");
    panel.id = PANEL_ID;
    panel.setAttribute("role", "complementary");
    panel.setAttribute("aria-label", "A11yEvalBasic");
    panel.classList.toggle("apcf-panel-collapsed", state.panelCollapsed);
    const collapsedToggle = state.panelCollapsed ? `
      <button class="apcf-panel-toggle" type="button" data-apcf-toggle-panel aria-label="Expandir panel" style="position:absolute;top:0;right:0;left:auto;z-index:2147483647;width:4.55rem;height:4.55rem;margin:0;padding:0 .42rem 0 .48rem;border:2px solid #000;border-right:0;border-radius:0 1.2rem 1.2rem 0;background:#8a1f66;color:#fff;display:flex;align-items:center;justify-content:space-between;cursor:pointer;box-shadow:0 10px 22px rgb(0 0 0 / .24);overflow:visible;box-sizing:border-box;visibility:visible;opacity:1;pointer-events:auto;">
        <img class="apcf-panel-toggle-icon" src="${escapeHtml(SCRIPT_BASE)}imgs/iconoA11yEB_blanco.png" alt="" aria-hidden="true" style="display:block;width:1.72rem;height:1.72rem;flex:0 0 auto;">
        <span class="apcf-panel-toggle-arrow" aria-hidden="true" style="display:block;font-size:2.08rem;line-height:1;font-weight:900;color:#fff;flex:0 0 auto;">❯</span>
        <span class="apcf-panel-toggle-label" aria-hidden="true" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">Expandir panel</span>
      </button>` : "";

    panel.innerHTML = `
      ${collapsedToggle}
      <header class="apcf-header">
        <div class="apcf-window-bar">
          <span class="apcf-window-title"><img class="apcf-title-icon" src="${escapeHtml(SCRIPT_BASE)}imgs/iconoA11yEB_blanco.png" alt="">A11yEvalBasic <span class="apcf-beta">Beta</span></span>
          <div class="apcf-header-actions">
            <button class="apcf-close" type="button" aria-label="Cerrar panel"></button>
            <button class="apcf-panel-toggle apcf-panel-toggle-header" type="button" data-apcf-toggle-panel aria-label="${state.panelCollapsed ? "Expandir panel" : "Colapsar panel"}">
              <img class="apcf-panel-toggle-icon" src="${escapeHtml(SCRIPT_BASE)}imgs/iconoA11yEB_blanco.png" alt="" aria-hidden="true">
            </button>
          </div>
        </div>
      </header>
      <span class="apcf-release-note">versión 1.0 · build ${BUILD} · <a href="${INFO_URL}" target="_blank" rel="noopener noreferrer">información</a> · <img class="apcf-udl-inline-logo" src="${escapeHtml(SCRIPT_BASE)}imgs/udl-blanco.jpeg" alt=""> Universitat de Lleida</span>
      <div class="apcf-profile-banner">Discapacidad: ${escapeHtml(profile.label)}</div>
      <section class="apcf-status" role="status" aria-live="polite" aria-atomic="true">${statusHtml()}</section>
      <nav class="apcf-list" aria-label="Comprobaciones W3C Easy Checks">
        ${groups.map(group => `
          <div class="apcf-group-title">${escapeHtml(group.category)}</div>
          ${group.items.map(check => `
            <div class="apcf-check-shell">
              <button class="apcf-check" type="button" data-check="${escapeHtml(check.id)}" aria-pressed="${state.active.has(check.id) ? "true" : "false"}">
                <span class="apcf-option-dot" aria-hidden="true"></span>
                <span class="apcf-check-title">${escapeHtml(sentenceCase(check.title))}</span>
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
              <img class="apcf-profile-icon" src="${escapeHtml(SCRIPT_BASE)}imgs/iconosDisc/${escapeHtml(item.icon)}" alt="">
              ${escapeHtml(item.short)}
            </label>
          </span>
        `).join("")}
      </fieldset>
    `;

    document.body.appendChild(panel);
    const listEl = panel.querySelector(".apcf-list");
    if (listEl) listEl.scrollTop = priorScrollTop;
    panel.querySelector(".apcf-close").addEventListener("click", closePanel);
    panel.querySelectorAll("[data-check]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.check;
        const active = state.active.has(id);
        if (active) {
          state.active.clear();
          state.lastCheck = "";
          state.hiddenPanels.delete(id);
        } else {
          state.active = new Set([id]);
          state.lastCheck = id;
          state.hiddenPanels.add(id);
        }
        refreshVisuals();
        render(false);
      });
    });
    panel.querySelectorAll("[data-apcf-toggle-panel]").forEach(toggleButton => toggleButton.addEventListener("click", () => {
      state.panelCollapsed = !state.panelCollapsed;
      syncPanelWidth();
      render(false);
      const target = document.querySelector(`#${PANEL_ID} [data-apcf-toggle-panel]`);
      target?.focus({ preventScroll: true });
    }));
    panel.querySelectorAll("input[name='apcf-profile']").forEach(input => {
      input.addEventListener("change", () => {
        state.profile = input.value;
        const visibleIds = new Set(checksForProfile().map(check => check.id));
        state.active = new Set([...state.active].filter(id => visibleIds.has(id)));
        refreshVisuals();
        render(false);
        const next = document.querySelector(`#${PANEL_ID} input[name='apcf-profile'][value="${CSS.escape(state.profile)}"]`);
      });
    });
    if (focusClose) {
      const target = state.panelCollapsed ? panel.querySelector("[data-apcf-toggle-panel]") : panel.querySelector(".apcf-close");
      target?.focus();
    }
  }

  function open() {
    state.panelCollapsed = false;
    render();
  }
  function close() { closePanel(); }
  function toggle() {
    if (document.getElementById(PANEL_ID)) closePanel();
    else render();
  }

  const api = {
    open,
    close,
    toggle,
    checks,
    profiles
  };
  window.A11yEvalBasic = api;
  window.A11yProfileCheckerFunkify = api;

  open();
})();
