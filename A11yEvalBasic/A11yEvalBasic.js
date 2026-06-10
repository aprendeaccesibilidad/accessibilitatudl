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
  const FOCUS_ORDER_ROUTE_ID = "apcf-focus-order-route";
  const BUILD = "547";
  const PANEL_WIDTH_VAR = "--apcf-panel-width";
  const PANEL_WIDTH_OPEN = "410px";
  const PANEL_WIDTH_COLLAPSED = "4.25rem";
  const INFO_URL = "https://accessibilitat.udl.cat/A11yEvalBasic/";
  const SURVEY_URL = "https://docs.google.com/forms/d/1Eu5WPCpfRFY8k0DB4W_pngPsdt78T6g9i8aDtKATpJI/preview";
  const SCRIPT_BASE = (() => {
    const src = document.currentScript && document.currentScript.src;
    return src ? src.slice(0, src.lastIndexOf("/") + 1) : "";
  })();
  let markId = 0;
  let listenersReady = false;
  let mediaRescanObserver = null;
  let mediaRescanTimer = null;

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
    panelCollapsed: false,
    pageSourceHtml: "",
    mediaSourceHtmlCache: new Map(),
    mediaSourcePending: new Set()
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
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle && existingStyle.dataset.apcfBuild === BUILD) return;
    existingStyle?.remove();
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.dataset.apcfBuild = BUILD;
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
        grid-template-rows: auto auto auto auto minmax(0, 1fr) auto auto;
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
        font-size: 1.42rem !important;
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
        font-size: 1.58rem;
        line-height: 1;
        font-weight: 950;
        justify-self: start;
        text-align: left;
        letter-spacing: 0;
        flex-wrap: wrap;
      }

      #${PANEL_ID} .apcf-title-icon {
        width: 2.3rem;
        height: 2.3rem;
        max-width: 2.3rem;
        min-width: 2.3rem;
        max-height: 2.3rem;
        min-height: 2.3rem;
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
        margin: .12rem auto;
        padding: .16rem .32rem .2rem;
        width: fit-content;
        max-width: 100%;
        
        background: #ffffff;
        color: #171717;
        font-size: .7rem;
        font-weight: 850;
        line-height: 1.15;
        text-align: center;
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
        grid-template-columns: 2.05rem 1fr auto;
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

      #${PANEL_ID} .apcf-option-dot {
        width: 1.45rem;
        height: 1.45rem;
        border: 3px solid #8a8a84;
        border-radius: 999px;
        background: #ffffff;
        justify-self: start;
        margin-left: .02rem;
      }

      #${PANEL_ID} .apcf-check[aria-pressed="true"] {
        border-color: #171717;
        background: #fff4cc;
        box-shadow: 0 0 0 4px rgb(247 189 61 / .36), 0 7px 18px rgb(0 0 0 / .1);
        outline: 3px solid #f7bd3d;
        outline-offset: -2px;
      }

      #${PANEL_ID} .apcf-check[aria-pressed="true"] .apcf-option-dot {
        border: 5px solid #171717;
        background: #171717;
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
        opacity: 0;
        appearance: none !important;
        -webkit-appearance: none !important;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        clip-path: inset(50%);
        white-space: nowrap;
        pointer-events: none;
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
        background: transparent;
        color: #4d4d4d;
        box-shadow: inset 0 0 0 2px #171717;
        outline: 2px solid #171717;
        outline-offset: -2px;
      }

      #${PANEL_ID} .apcf-close:focus-visible,
      #${PANEL_ID} .apcf-panel-toggle:focus-visible,
      #${PANEL_ID} .apcf-release-note a:focus-visible,
      #${PANEL_ID} .apcf-feedback-link:focus-visible,
      #${PANEL_ID} .apcf-check:focus-visible,
      #${PANEL_ID} .apcf-profile-wrap input:focus-visible + .apcf-profile {
        outline: 4px solid #0b66d8;
        outline-offset: -3px;
      }

      #${PANEL_ID} .apcf-feedback {
        margin: 0;
        padding: .36rem .45rem .42rem;
        border-top: 1px solid #dadad7;
        background: #ffffff;
        box-shadow: 0 -6px 16px rgb(0 0 0 / .08);
      }

      #${PANEL_ID} .apcf-feedback-link {
        display: grid;
        grid-template-columns: 2rem minmax(0, 1fr);
        align-items: center;
        gap: .52rem;
        min-height: 3.05rem;
        padding: .46rem .68rem;
        border: 2px solid #000000;
        border-radius: .85rem;
        background: #004D73;
        color: #ffffff;
        text-decoration: none;
        box-shadow: 0 8px 18px rgb(0 0 0 / .18);
      }

      #${PANEL_ID} .apcf-feedback-link:hover {
        background: #f7bd3d;
        color: #171717;
        text-decoration: underline;
        text-decoration-thickness: .14em;
        text-underline-offset: .16em;
      }

      #${PANEL_ID} .apcf-feedback-link:focus-visible {
        background: #f7bd3d;
        color: #171717;
        outline: 3px solid #f7bd3d;
        outline-offset: 2px;
      }

      #${PANEL_ID} .apcf-feedback-icon {
        display: inline-grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        background: #ffffff;
        color: #004D73;
        font-size: 1.08rem;
        font-weight: 950;
        line-height: 1;
      }

      #${PANEL_ID} .apcf-feedback-text {
        display: grid;
        gap: .05rem;
        min-width: 0;
        align-content: center;
        justify-content: start;
        text-align: left;
      }

      #${PANEL_ID} .apcf-feedback-text strong {
        display: block;
        font-size: .94rem;
        line-height: 1.05;
        font-weight: 950;
        margin: 0;
      }

      #${PANEL_ID} .apcf-feedback-text span {
        display: block;
        font-size: .76rem;
        line-height: 1.1;
        font-weight: 750;
        margin: 0;
      }

      #${PANEL_ID} .apcf-feedback-link {
        align-items: center;
      }

      .${MARK} {
        outline: 2px solid #ECB63A !important;
        outline-offset: 0 !important;
        box-shadow: inset 0 0 0 2px #171717 !important;
        border-radius: .25rem !important;
      }

      .${MARK}[data-apcf-severity="error"],
      .${MARK}[data-apcf-skip-link="true"],
      .${MARK}[data-apcf-mark-kind="media"],
      .${MARK}[data-apcf-mark-kind="link"],
      .${MARK}[data-apcf-severity="ok"] {
        outline: 2px solid #ECB63A !important;
        outline-offset: 0 !important;
        box-shadow: inset 0 0 0 2px #171717 !important;
        border: 2px solid #171717 !important;
        border-radius: .25rem !important;
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
        white-space: pre-line !important;
      }
      .${FLOATING} .apcf-iframe-note {
        margin-top: .65rem !important;
        border: 1px solid rgb(255 255 255 / .22) !important;
        border-radius: .55rem !important;
        background: #3a3a3a !important;
        color: #eeeeee !important;
        padding: .65rem .75rem !important;
        font-weight: 650 !important;
      }
      .${FLOATING} .apcf-iframe-note strong {
        color: #ffffff !important;
        font-weight: 900 !important;
      }
      .${FLOATING} .apcf-result {
        color: #ffffff !important;
        font-weight: 650 !important;
        font-size: 1.05rem !important;
        line-height: 1.45 !important;
        white-space: pre-line !important;
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

      .${FLOATING} .apcf-list-head--audio {
        grid-template-columns: 3rem minmax(14rem, 1.45fr) minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-list-head--video {
        grid-template-columns: 3rem minmax(14rem, 1.45fr) minmax(0, 1fr) !important;
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

      .${FLOATING} .apcf-list-head--hidden-start {
        grid-template-columns: 3rem minmax(7rem, .75fr) minmax(0, 1fr) minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-list-head--focus-order {
        grid-template-columns: 3rem 4.2rem minmax(0, 1fr) !important;
      }

      .${FLOATING} .apcf-list-head--heading {
        grid-template-columns: 4rem minmax(0, 1fr) !important;
        margin-top: 0 !important;
        top: 0 !important;
        z-index: 5 !important;
      }

      .${FLOATING} .apcf-list-head--landmark {
        grid-template-columns: minmax(9rem, .9fr) minmax(0, 1.05fr) minmax(0, 1.05fr) !important;
        margin-top: 0 !important;
        top: 0 !important;
        z-index: 5 !important;
      }

      .${FLOATING} .apcf-landmark-panel {
        display: grid !important;
        grid-template-rows: auto minmax(0, 1fr) !important;
        gap: .75rem !important;
        max-height: calc(min(74vh, calc(100vh - 2rem)) - 5.8rem) !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      .${FLOATING} .apcf-landmark-info {
        display: grid !important;
        gap: .45rem !important;
      }

      .${FLOATING} .apcf-heading-table {
        min-height: 0 !important;
        max-height: none !important;
        overflow: auto !important;
        margin-top: 0 !important;
        border-radius: .65rem !important;
      }

      .${FLOATING} .apcf-heading-table .apcf-tree {
        margin-top: 0 !important;
        border: 1px solid #747474 !important;
        border-top: 0 !important;
        border-radius: 0 0 .65rem .65rem !important;
        padding-top: .45rem !important;
      }

      .${FLOATING} .apcf-landmark-table {
        min-height: 0 !important;
        max-height: none !important;
        overflow: auto !important;
        margin-top: 0 !important;
        border-radius: .65rem !important;
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
        grid-template-columns: 3rem minmax(14rem, 1.45fr) minmax(0, 1fr) !important;
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
        word-break: break-word !important;
      }

      .${FLOATING} .apcf-audio-item {
        grid-template-columns: 3rem minmax(14rem, 1.45fr) minmax(0, 1fr) !important;
        border-color: #ffffff !important;
      }

      .${FLOATING} .apcf-audio-item > :nth-child(3) {
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

      .${FLOATING} .apcf-status-title {
        font-weight: 700;
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
        grid-template-rows: auto auto auto auto minmax(0, 1fr) auto auto !important;
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
        font-size: 1.58rem !important;
        line-height: .96 !important;
        font-weight: 950 !important;
        text-align: left !important;
        white-space: normal !important;
        transform: translateY(0) !important;
      }

      #${PANEL_ID} .apcf-title-icon {
        display: block !important;
        width: 2.3rem !important;
        height: 2.3rem !important;
        max-width: 2.3rem !important;
        min-width: 2.3rem !important;
        max-height: 2.3rem !important;
        min-height: 2.3rem !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        object-fit: contain !important;
        filter: none !important;
        opacity: 1 !important;
      }

      #${PANEL_ID} .apcf-header a:focus-visible,
      #${PANEL_ID} .apcf-header button:focus-visible,
      #${PANEL_ID} .apcf-header [tabindex]:focus-visible {
        outline: 3px solid #ffffff !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px #831451 !important;
      }

      #${PANEL_ID} .apcf-release-note {
        display: block !important;
        display: inline-block !important;
        margin: .12rem auto !important;
        padding: .18rem .35rem .18rem !important;
        background: #ffffff !important;
        color: #171717 !important;
        width: fit-content !important;
        max-width: 100% !important;
        font-size: .72rem !important;
        font-weight: 850 !important;
        line-height: 1.15 !important;
        text-align: center !important;
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

  function queryAllDeep(selector, root = document) {
    const results = [];
    const seen = new Set();
    const visitRoot = currentRoot => {
      if (!currentRoot || !currentRoot.querySelectorAll) return;
      currentRoot.querySelectorAll(selector).forEach(el => {
        if (seen.has(el)) return;
        seen.add(el);
        results.push(el);
      });
      currentRoot.querySelectorAll("*").forEach(el => {
        if (el.shadowRoot) visitRoot(el.shadowRoot);
      });
    };
    visitRoot(root);
    return results;
  }

  function visibleElements(selector) {
    return queryAllDeep(selector)
      .filter(el => !el.closest(`#${PANEL_ID}`))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });
  }

  function pageElements(selector) {
    return queryAllDeep(selector)
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
      el.removeAttribute("data-a11y-video-detected");
      el.removeAttribute("data-a11y-video-detector-label");
      el.removeAttribute("data-a11y-audio-detected");
      el.removeAttribute("data-a11y-audio-label");
    });
    document.querySelectorAll(`.${LABEL}`).forEach(el => el.remove());
    document.getElementById(FOCUS_ORDER_ROUTE_ID)?.remove();
    document.querySelectorAll("[data-apcf-image-alt-annotated]").forEach(img => {
      const prev = img.getAttribute("data-apcf-image-prev-border") || "";
      if (prev) img.style.border = prev;
      else img.style.removeProperty("border");
      img.style.removeProperty("outline");
      img.style.removeProperty("outline-offset");
      img.style.removeProperty("box-shadow");
      img.removeAttribute("data-apcf-image-prev-border");
      img.removeAttribute("data-apcf-image-alt-annotated");
    });
    clearFormInlineNotes();
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
    stopMediaRescan();
    state.pageSourceHtml = "";
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

  function annotateImageAlt(img, altText) {
    if (!img) return null;
    const alt = altText == null ? "" : String(altText);
    const hasAlt = alt.trim().length > 0;
    if (!img.hasAttribute("data-apcf-image-prev-border")) {
      img.setAttribute("data-apcf-image-prev-border", img.style.border || "");
    }
    img.setAttribute("data-apcf-image-alt-annotated", "true");
    img.style.outline = "2px solid #ECB63A";
    img.style.outlineOffset = "0";
    img.style.boxShadow = "inset 0 0 0 2px #171717";
    const label = document.createElement("div");
    label.className = LABEL;
    label.dataset.apcfImageAltLabel = "true";
    label.textContent = `[ALT: ${hasAlt ? alt : "Sin texto alternativo"}]`;
    label.style.position = "absolute";
    label.style.background = "yellow";
    label.style.color = "black";
    label.style.padding = "5px";
    label.style.border = "1px solid black";
    label.style.fontSize = "12px";
    label.style.zIndex = "1000";
    label.style.whiteSpace = "nowrap";
    label.style.pointerEvents = "none";
    const rect = img.getBoundingClientRect();
    label.style.top = `${window.scrollY + rect.top - 20}px`;
    label.style.left = `${window.scrollX + rect.left}px`;
    document.body.appendChild(label);
    return label;
  }

  function positionLabel(label) {
    if (label.dataset.apcfHiddenStartLabel === "true") {
      const index = Number(label.dataset.apcfHiddenStartIndex || "0");
      label.style.left = "12px";
      label.style.top = `${12 + index * 42}px`;
      return;
    }
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
      state.panelSummaries.set(id, { title, summary, summaryDetail, summaryResult, summaryResultMarkup: options.summaryResultMarkup || "", severity: summarySeverity });
    }
    if (id && state.hiddenPanels.has(id) && !summary) state.hiddenPanels.delete(id);
    if (id && summary && state.hiddenPanels.has(id)) {
      return renderFloatingSummary(id, title, summary, summaryDetail, summaryResult, options.summaryResultMarkup || "");
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

  function normalizedText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("es-ES");
  }

  function genericLinkTextReason(value) {
    const text = normalizedText(value);
    if (!text) return "";
    const generic = new Set([
      "leer mas",
      "ver mas",
      "mas",
      "mas info",
      "mas informacion",
      "info",
      "informacion",
      "saber mas",
      "conocer mas",
      "ampliar",
      "detalle",
      "detalles",
      "continuar",
      "seguir leyendo",
      "read more",
      "more",
      "more info",
      "learn more",
      "details"
    ]);
    if (generic.has(text)) return `Texto de enlace poco descriptivo: "${value}".`;
    if (/^(leer|ver|saber|conocer|mostrar|ampliar)\s+mas$/.test(text)) return `Texto de enlace poco descriptivo: "${value}".`;
    return "";
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
    const tag = field.tagName.toLowerCase();
    const type = (field.getAttribute("type") || "").toLowerCase();
    const buttonLike = tag === "button" || (tag === "input" && ["button", "submit", "reset"].includes(type)) || field.getAttribute("role") === "button";
    const buttonText = textValue(field) || (tag === "input" ? (field.getAttribute("value") || "").trim() : "");
    const buttonHasVisibleName = buttonLike && !!buttonText;
    const source = explicit
      ? `label[for="${id}"]`
      : wrapped
        ? "label envolvente"
        : labelledBy
          ? `aria-labelledby: ${labelledByIds.join(" ")}`
          : ariaLabel
            ? `aria-label: ${ariaLabel}`
            : "";
    const hasLabel = !!(explicit || wrapped || labelledBy || ariaLabel || buttonHasVisibleName);
    const hasName = !!name;
    const title = hasName
      ? (labelText ? `Etiqueta: ${labelText}` : `Nombre accesible: ${name}`)
      : buttonHasVisibleName
        ? `Texto visible: ${buttonText}`
        : (id
          ? `Sin etiqueta (no se encontró label para el ID='${id}')`
          : "Sin etiqueta");
    const detail = [
      explicit ? `Etiqueta asociada: ${labelText || "sin texto"}` : "",
      wrapped ? `Etiqueta envolvente: ${labelText || "sin texto"}` : "",
      labelledBy ? `Etiqueta por aria-labelledby: ${labelledByIds.join(" ")}` : "",
      ariaLabel ? `Etiqueta ARIA: ${ariaLabel}` : "",
      buttonHasVisibleName ? `Texto visible del control: ${buttonText}` : "",
      source ? `Origen: ${source}` : "",
      hasName ? `Nombre accesible: ${name}` : "Sin nombre accesible"
    ].filter(Boolean).join(" · ");
    return { hasLabel, hasName, title, detail, labelText, name, explicit, wrapped, labelledByIds, ariaLabel };
  }

  function clearFormInlineNotes() {
    document.querySelectorAll("[data-apcf-form-inline-note='true']").forEach(note => {
      const prevBorder = note.dataset.apcfFormPrevBorder || "";
      const prevOutline = note.dataset.apcfFormPrevOutline || "";
      const targetId = note.dataset.apcfTargetId || "";
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        if (prevBorder) target.style.border = prevBorder;
        else target.style.removeProperty("border");
        if (prevOutline) target.style.outline = prevOutline;
        else target.style.removeProperty("outline");
        target.style.removeProperty("outline-offset");
      }
      note.remove();
    });
  }

  function annotateFormInline(field, message, severity = "warn") {
    if (!field) return null;
    const note = document.createElement("div");
    note.dataset.apcfFormInlineNote = "true";
    note.dataset.apcfTargetId = field.id || "";
    note.dataset.apcfFormPrevBorder = field.style.border || "";
    note.dataset.apcfFormPrevOutline = field.style.outline || "";
    note.style.marginTop = "5px";
    note.style.padding = "5px";
    note.style.borderRadius = "5px";
    note.style.fontSize = "14px";
    note.style.lineHeight = "1.35";
    note.style.whiteSpace = "pre-line";
    note.style.border = "1px solid transparent";
    note.style.backgroundColor = severity === "error" ? "#F9D7DA" : "#FFF1BF";
    note.style.color = severity === "error" ? "#721C23" : "#6A4E00";
    note.innerText = message;
    field.style.border = severity === "error" ? "2px solid red" : "2px solid #b88200";
    field.insertAdjacentElement("afterend", note);
    return note;
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
    const detail = options.detail ? `
${options.detail}` : "";
    const revealLabel = mark(el, `${label}${detail}`, severity);
    if (revealLabel && options.noLabel) revealLabel.dataset.apcfSubtle = "true";
    if (cleanup) window.setTimeout(cleanup, 1500);
  }

  function focusMarkedElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    const needsTempFocus = !el.matches("a,button,input,select,textarea,[tabindex],summary");
    let cleanup = null;
    if (needsTempFocus) {
      el.setAttribute("tabindex", "-1");
      cleanup = () => el.removeAttribute("tabindex");
    }
    try { el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" }); } catch (_error) {}
    try {
      el.focus({ preventScroll: true });
    } catch (_error) {
      try { el.focus(); } catch (_ignored) {}
    }
    if (cleanup) window.setTimeout(cleanup, 1500);
  }

  function focusablePageElements() {
    return pageElements("a[href],button,select,input:not([type='hidden']),textarea,summary,details,area,[tabindex],[contenteditable]:not([contenteditable='false'])")
      .filter(el => {
        const tabindex = el.getAttribute("tabindex");
        const disabled = el.matches("button:disabled,input:disabled,select:disabled,textarea:disabled,[disabled],[aria-disabled='true']");
        const rect = el.getBoundingClientRect();
        return tabindex !== "-1" && !disabled && rect.width > 0 && rect.height > 0;
      });
  }

  function hiddenStartElementIdentifier(el) {
    if (el.id) return `#${el.id}`;
    const href = el.getAttribute("href");
    if (href) return `${el.tagName.toLowerCase()}[href="${href.slice(0, 52)}"]`;
    const name = el.getAttribute("name");
    if (name) return `${el.tagName.toLowerCase()}[name="${name.slice(0, 52)}"]`;
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) return `[aria-label="${ariaLabel.slice(0, 52)}"]`;
    return cssPath(el) || el.tagName.toLowerCase();
  }

  function hiddenStartElementReason(el) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    if (style.display === "none") return "display:none";
    if (style.visibility === "hidden") return "visibility:hidden";
    if (style.opacity === "0") return "opacity:0";
    if (style.clip !== "auto" || style.clipPath !== "none") return "recortado visualmente";
    if (rect.width <= 1 || rect.height <= 1) return "sin caja visible";
    if (rect.right <= 0 || rect.bottom <= 0 || rect.left >= window.innerWidth || rect.top >= window.innerHeight) return "fuera de la ventana visible";
    if (style.position === "absolute" && (Number.parseFloat(style.left) < -20 || Number.parseFloat(style.top) < -20)) return "posicionado fuera de pantalla";
    return "";
  }

  function hiddenStartFocusableElements() {
    const selector = "a[href],button,select,input:not([type='hidden']),textarea,summary,details,area,[tabindex],[contenteditable]:not([contenteditable='false'])";
    const candidates = [...document.body.querySelectorAll(selector)]
      .filter(el => !el.closest(`#${PANEL_ID}, .${FLOATING}`))
      .filter(el => !el.matches("button:disabled,input:disabled,select:disabled,textarea:disabled,[disabled],[aria-disabled='true']"))
      .filter(el => el.getAttribute("tabindex") !== "-1")
      .slice(0, 40);
    return candidates
      .map(el => ({ el, reason: hiddenStartElementReason(el) }))
      .filter(item => item.reason);
  }

  function markHiddenStartElement(el, index) {
    const label = mark(el, hiddenStartElementIdentifier(el), "warn");
    if (!label) return null;
    label.dataset.apcfHiddenStartLabel = "true";
    label.dataset.apcfHiddenStartIndex = String(index);
    label.textContent = hiddenStartElementIdentifier(el);
    label.style.position = "fixed";
    label.style.zIndex = "2147483647";
    label.style.maxWidth = "min(34rem, calc(100vw - 2rem))";
    positionLabel(label);
    return label;
  }

  function tabOrderedPageElements() {
    const indexed = focusablePageElements().map((el, index) => {
      const tabindexAttr = el.getAttribute("tabindex");
      const tabindex = tabindexAttr == null || tabindexAttr === "" ? 0 : Number(tabindexAttr);
      return { el, index, tabindex: Number.isFinite(tabindex) ? tabindex : 0 };
    });
    return [
      ...indexed.filter(item => item.tabindex > 0).sort((a, b) => a.tabindex - b.tabindex || a.index - b.index),
      ...indexed.filter(item => item.tabindex <= 0).sort((a, b) => a.index - b.index)
    ].map(item => item.el);
  }

  function drawFocusOrderRoute(elements) {
    document.getElementById(FOCUS_ORDER_ROUTE_ID)?.remove();
    const points = elements.map(el => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: window.scrollX + rect.left + rect.width / 2,
        y: window.scrollY + rect.top + rect.height / 2
      };
    }).filter(Boolean);
    if (points.length < 2) return;
    const width = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = FOCUS_ORDER_ROUTE_ID;
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    svg.style.left = "0";
    svg.style.top = "0";
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "2147483645";
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", points.map(point => `${point.x},${point.y}`).join(" "));
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("stroke", "#f7bd3d");
    polyline.setAttribute("stroke-width", "4");
    polyline.setAttribute("stroke-linecap", "round");
    polyline.setAttribute("stroke-linejoin", "round");
    polyline.setAttribute("stroke-dasharray", "10 7");
    polyline.setAttribute("opacity", ".96");
    svg.appendChild(polyline);
    document.body.appendChild(svg);
  }

  function focusOrderElementId(el) {
    if (el.id) return `#${el.id}`;
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) return `[aria-label="${ariaLabel.slice(0, 40)}"]`;
    const name = el.getAttribute("name");
    if (name) return `${el.tagName.toLowerCase()}[name="${name.slice(0, 40)}"]`;
    return cssPath(el) || el.tagName.toLowerCase();
  }

  function focusOrderElementLabel(el) {
    return accessibleName(el) || el.getAttribute("title") || textValue(el) || el.getAttribute("href") || el.tagName.toLowerCase();
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
    const focusProperties = [
      "outline",
      "outline-color",
      "outline-style",
      "outline-width",
      "outline-offset",
      "box-shadow",
      "border",
      "border-top-color",
      "border-right-color",
      "border-bottom-color",
      "border-left-color",
      "border-top-style",
      "border-right-style",
      "border-bottom-style",
      "border-left-style",
      "border-top-width",
      "border-right-width",
      "border-bottom-width",
      "border-left-width",
      "background-color",
      "color",
      "text-decoration",
      "text-decoration-color",
      "text-decoration-line",
      "text-decoration-style",
      "text-decoration-thickness",
      "text-underline-offset",
      "filter"
    ];
    const focusStyleSnapshot = styles => {
      const snapshot = new Map();
      focusProperties.forEach(property => {
        snapshot.set(property, {
          value: styles.getPropertyValue(property),
          priority: styles.getPropertyPriority(property)
        });
      });
      return snapshot;
    };
    const changedFocusProperties = (before, after) => focusProperties.filter(property => (
      before.get(property)?.value !== after.get(property)?.value
    ));
    const splitSelectors = selectorText => {
      const selectors = [];
      let current = "";
      let depth = 0;
      for (const char of selectorText) {
        if (char === "(") depth += 1;
        if (char === ")") depth = Math.max(0, depth - 1);
        if (char === "," && depth === 0) {
          selectors.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      if (current.trim()) selectors.push(current.trim());
      return selectors;
    };
    const selectorMatchesFocusedElement = (selector, el) => {
      if (!/:focus(?:-visible)?\b/.test(selector) || selector.includes("::") || /:not\([^)]*:focus/.test(selector)) return false;
      const unfocusedSelector = selector
        .replace(/:focus-visible\b/g, "")
        .replace(/:focus\b/g, "")
        .trim();
      try {
        return !!unfocusedSelector && el.matches(unfocusedSelector);
      } catch (_error) {
        return false;
      }
    };
    const collectFocusCssStyles = el => {
      const collected = new Map();
      const visitRules = rules => {
        [...rules].forEach(rule => {
          if (rule.cssRules) {
            try { visitRules(rule.cssRules); } catch (_error) {}
            return;
          }
          if (!(rule instanceof CSSStyleRule) || !/:focus(?:-visible)?\b/.test(rule.selectorText)) return;
          const matches = splitSelectors(rule.selectorText).some(selector => selectorMatchesFocusedElement(selector, el));
          if (!matches) return;
          focusProperties.forEach(property => {
            const value = rule.style.getPropertyValue(property);
            if (value) {
              collected.set(property, {
                value,
                priority: rule.style.getPropertyPriority(property)
              });
            }
          });
        });
      };
      [...document.styleSheets].forEach(sheet => {
        try { visitRules(sheet.cssRules); } catch (_error) {}
      });
      return collected;
    };
    const hasVisibleFocusIndicator = styles => {
      const get = property => styles.get(property)?.value || "";
      const outline = get("outline");
      const outlineWidth = Number.parseFloat(get("outline-width")) || 0;
      const outlineVisible = (outline && outline !== "none") || (get("outline-style") !== "none" && outlineWidth > 0);
      const boxShadow = get("box-shadow");
      const boxShadowVisible = boxShadow && boxShadow !== "none";
      const border = get("border");
      const borderShorthandVisible = border && border !== "none" && !/^0(?:px)?\b/.test(border);
      const borderVisible = ["top", "right", "bottom", "left"].some(side => (
        get(`border-${side}-style`) !== "none" &&
        (Number.parseFloat(get(`border-${side}-width`)) || 0) > 0
      ));
      const textDecoration = get("text-decoration");
      const textDecorationVisible = (textDecoration && textDecoration !== "none") || get("text-decoration-line") !== "none";
      return outlineVisible || boxShadowVisible || borderShorthandVisible || borderVisible || textDecorationVisible;
    };
    let visibleCount = 0;
    elements.forEach(el => {
      el.setAttribute("data-apcf-focus-style", el.getAttribute("style") || "");
      el.style.transition = "none";
      const before = focusStyleSnapshot(getComputedStyle(el));
      try { el.focus({ preventScroll: true }); } catch (_error) { try { el.focus(); } catch (_ignored) {} }
      const after = focusStyleSnapshot(getComputedStyle(el));
      const changed = changedFocusProperties(before, after);
      const cssFocusStyles = collectFocusCssStyles(el);
      const cssProperties = [...cssFocusStyles.keys()];
      const propertiesToApply = changed.length && hasVisibleFocusIndicator(after) ? changed : cssProperties;
      const styleSource = changed.length && hasVisibleFocusIndicator(after) ? after : cssFocusStyles;
      if (propertiesToApply.length && hasVisibleFocusIndicator(styleSource)) {
        visibleCount += 1;
        propertiesToApply.forEach(property => {
          const styleValue = styleSource.get(property);
          if (!styleValue) return;
          el.style.setProperty(property, styleValue.value, styleValue.priority);
        });
      }
    });
    if (previousActive && document.contains(previousActive)) {
      try { previousActive.focus({ preventScroll: true }); } catch (_error) { try { previousActive.focus(); } catch (_ignored) {} }
    }
    return { total: elements.length, visible: visibleCount };
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
      renderFloatingSummary(id, summary.title, summary.summary, summary.summaryDetail, summary.summaryResult, summary.summaryResultMarkup || "");
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
    const buttonLike = el.matches("button,[role='button']") || (el.matches("input") && ["button", "submit", "reset"].includes((el.getAttribute("type") || "").toLowerCase()));
    const buttonText = buttonLike ? (text || (el.matches("input") ? (el.getAttribute("value") || "").trim() : "")) : "";
    const title = el.getAttribute("title");
    const imgAlt = [...el.querySelectorAll("img[alt]")].map(img => img.getAttribute("alt").trim()).filter(Boolean).join(" ");
    return ariaLabel || labelled || formLabel || buttonText || text || imgAlt || title || "";
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
    return state.pageSourceHtml || document.documentElement.outerHTML || "";
  }

  async function loadPageSourceHtml() {
    try {
      const response = await fetch(location.href, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) return "";
      return await response.text();
    } catch (_error) {
      return "";
    }
  }

  function collectIframeSrcsFromHtml(html) {
    const srcs = [];
    if (!html) return srcs;
    const regex = /<iframe\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
    let match;
    while ((match = regex.exec(html))) {
      const src = match[1] || match[2] || match[3] || "";
      if (src) srcs.push(src);
    }
    return srcs;
  }

  function decodeHtmlEntities(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value || "";
    return textarea.value;
  }

  function htmlContainsMedia(html, selector, baseUrl = location.href, depth = 0, visited = new Set()) {
    if (!html || depth > 3) return false;
    const mediaRegex = selector === "video" ? /<(video|video-cover)\b/i : /<audio\b/i;
    const looseRegex = selector === "video" ? /<(video|video-cover)(?:\s|>|$)/i : /<audio(?:\s|>|$)/i;
    if (mediaRegex.test(html) || looseRegex.test(html)) return true;

    const srcdocRegex = /srcdoc\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    let srcdocMatch;
    while ((srcdocMatch = srcdocRegex.exec(html))) {
      const decoded = decodeHtmlEntities(srcdocMatch[1] || srcdocMatch[2] || "");
      if (decoded && mediaRegex.test(decoded)) return true;
    }

    const iframeSrcs = collectIframeSrcsFromHtml(html);
    for (const src of iframeSrcs) {
      let abs;
      try {
        abs = new URL(src, baseUrl).href;
      } catch (_error) {
        continue;
      }
      if (new URL(abs).origin !== location.origin) continue;
      if (visited.has(abs)) continue;
      visited.add(abs);
      const cached = state.mediaSourceHtmlCache.get(abs);
      if (cached && htmlContainsMedia(cached, selector, abs, depth + 1, visited)) return true;
    }

    return false;
  }

  async function prefetchIframeSourceHtml(html = "", depth = 0, baseUrl = location.href, visited = new Set()) {
    if (depth > 3) return;
    const sourceHtml = html || htmlSourceText();
    if (!sourceHtml) return;
    const iframeSrcs = new Set();

    if (depth === 0) {
      pageElements("iframe").forEach(iframe => {
        const srcdoc = iframe.getAttribute ? (iframe.getAttribute("srcdoc") || "") : "";
        if (srcdoc) {
          const htmlKey = `srcdoc:${srcdoc.slice(0, 160)}`;
          if (!state.mediaSourceHtmlCache.has(htmlKey)) state.mediaSourceHtmlCache.set(htmlKey, srcdoc);
        }
        const src = iframe.getAttribute ? (iframe.getAttribute("src") || "") : "";
        if (src) iframeSrcs.add(src);
      });
    }

    collectIframeSrcsFromHtml(sourceHtml).forEach(src => iframeSrcs.add(src));

    const tasks = [...iframeSrcs].map(async src => {
      let abs;
      try {
        abs = new URL(src, baseUrl).href;
      } catch (_error) {
        return;
      }
      if (new URL(abs).origin !== location.origin) return;
      if (visited.has(abs)) return;
      if (state.mediaSourcePending.has(abs) || state.mediaSourceHtmlCache.has(abs)) return;
      state.mediaSourcePending.add(abs);
      try {
        const response = await fetch(abs, { credentials: "same-origin", cache: "no-store" });
        if (!response.ok) return;
        const childHtml = await response.text();
        if (!childHtml) return;
        state.mediaSourceHtmlCache.set(abs, childHtml);
        await prefetchIframeSourceHtml(childHtml, depth + 1, abs, new Set([...visited, abs]));
      } catch (_error) {
        /* ignore */
      } finally {
        state.mediaSourcePending.delete(abs);
      }
    });
    await Promise.allSettled(tasks);
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

  function audioFileLink(href) {
    return /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba|mid|midi)(?:[?#]|$)/i.test(href || "");
  }

  function iframeHasMedia(iframe, selector) {
    try {
      const srcdoc = iframe.getAttribute ? (iframe.getAttribute("srcdoc") || "") : "";
      if (srcdoc && htmlContainsMedia(decodeHtmlEntities(srcdoc), selector, location.href)) return true;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        const docHtml = doc.documentElement?.outerHTML || "";
        if (htmlContainsMedia(docHtml, selector, iframe.src || location.href)) return true;
        if (doc.querySelector(selector)) return true;
      }
      const src = iframe.getAttribute ? (iframe.getAttribute("src") || "") : "";
      if (src) {
        const abs = new URL(src, location.href).href;
        const cached = state.mediaSourceHtmlCache.get(abs);
        if (cached && htmlContainsMedia(cached, selector, abs)) return true;
      }
      return false;
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
    const findings = [];
    const seenTargets = new Set();
    const MARK = "data-a11y-video-detected";
    const STYLE_ID = "a11y-video-detector-style";
    const videoHosts = /youtube|youtu\.be|youtube-nocookie|vimeo|wistia|brightcove|kaltura|panopto|dailymotion|twitch|streamable|vidyard|jwplayer|sproutvideo|cloudflarestream|mux|livestream|zoom|webinar|player/i;
    const videoWords = /video|vídeo|media|player|reproductor|webinar|recording|grabaci[oó]n|youtube|vimeo|wistia/i;
    const embedClasses = /video|embed|iframe|player|media|responsive|wp-block-embed|oembed|ratio|aspect/i;
    function ensureVideoStyle(doc = document) {
      if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
      const style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `[${MARK}]{outline:2px solid #ECB63A!important;outline-offset:0!important;box-shadow:inset 0 0 0 2px #171717!important;background-color:rgba(236,182,58,.18)!important;border-radius:.25rem!important}`;
      doc.head.appendChild(style);
    }

    function txt(el) {
      return [
        el.getAttribute && el.getAttribute("src") || el.src || "",
        el.getAttribute && el.getAttribute("data-src") || "",
        el.getAttribute && el.getAttribute("data-lazy-src") || "",
        el.title || "",
        el.name || "",
        el.id || "",
        el.className || "",
        el.getAttribute && el.getAttribute("aria-label") || "",
        el.getAttribute && el.getAttribute("allow") || ""
      ].join(" ");
    }

    function usefulContainer(el) {
      return el.closest("figure,.wp-block-embed,.wp-block-video,.video,.video-container,.video-wrapper,.embed,.embed-container,.responsive-embed,.media,.player,.ratio,[class*='video'],[class*='embed'],[class*='player']") || null;
    }

    function videoLabelFor(kind) {
      if (kind === "video") return "VIDEO detectado";
      if (kind === "iframe") return "IFRAME con contenido de vídeo";
      if (kind === "container") return "Contenedor de vídeo";
      if (kind === "embed") return "Contenido multimedia embebido";
      return "Vídeo detectado";
    }

    function addFinding(target, kind, insertion, problems, severity = "warn", extra = {}) {
      if (!target || target.nodeType !== Node.ELEMENT_NODE || seenTargets.has(target)) return;
      seenTargets.add(target);
      const baseHtml = target.ownerDocument === document ? html : (target.ownerDocument?.documentElement?.outerHTML || "");
      const raw = target.outerHTML || "";
      const index = baseHtml ? baseHtml.indexOf(raw) : -1;
      const line = index >= 0 ? sourceLineNumber(baseHtml, index) : "";
      const fragment = extra.fragment || (index >= 0 ? sourceFragment(baseHtml, index, Math.min(raw.length + 80, 260)) : raw.replace(/\s+/g, " ").trim());
      findings.push({
        kind,
        file: extra.file || file,
        line,
        fragment,
        insertion,
        element: target,
        target,
        src: target.getAttribute ? (target.getAttribute("src") || "") : "",
        poster: target.getAttribute ? (target.getAttribute("poster") || "") : "",
        severity,
        problems,
        label: extra.label || videoLabelFor(kind)
      });
    }

    function markVisual(el, kind, label) {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
      const doc = el.ownerDocument || document;
      ensureVideoStyle(doc);
      if (el.hasAttribute(MARK)) return;
      el.setAttribute(MARK, kind);
      el.setAttribute("data-a11y-video-detector-label", label);
      const existingTitle = el.getAttribute("title") || "";
      el.setAttribute("title", existingTitle ? `${existingTitle} | ${label}` : label);
    }

    function likelyVideoIframe(f) {
      const t = txt(f);
      if (videoHosts.test(t) || videoWords.test(t)) return true;
      if ((f.allowFullscreen || /fullscreen|picture-in-picture|autoplay/.test(t)) && embedClasses.test(t)) return true;
      const p = f.closest("figure,article,section,div");
      if (p && videoWords.test([p.id, p.className, p.getAttribute("aria-label") || "", p.getAttribute("role") || ""].join(" "))) return true;
      return false;
    }

    function scanRoot(root, ownerFrame = null, depth = 0) {
      if (!root || depth > 3) return 0;
      ensureVideoStyle(root.ownerDocument || document);
      let count = 0;

      root.querySelectorAll("video,video-cover").forEach(video => {
        count += 1;
        markVisual(video, "video", "VIDEO detectado");
        const c = usefulContainer(video);
        if (c && c !== video) markVisual(c, "container", "Contenedor de VIDEO");
        addFinding(video, "video", "Etiqueta <video> detectada en la página", "El contenido no se ha movido: solo se ha aplicado outline/sombra visual.", video.hasAttribute("controls") ? "warn" : "error");
        if (video.hasAttribute("poster")) {
          const poster = video.getAttribute("poster") || "";
          addFinding(video, "poster", "Atributo poster en <video>", `Poster: ${poster}. No sustituye subtítulos ni transcripción.`, "warn", { label: "Poster detectado" });
        }
        video.querySelectorAll("source").forEach(source => {
          addFinding(source, "source", "Hijo <source> de <video>", "Comprueba formato, controles y subtítulos.", "warn", { label: "Fuente de vídeo" });
        });
        video.querySelectorAll("track").forEach(track => {
          addFinding(track, "track", "Hijo <track> de <video>", `Pista <track> tipo ${track.getAttribute("kind") || "desconocido"}.`, track.getAttribute("kind") === "captions" || track.getAttribute("kind") === "subtitles" ? "ok" : "warn", { label: "Pista de vídeo" });
        });
      });

      root.querySelectorAll("iframe").forEach(frame => {
        let innerCount = 0;
        try {
          const doc = frame.contentDocument || frame.contentWindow?.document;
          if (doc) {
            const innerHtml = doc.documentElement?.outerHTML || "";
            if (/<(video|video-cover)\b/i.test(innerHtml)) {
              innerCount = doc.querySelectorAll("video,video-cover").length || 1;
              scanRoot(doc, frame, depth + 1);
            }
          }
        } catch (_error) {
          innerCount = 0;
        }
        if (!innerCount && iframeHasMedia(frame, "video")) innerCount = 1;
        const providerIframe = innerCount === 0 && likelyVideoIframe(frame);
        if (innerCount > 0 || providerIframe) {
          count += 1;
          markVisual(frame, "iframe", innerCount > 0 ? "IFRAME con contenido de vídeo" : "IFRAME de reproductor de vídeo");
          const container = usefulContainer(frame);
          if (container && container !== frame) markVisual(container, "container", "Contenedor de vídeo embebido");
          addFinding(
            frame,
            "iframe",
            innerCount > 0 ? "iframe con contenido de vídeo" : "iframe de reproductor de vídeo",
            innerCount > 0 ? "Vídeo detectado dentro del iframe." : "Reproductor de vídeo detectado por la URL o atributos del iframe.",
            "warn",
            { label: innerCount > 0 ? "IFRAME con contenido de vídeo" : "IFRAME de reproductor de vídeo" }
          );
        }
      });

      root.querySelectorAll("object,embed").forEach(el => {
        const t = txt(el);
        if (!videoHosts.test(t) && !videoWords.test(t)) return;
        count += 1;
        markVisual(el, "embed", "Contenido multimedia embebido");
        const c = usefulContainer(el);
        if (c && c !== el) markVisual(c, "container", "Contenedor multimedia");
        addFinding(el, el.tagName.toLowerCase(), "Contenido multimedia embebido", "El contenido no se ha movido: solo se ha aplicado outline/sombra visual.", "warn", { label: "Contenido multimedia embebido" });
      });

      return count;
    }

    scanRoot(document);
    return findings;
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
    if (/<(video|video-cover)(?:\s|>|$)/i.test(raw)) return true;
    if (html && /<(video|video-cover)(?:\s|>|$)/i.test(html) && html.indexOf(raw) >= 0) return true;
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
    const MARK = "data-a11y-audio-detected";
    const STYLE_ID = "a11y-audio-detector-style";
    const audioExt = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba)(\?|#|$)/i;
    const audioHosts = /soundcloud|spotify|ivoox|mixcloud|spreaker|podbean|buzzsprout|libsyn|simplecast|audioboom|anchor\.fm|podcasters\.spotify|podcasts\.apple|apple\.com\/.*podcast|player\.fm|radiopublic|castbox|podomatic|deezer|amazon\.com\/music|music\.amazon|tunein|radio|radioplayer|shoutcast|icecast/i;

    function ensureAudioStyle(doc = document) {
      if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;
      const style = doc.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `[${MARK}]{outline:4px solid #ECB63A!important;outline-offset:-4px!important;box-shadow:inset 0 0 0 4px #171717!important;background-color:rgba(236,182,58,.18)!important;border-radius:.25rem!important}`;
      doc.head.appendChild(style);
    }

    function mark(el, type, label) {
      if (!el || el.nodeType !== 1 || el.hasAttribute(MARK)) return;
      el.setAttribute(MARK, type);
      el.setAttribute("data-a11y-audio-label", label);
      el.title = el.title ? `${el.title} | ${label}` : label;
    }

    function textOf(el) {
      return [
        (el.src || ""),
        (el.href || ""),
        (el.data || ""),
        (el.getAttribute("src") || ""),
        (el.getAttribute("href") || ""),
        (el.getAttribute("data") || ""),
        (el.getAttribute("data-src") || ""),
        (el.getAttribute("data-lazy-src") || ""),
        (el.getAttribute("title") || ""),
        (el.getAttribute("aria-label") || ""),
        (el.getAttribute("name") || ""),
        (el.getAttribute("property") || ""),
        (el.getAttribute("content") || ""),
        (el.getAttribute("type") || ""),
        typeof el.className === "string" ? el.className : "",
        el.id || ""
      ].join(" ");
    }

    function closestVisibleArea(el) {
      return el.closest("main,[role='main'],article,section,figure,.audio,.podcast,.player,.soundcloud,.spotify,.ivoox,.mixcloud,[class*='audio'],[class*='podcast'],[class*='player'],[class*='soundcloud'],[class*='spotify'],[class*='ivoox'],[class*='mixcloud']") || document.body;
    }

    function isAudioIframe(f) {
      const t = textOf(f);
      return audioHosts.test(t) || audioExt.test(t);
    }

    function pushRow(item) {
      const key = `${item.kind}|${item.line}|${item.fragment}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(item);
    }

    function buildRow(el, kind, insertion, problems, severity = "warn", extra = {}) {
      const raw = el.outerHTML || "";
      const info = sourceInfoForElement(el, html);
      const index = html.indexOf(raw);
      const fragment = extra.fragment || (index >= 0 ? sourceFragment(html, index, Math.min(raw.length + 80, 260)) : raw.replace(/\s+/g, " ").trim());
      const item = {
        kind,
        file,
        line: extra.line || info.line,
        fragment,
        insertion,
        element: el,
        target: extra.target || el,
        src: el.getAttribute ? (el.getAttribute("src") || "") : "",
        type: el.getAttribute ? (el.getAttribute("type") || "") : "",
        provider: extra.provider || "",
        hasControls: el.hasAttribute ? el.hasAttribute("controls") : false,
        hasAutoplay: el.hasAttribute ? el.hasAttribute("autoplay") : false,
        hasMuted: el.hasAttribute ? el.hasAttribute("muted") : false,
        hasLoop: el.hasAttribute ? el.hasAttribute("loop") : false,
        hasPreload: el.hasAttribute ? el.hasAttribute("preload") : false,
        preload: el.getAttribute ? (el.getAttribute("preload") || "") : "",
        hasCrossorigin: el.hasAttribute ? el.hasAttribute("crossorigin") : false,
        crossorigin: el.getAttribute ? (el.getAttribute("crossorigin") || "") : "",
        hasLabel: !!(el.getAttribute && (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title"))),
        severity,
        problems,
        label: extra.label || "Audio detectado",
        rawFallback: !!extra.rawFallback
      };
      pushRow(item);
      return item;
    }

    function scanMeta(root) {
      root.querySelectorAll('meta[property="og:audio"],meta[property="og:audio:url"],meta[property="og:audio:secure_url"]').forEach(m => {
        const target = closestVisibleArea(m);
        buildRow(target, "meta", "Metadato og:audio detectado", "Metadato og:audio detectado. Comprueba controles, formato y alternativa textual.", "warn", {
          label: "Metadato de audio detectado",
          target,
          fragment: (m.outerHTML || "").replace(/\s+/g, " ").trim()
        });
      });
      root.querySelectorAll('meta[property="og:type"]').forEach(m => {
        const c = m.getAttribute("content") || "";
        if (/music|audio|podcast|song|album|radio/i.test(c)) {
          const target = closestVisibleArea(m);
          buildRow(target, "meta", "Metadato og:type de audio/música detectado", "Metadato og:type de audio/música detectado. Comprueba controles, formato y alternativa textual.", "warn", {
            label: "Metadato de audio detectado",
            target,
            fragment: (m.outerHTML || "").replace(/\s+/g, " ").trim()
          });
        }
      });
    }

    function scanJsonLd(root) {
      root.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
        const raw = s.textContent || "";
        if (/"@type"\s*:\s*"?AudioObject"?/i.test(raw) || /"@type"\s*:\s*"?PodcastEpisode"?/i.test(raw) || /"@type"\s*:\s*"?MusicRecording"?/i.test(raw) || /"@type"\s*:\s*"?MusicAlbum"?/i.test(raw) || /"@type"\s*:\s*"?RadioEpisode"?/i.test(raw) || /"contentUrl"\s*:\s*"[^"]+\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|weba)/i.test(raw)) {
          const target = closestVisibleArea(s);
          buildRow(target, "jsonld", "JSON-LD con objeto de audio detectado", "JSON-LD con audio detectado. Comprueba name, description, contentUrl, embedUrl y transcript.", "warn", {
            label: "JSON-LD de audio detectado",
            target,
            fragment: (s.outerHTML || "").replace(/\s+/g, " ").trim()
          });
        }
      });
    }

    function scan(root, depth = 0) {
      if (!root || depth > 3) return;
      ensureAudioStyle(root.ownerDocument || document);

      root.querySelectorAll("audio").forEach(a => {
        mark(a, "audio", "Etiqueta <audio> detectada");
        buildRow(a, "audio", "Etiqueta <audio> detectada", "Etiqueta <audio> detectada. Comprueba controles, formato y alternativa textual.", a.hasAttribute("controls") ? "warn" : "error", {
          label: "Etiqueta <audio> detectada"
        });
      });

      root.querySelectorAll("audio source,source").forEach(s => {
        const src = s.getAttribute("src") || "";
        const type = s.getAttribute("type") || "";
        if (!audioExt.test(src) && !/^audio\//i.test(type)) return;
        const target = s.closest("audio") || s;
        mark(target, "source", "Fuente de audio detectada");
        buildRow(target, s.closest("audio") ? "source" : "audio", s.closest("audio") ? "Hijo <source> de <audio>" : "Posible <source> de audio", s.closest("audio") ? "Fuente de audio detectada. Comprueba formato, controles y alternativa textual." : "Elemento <source> que apunta a audio. Comprueba que pertenezca a un reproductor de audio.", s.closest("audio") ? "warn" : "error", {
          label: "Fuente de audio detectada",
          target
        });
      });

      root.querySelectorAll("a[href]").forEach(a => {
        const href = a.getAttribute("href") || "";
        if (!audioExt.test(href)) return;
        mark(a, "link", "Enlace a audio detectado");
        buildRow(a, "link", "Enlace a archivo de audio detectado", "Enlace directo a audio. Comprueba texto descriptivo, formato de archivo y alternativa textual.", "warn", {
          label: "Enlace a audio detectado"
        });
      });

      root.querySelectorAll("iframe[src],iframe[data-src],iframe[data-lazy-src]").forEach(f => {
        let foundInside = false;
        try {
          const d = f.contentDocument || f.contentWindow.document;
          if (d) {
            const before = rows.length;
            scan(d, depth + 1);
            foundInside = rows.length > before;
          }
        } catch (_e) {}
        if (foundInside || isAudioIframe(f)) {
          const provider = isAudioIframe(f) ? (textOf(f).match(audioHosts) || [""])[0] : "";
          mark(f, "iframe", "Iframe con audio detectado");
          buildRow(f, "iframe", "Iframe con contenido de audio detectado", "Audio incrustado en iframe. Comprueba título accesible, controles y transcripción.", "warn", {
            label: "Iframe con audio detectado",
            provider
          });
        }
      });

      root.querySelectorAll("embed[src]").forEach(e => {
        const t = textOf(e);
        if (!audioExt.test(t) && !audioHosts.test(t) && !/^audio\//i.test(e.getAttribute("type") || "")) return;
        mark(e, "embed", "Embed de audio detectado");
        buildRow(e, "embed", "Elemento <embed> de audio detectado", "Audio incrustado con embed. Comprueba título accesible, controles y alternativa textual.", "warn", {
          label: "Embed de audio detectado"
        });
      });

      root.querySelectorAll("object[data]").forEach(o => {
        const t = textOf(o);
        if (!audioExt.test(t) && !audioHosts.test(t) && !/^audio\//i.test(o.getAttribute("type") || "")) return;
        mark(o, "object", "Object de audio detectado");
        buildRow(o, "object", "Elemento <object> de audio detectado", "Audio incrustado con object. Comprueba alternativa accesible, título y controles.", "warn", {
          label: "Object de audio detectado"
        });
      });

      scanMeta(root);
      scanJsonLd(root);
    }

    scan(document);
    if (!rows.some(item => item.rawFallback) && /<audio/i.test(html)) {
      const regex = /<audio/gi;
      let match;
      while ((match = regex.exec(html))) {
        const index = match.index;
        const endTag = html.indexOf('>', index);
        const end = endTag === -1 ? Math.min(html.length, index + 220) : Math.min(html.length, endTag + 1);
        const fragment = html.slice(index, end).replace(/\s+/g, ' ').trim();
        const snippet = fragment || '<audio';
        const item = {
          kind: 'audio',
          file,
          line: sourceLineNumber(html, index),
          fragment: sourceFragment(html, index, Math.min(snippet.length + 60, 240)) || snippet,
          insertion: 'Etiqueta <audio> detectada en el HTML fuente bruto',
          element: null,
          target: null,
          src: '',
          type: '',
          provider: '',
          hasControls: /controls/i.test(fragment),
          hasAutoplay: /autoplay/i.test(fragment),
          hasMuted: /muted/i.test(fragment),
          hasLoop: /loop/i.test(fragment),
          hasPreload: /preload/i.test(fragment),
          preload: '',
          hasCrossorigin: /crossorigin/i.test(fragment),
          crossorigin: '',
          hasLabel: false,
          severity: /controls/i.test(fragment) ? 'warn' : 'error',
          problems: 'Etiqueta <audio> detectada en el HTML fuente bruto. Comprueba controles, formato y alternativa textual.',
          label: 'Audio detectado en HTML bruto',
          rawFallback: true
        };
        const key = `${item.kind}|${item.line}|${item.fragment}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(item);
      }
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
            if (state.imagesVisible) annotateImageAlt(img, "Sin texto alternativo");
            return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}" data-apcf-severity="error"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>${index + 1}</strong><span>Sin atributo alt</span><span>La imagen no tiene atributo alt.</span></button>`;
          }
          if (alt.trim() === "") {
            issues += 1;
            if (state.imagesVisible) annotateImageAlt(img, "Alt vacío");
            return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}" data-apcf-severity="warn"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>${index + 1}</strong><span>Alt vacío</span><span>Comprobar si es una imagen decorativa o no.</span></button>`;
          }
          if (state.imagesVisible) annotateImageAlt(img, alt);
          return `<button class="apcf-media-item" type="button" data-apcf-show-image="${index}" data-apcf-severity="ok"><span class="apcf-mini-button" aria-hidden="true">Ver</span><strong>${index + 1}</strong><span>${escapeHtml(alt.slice(0, 140))}</span><span>Observar si el texto alternativo corresponde a la imagen que se muestra.</span></button>`;
        });
        const box = floating("Texto alternativo de imágenes", `
          <p class="apcf-explain">Revisa el texto alternativo de cada imagen.
Comprueba que se ajusta a la información visual que transmite.</p>
          <p class="apcf-result">${escapeHtml(`${imgs.length} imagen(es) visibles.`)}</p>
          ${rows.length ? listHead("apcf-list-head--image", ["Ver", "Id", "Texto alternativo", "Observación"]) : ""}
          <div class="apcf-media-list">${rows.length ? rows.join("") : "<p>No hay imagenes visibles.</p>"}</div>
        `, { summary: "Texto alternativo de imágenes", summaryDetail: "Revisa el texto alternativo de cada imagen.\nComprueba que se ajusta a la información visual que transmite.", summaryResult: missingAlt ? `${imgs.length} imagen(es) visibles. ${missingAlt} sin atributo alt.` : `${imgs.length} imagen(es) visibles.`, summaryResultMarkup: missingAlt ? `${escapeHtml(`${imgs.length} imagen(es) visibles.`)} <span class="apcf-summary-alert-inline apcf-summary-alert-block">${escapeHtml(`${missingAlt} sin atributo alt.`)}</span>` : "" });
        if (state.imagesVisible && imgs[0]) focusMarkedElement(imgs[0]);
        box.querySelectorAll("[data-apcf-show-image]").forEach(button => {
          button.addEventListener("click", () => {
            const img = imgs[Number(button.dataset.apcfShowImage)];
            if (!img) return;
            const alt = img.getAttribute("alt");
            if (alt !== null && alt.trim() === "") {
              revealElement(img, "Alt vacío", "warn", { detail: "Comprobar si es una imagen decorativa o no.", noLabel: true });
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
            ), { summary: "Título de la página", summaryDetail: pageTitleExplain, summaryResult: pageTitleResult, summarySeverity: issue ? "error" : "" });
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
          <div class="apcf-landmark-panel">
            <div class="apcf-landmark-info">
              <p class="apcf-explain">Comprueba la jerarquía de los encabezados. H1 es el principal y los demás cuelgan de él.</p>
              ${headingsStatus}
            </div>
            <div class="apcf-heading-table">
              ${headings.length ? listHead("apcf-list-head--heading", ["Nivel", "Texto"]) : ""}
              <ul class="apcf-tree">${items || "<li>No se encontraron encabezados.</li>"}</ul>
            </div>
          </div>
        `, {
          summary: "Encabezados",
          summaryDetail: "Comprueba la jerarquía de los encabezados.",
          summaryResult: headings.length ? `${headings.length} encabezado(s) visibles. H1 encontrados: ${h1Count}. Saltos de jerarquía: ${hierarchySkips}.` : "No se encontraron encabezados.",
          summarySeverity: h1Problem || hierarchyProblem ? "error" : ""
        });
        if (state.headingsVisible && headings[0]) focusMarkedElement(headings[0]);
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
          <div class="apcf-landmark-panel">
            <div class="apcf-landmark-info">
              <p class="apcf-explain">Comprueba que las zonas estructuran la página y que cada una se comprende por su tipo, etiqueta y título.</p>
              ${mainError}
              ${landmarks.length ? (!mainProblem ? `<p class="apcf-result">${escapeHtml(`${landmarks.length} puntos marcados. Main encontrados: ${mainCount}.`)}</p>` : "") : problemResult("Problema: no se encontró ningún punto de referencia.")}
            </div>
            ${landmarks.length ? `<div class="apcf-landmark-table">${listHead("apcf-list-head--landmark", ["Tipo", "Etiqueta", "Título"])}<div class="apcf-landmark-map"><div class="apcf-landmark-tree">${boxes || "<p>No se encontraron puntos de referencia.</p>"}</div></div></div>` : ""}
          </div>
        `, { summary: "Puntos de referencia", summaryDetail: "Comprueba que las zonas estructuran la página y que cada una se comprende por su tipo, etiqueta y título.", summaryResult: landmarks.length ? `${landmarks.length} punto(s) de referencia. Main encontrados: ${mainCount}.` : "No se encontraron puntos de referencia.", summaryResultMarkup: landmarks.length ? ((mainCount === 0 || mainCount > 1) ? `${escapeHtml(`${landmarks.length} punto(s) de referencia.`)} <span class="apcf-summary-alert-inline apcf-summary-alert-block">${escapeHtml(`Main encontrados: ${mainCount}.`)}</span>` : escapeHtml(`${landmarks.length} punto(s) de referencia. Main encontrados: ${mainCount}.`)) : "", summarySeverity: landmarks.length === 0 ? "error" : "" });
        if (state.landmarksVisible && landmarks[0]) focusMarkedElement(landmarks[0]);
        if (landmarks[0]) focusMarkedElement(landmarks[0]);
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
          const genericReason = genericLinkTextReason(visibleText) || genericLinkTextReason(name);
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
          } else if (genericReason) {
            severity = "error";
            note = genericReason;
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
          <p class="apcf-explain">Revisa si el nombre accesible se comprende.<br>El texto visible es la información que se muestra pantalla.<br>Cuando no hay texto visible, puede ser un icono.</p>
          ${linkProblem ? problemResult(`Error: ${issues} enlace(s) con texto o nombre accesible poco descriptivo.`) : ""}
          <p class="apcf-result">${escapeHtml(issues ? `${issues} enlace(s) con texto o nombre accesible poco descriptivo.` : "No se detectaron enlaces con texto visible o nombre accesible poco descriptivo.")}</p>
          ${rows ? listHead("apcf-list-head--link", ["Ver", "Id", "Texto visible", "Nombre accesible", "Estado"]) : ""}
          <div class="apcf-media-list">${rows || "<p>No se encontraron enlaces.</p>"}</div>
        `, { summary: "Texto de enlaces", summaryDetail: "Revisa si el nombre accesible se comprende. El texto visible es la información que se muestra pantalla. Cuando no hay texto visible, puede ser un icono.", summaryResult: issues ? `${issues} enlace(s) con texto o nombre accesible poco descriptivo.` : "No se detectaron enlaces con texto visible o nombre accesible poco descriptivo.", summarySeverity: linkProblem || links.length === 0 ? "error" : "" });
        if (state.linkTextVisible && links[0]) focusMarkedElement(links[0]);
        const linkSeverity = link => {
          const visibleText = textValue(link);
          const name = accessibleName(link);
          const hasVisible = !!visibleText;
          const genericReason = genericLinkTextReason(visibleText) || genericLinkTextReason(name);
          if ((!visibleText || visibleText.trim().toLowerCase() === "sin texto visible") && (!name || name.trim().toLowerCase() === "sin nombre")) return "error";
          if (visibleText && !name) return "error";
          if (genericReason) return "error";
          if (!hasVisible) return (!name || name === "Sin nombre") ? "error" : "warn";
          const different = visibleText && visibleText.replace(/\s+/g, " ").trim().toLowerCase() !== name.replace(/\s+/g, " ").trim().toLowerCase();
          return different ? "warn" : "ok";
        };
        const showLink = index => {
          const link = links[index];
          if (!link) return;
          const name = accessibleName(link);
          const visibleText = textValue(link);
          const genericReason = genericLinkTextReason(visibleText) || genericLinkTextReason(name);
          revealElement(link, "Enlace", linkSeverity(link), {
            detail: genericReason || (name ? name.slice(0, 160) : "Sin nombre accesible."),
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
            mark(link, labelText, linkSeverity(link), "link");
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
            mark(link, labelText, linkSeverity(link), "link");
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
        const skipRows = internal.map((link, index) => {
          const href = link.getAttribute("href") || "";
          let targetId = href.slice(1);
          try { targetId = decodeURIComponent(targetId); } catch (_error) {}
          const target = document.getElementById(targetId);
          const linkText = textValue(link) || accessibleName(link) || href;
          const originLabel = mark(link, `Skip link -> #${targetId}`, target ? "ok" : "error");
          if (originLabel) originLabel.setAttribute("data-apcf-skip-link", "true");
          if (target) mark(target, `Destino de skip link: #${targetId}`, "ok");
          return `
            <button class="apcf-media-item apcf-link-item" type="button" data-apcf-show-skip-link="${index}" data-apcf-severity="${target ? "warn" : "error"}">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${index + 1}</strong>
              <span>${escapeHtml(linkText)}</span>
              <span>${escapeHtml(`#${targetId || "sin destino"}`)}</span>
              <span>${escapeHtml(target ? "Destino encontrado" : "Destino no encontrado")}</span>
            </button>
          `;
        }).join("");
        const issues = internal.filter(link => {
          const href = link.getAttribute("href") || "";
          let targetId = href.slice(1);
          try { targetId = decodeURIComponent(targetId); } catch (_error) {}
          return !document.getElementById(targetId);
        }).length;
        const box = floating("Enlace de salto", `
          <p class="apcf-result">${escapeHtml(`${internal.length} enlace(s) de salto detectado(s).`)}</p>
          ${internal.length ? listHead("apcf-list-head--link", ["Ver", "N", "Texto", "Destino", "Estado"]) : ""}
          ${internal.length ? `<div class="apcf-media-list">${skipRows}</div>` : `<p class="apcf-explain">No se encontraron enlaces de salto visibles.</p>`}
        `, { summary: "Enlace de salto", summaryDetail: "Muestra los enlaces internos de salto detectados y si su destino existe.", summaryResult: internal.length ? `${internal.length} enlace(s) de salto detectado(s).` : "No se encontraron enlaces de salto visibles.", summarySeverity: issues ? "error" : "" });
        box.querySelectorAll("[data-apcf-show-skip-link]").forEach(button => {
          button.addEventListener("click", () => {
            const link = internal[Number(button.dataset.apcfShowSkipLink)];
            if (!link) return;
            const href = link.getAttribute("href") || "";
            let targetId = href.slice(1);
            try { targetId = decodeURIComponent(targetId); } catch (_error) {}
            const target = document.getElementById(targetId);
            if (target) focusMarkedElement(target);
            else focusMarkedElement(link);
          });
        });
        result(check, issues);
        break;
      }

      case "language": {
        const lang = document.documentElement.getAttribute("lang");
        const langProblem = !lang || !lang.trim();
        floating("Idioma de la página", explainResult(
          "Comprueba que coincide con el idioma principal del texto de la página.\nSi el idioma es español, el idioma declarado será ES. Si el idioma es inglés, el idioma declarado será EN.",
          langProblem
            ? problemResult("Problema: no se encontró este elemento.")
            : `<strong>Idioma declarado:</strong> ${escapeHtml(lang)}`
        ), { summary: "Idioma de la página", summaryDetail: "Comprueba que coincide con el idioma principal del texto de la página.\nSi el idioma es español, el idioma declarado será ES. Si el idioma es inglés, el idioma declarado será EN.", summaryResult: langProblem ? "No hay idioma declarado." : `Idioma declarado: ${lang}.`, summarySeverity: langProblem ? "error" : "" });
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
              <button class="apcf-media-item apcf-audio-item" type="button" data-apcf-show-media="${index}" data-apcf-media-title="${escapeHtml(`AUDIO · ${item.file}`)}" data-apcf-media-label="${escapeHtml(item.insertion)}">
                <span class="apcf-mini-button" aria-hidden="true">Ver</span>
                <strong>${escapeHtml(item.insertion)}</strong>
                <span>${escapeHtml(item.problems)}</span>
              </button>
            `;
          });
          const summaryResult = `${findings.length} coincidencia(s) detectada(s).`;
          const box = floating("Audio", `
            <p class="apcf-explain">Observa si en el audio hay una transcripción textual.</p>
            <p class="apcf-result">${escapeHtml(summaryResult)}</p>
            ${items.length ? listHead("apcf-list-head--audio", ["Ver", "Descripción", "Revisión"]) : ""}
            ${items.length ? `<div class="apcf-media-list">${items.join("")}</div>` : ""}
          `, { summary: "Audio", summaryDetail: "Observa si en el audio hay una transcripción textual.", summaryResult });
          if (findings[0]?.target || findings[0]?.element) focusMarkedElement(findings[0].target || findings[0].element);
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
                  `Revisión: revisar si el video tiene subtítulos y audiodescripción o transcripción.`
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
          if (target && !highlighted.has(target)) {
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
              <strong>${escapeHtml(item.insertion)}</strong>
              <span>${escapeHtml(item.problems)}</span>
            </button>
          `;
        });
        const summaryResult = `${findings.length} coincidencia(s) detectada(s).`;
        const box = floating("Vídeo", `
          <p class="apcf-explain">Observa si el video tiene subtítulos y audiodescripción o transcripción.</p>
          <p class="apcf-result">${escapeHtml(summaryResult)}</p>
          <p class="apcf-explain apcf-iframe-note"><strong>Nota sobre iframes:</strong> algunos vídeos externos no permiten leer su contenido interno, por lo que pueden producirse errores de detección debidos a una limitación técnica, no a un fallo de la herramienta.</p>
          ${items.length ? listHead("apcf-list-head--video", ["Ver", "Descripción", "Revisión"]) : ""}
          ${items.length ? `<div class="apcf-media-list">${items.join("")}</div>` : ""}
        `, { summary: "Vídeo", summaryDetail: "Observa si el video tiene subtítulos y audiodescripción o transcripción.", summaryResult });
        if (findings[0]?.target || findings[0]?.element) focusMarkedElement(findings[0].target || findings[0].element);
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
                `Revisión: revisar si el video tiene subtítulos y audiodescripción o transcripción.`
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
        const focusable = tabOrderedPageElements();
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
        drawFocusOrderRoute(focusable);
        const rows = focusable.map((el, index) => {
          const tabindexAttr = el.getAttribute("tabindex");
          const positive = tabindexAttr && Number(tabindexAttr) > 0;
          return `
            <button class="apcf-media-item apcf-link-item" type="button" data-apcf-show-focus-order="${index}" data-apcf-severity="${positive ? "warn" : "ok"}">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${index + 1}</strong>
              <span>${escapeHtml(focusOrderElementLabel(el).slice(0, 160))}</span>
            </button>
          `;
        }).join("");
        const box = floating("Orden de foco", `
          <p class="apcf-explain">Comprueba que el orden secuencial de tabulación de la página tiene sentido al leerse.</p>
          <p class="apcf-result">${escapeHtml(`${focusable.length} elemento(s) enfocable(s) numerados y conectados por el recorrido de foco.`)}</p>
          ${listHead("apcf-list-head--focus-order", ["Ver", "Orden", "Nombre o etiqueta"])}
          <div class="apcf-media-list">${rows}</div>
        `, { summary: "Orden de foco", summaryDetail: "Comprueba que el orden secuencial de tabulación de la página tiene sentido al leerse.", summaryResult: `${focusable.length} elemento(s) enfocable(s) numerados.` });
        box.querySelectorAll("[data-apcf-show-focus-order]").forEach(button => {
          button.addEventListener("click", () => {
            const el = focusable[Number(button.dataset.apcfShowFocusOrder)];
            if (!el) return;
            revealElement(el, `Foco #${Number(button.dataset.apcfShowFocusOrder) + 1}`, "warn", {
              detail: focusOrderElementLabel(el).slice(0, 160),
              noLabel: true
            });
            hideCurrentFloatingPanel();
          });
        });
        result(check, issues);
        break;
      }

      case "focus-view": {
        const focusView = applyFocusView();
        const focusSummary = focusView.total
          ? `${focusView.visible} de ${focusView.total} elemento(s) enfocable(s) muestran un indicador de foco real.`
          : "No se encontraron elementos enfocables.";
        floating("Mostrar foco", explainResult(
          "Muestra el indicador real que aplica la CSS de la página al foco de teclado. No se añade un foco artificial.",
          focusSummary
        ), { summary: "Mostrar foco", summaryDetail: "Muestra el indicador real de foco definido por la página.", summaryResult: focusSummary });
        result(check, 0, focusView.total ? "manual" : "ok");
        break;
      }

      case "form-labels": {
        const fields = visibleElements("input:not([type='hidden']),select,textarea,button");
        let issues = 0;
        if (!fields.length) {
          floating("Etiquetas", explainResult("Observa si hay campos visibles y si están correctamente etiquetados.", "No hay formularios visibles en esta página."), { summary: "Etiquetas", summaryDetail: "Observa si hay campos visibles y correctamente etiquetados.", summaryResult: "No hay formularios visibles." });
          result(check, 0, "manual");
          break;
        }
        const items = fields.map((field, index) => {
          const tag = field.tagName.toLowerCase();
          const id = field.getAttribute("id") || "";
          const isButton = tag === "button";
          const explicitLabel = !isButton && id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
          const labelText = explicitLabel ? textValue(explicitLabel) : "";
          const buttonText = isButton ? textValue(field) : "";
          const hasButtonText = isButton ? !!buttonText.trim() : false;
          const hasLabel = isButton ? hasButtonText : !!explicitLabel;
          const visibleLabelText = isButton ? buttonText.trim() : labelText.trim();
          const labelMessage = isButton
            ? (hasButtonText ? `Texto visible del botón: "${visibleLabelText}"` : "No tiene etiqueta label")
            : (hasLabel ? `La etiqueta label es: "${visibleLabelText}"` : "No tiene etiqueta label");
          const severity = hasLabel ? "ok" : "error";
          if (!hasLabel) {
            issues += 1;
            mark(field, isButton ? "Sin texto visible" : "Sin etiqueta", "error");
            const label = mark(field, labelMessage, "error", "form");
            if (label) label.dataset.apcfMediaPlacement = "below";
          } else {
            const label = mark(field, labelMessage, "warn", "form");
            if (label) label.dataset.apcfMediaPlacement = "below";
          }
          return `
            <button class="apcf-media-item apcf-form-item" type="button" data-apcf-show-field="${index}" data-apcf-severity="${severity}">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${escapeHtml(tag)}</strong>
              <span>${escapeHtml(visibleLabelText || "No tiene etiqueta label")}</span>
              <span>${escapeHtml(labelMessage)}</span>
            </button>
          `;
        }).join("");
        const box = floating("Etiquetas", `
          <p class="apcf-explain">Observa si hay campos visibles y si están correctamente etiquetados.</p>
          <p class="apcf-result">${escapeHtml(`${issues} incidencia(s) automática(s) detectada(s).`)}</p>
          ${items ? listHead("apcf-list-head--form", ["Ver", "Campo", "Nombre de Etiqueta", "Estado"]) : ""}
          <div class="apcf-media-list">${items}</div>
        `, { summary: "Etiquetas", summaryDetail: "Observa si hay campos visibles y correctamente etiquetados.", summaryResult: `${issues} incidencia(s) automática(s) detectada(s).`, summaryResultMarkup: issues ? `<span class="apcf-summary-alert-inline apcf-summary-alert-block">${escapeHtml(`${issues} incidencia(s) automática(s) detectada(s).`)}</span>` : "" });
        if (fields[0]) focusMarkedElement(fields[0]);
        box.querySelectorAll("[data-apcf-show-field]").forEach(button => {
          button.addEventListener("click", () => {
            const field = fields[Number(button.dataset.apcfShowField)];
            if (!field) return;
            const tag = field.tagName.toLowerCase();
            const id = field.getAttribute("id") || "";
            const isButton = tag === "button";
            const explicitLabel = !isButton && id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
            const labelText = explicitLabel ? textValue(explicitLabel) : "";
            const buttonText = isButton ? textValue(field) : "";
            const hasButtonText = isButton ? !!buttonText.trim() : false;
            const hasLabel = isButton ? hasButtonText : !!explicitLabel;
            revealElement(field, hasLabel ? (isButton ? "Botón con texto visible" : "Control con etiqueta") : (isButton ? "Botón sin texto visible" : "Sin etiqueta label"), hasLabel ? "ok" : "error", {
              detail: [
                `Campo: ${tag}`,
                field.id ? `ID: ${field.id}` : "Sin ID",
                field.getAttribute("type") ? `Tipo: ${field.getAttribute("type")}` : "Sin tipo",
                isButton
                  ? (hasButtonText ? `Texto visible del botón: "${buttonText.trim()}"` : "No tiene etiqueta label")
                  : (hasLabel ? `La etiqueta label es: "${labelText}"` : "No tiene etiqueta label"),
                field.required || field.getAttribute("aria-required") === "true" ? "Campo obligatorio" : "Campo no obligatorio"
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
          const status = requiredText ? `Marcado con '${requiredText}'?` : "Campo obligatorio";
          const controlText = field.matches("input[type='submit'],input[type='button'],input[type='reset']") ? (field.getAttribute("value") || "").trim() : (label || field.getAttribute("id") || "Sin nombre accesible");
          mark(field, status, "warn");
          return `
            <button class="apcf-media-item apcf-form-item" type="button" data-apcf-show-required="${index}" data-apcf-severity="warn">
              <span class="apcf-mini-button" aria-hidden="true">Ver</span>
              <strong>${escapeHtml(field.tagName.toLowerCase())}</strong>
              <span>${escapeHtml(controlText || "Sin nombre accesible")}</span>
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
          ${items ? listHead("apcf-list-head--form", ["Ver", "Campo", "Nombre accesible", "Estado"]) : ""}
          <div class="apcf-media-list">${items}</div>
        `, { summary: "Campos obligatorios", summaryDetail: "Observa si los obligatorios están señalados.", summaryResult: requiredSummary, summaryResultMarkup: "" });
        const requiredBox = document.querySelector(`.${FLOATING}`);
        if (requiredItems[0]?.field) focusMarkedElement(requiredItems[0].field);
        requiredBox?.querySelectorAll("[data-apcf-show-required]").forEach(button => {
          button.addEventListener("click", () => {
            const item = requiredItems[Number(button.dataset.apcfShowRequired)];
            if (!item) return;
            const { field, labelText } = item;
            const hasAsterisk = /\*/.test(labelText);
            const keyword = (labelText.match(/\b(obligatorio|requerido|required)\b/i) || [])[0] || "";
            const requiredText = hasAsterisk ? "*" : keyword;
            const status = requiredText ? `Marcado con '${requiredText}'?` : "Campo obligatorio";
            revealElement(field, "Campo obligatorio", "warn", {
              detail: [
                `Campo: ${field.tagName.toLowerCase()}`,
                field.id ? `ID: ${field.id}` : "Sin ID",
                status,
                requiredVisualText(field) ? `Texto visible detectado: ${requiredVisualText(field).slice(0, 120)}` : "Sin texto visible detectado."
              ].join("\n"),
              noLabel: true
            });
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

  function stopMediaRescan() {
    if (mediaRescanObserver) {
      mediaRescanObserver.disconnect();
      mediaRescanObserver = null;
    }
    if (mediaRescanTimer) {
      window.clearTimeout(mediaRescanTimer);
      mediaRescanTimer = null;
    }
  }

  function scheduleMediaRescan() {
    stopMediaRescan();
    if (!state.active.has("video") && !state.active.has("audio")) return;
    const run = () => {
      if (!document.getElementById(PANEL_ID)) return;
      if (!state.active.has("video") && !state.active.has("audio")) return;
      refreshVisuals();
    };
    [600, 1800, 3500, 6000].forEach(delay => {
      window.setTimeout(run, delay);
    });
    loadPageSourceHtml().then(html => {
      if (!html) return;
      state.pageSourceHtml = html;
      return prefetchIframeSourceHtml(html);
    }).then(() => {
      if (document.getElementById(PANEL_ID) && (state.active.has("video") || state.active.has("audio"))) {
        refreshVisuals();
      }
    });
    if (window.MutationObserver) {
      let pending = false;
      mediaRescanObserver = new MutationObserver(() => {
        if (pending) return;
        pending = true;
        window.setTimeout(() => {
          pending = false;
          run();
        }, 250);
      });
      mediaRescanObserver.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true
      });
      mediaRescanTimer = window.setTimeout(stopMediaRescan, 8000);
    }
  }

  function checksForProfile() {
    return checks.filter(check => check.profiles.includes(state.profile));
  }

  function statusHtml() {
    return "<span class=\"apcf-status-title\">Evaluar</span><span>Elige una opción y observa las marcas en la página.</span>";
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
      <div class="apcf-feedback">
        <a class="apcf-feedback-link" href="${escapeHtml(SURVEY_URL)}" target="_blank" rel="noopener noreferrer">
          <span class="apcf-feedback-icon" aria-hidden="true">✎</span>
          <span class="apcf-feedback-text">
            <strong>Valora la herramienta</strong>
            <span>Cuéntanos tu experiencia y comunicanos cualquier problema</span>
          </span>
        </a>
      </div>
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
    const profileInputs = [...panel.querySelectorAll("input[name='apcf-profile']")];
    const selectProfile = (value, focusSelected = true) => {
      if (!profiles.some(item => item.id === value)) return;
      state.profile = value;
      const visibleIds = new Set(checksForProfile().map(check => check.id));
      state.active = new Set([...state.active].filter(id => visibleIds.has(id)));
      refreshVisuals();
      render(false);
      if (focusSelected) {
        const next = document.querySelector(`#${PANEL_ID} input[name='apcf-profile'][value="${CSS.escape(state.profile)}"]`);
        next?.focus({ preventScroll: true });
      }
    };
    profileInputs.forEach((input, index) => {
      input.addEventListener("change", () => {
        selectProfile(input.value);
      });
      input.addEventListener("keydown", event => {
        const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + profileInputs.length) % profileInputs.length;
        else if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % profileInputs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = profileInputs.length - 1;
        const nextInput = profileInputs[nextIndex];
        if (!nextInput) return;
        nextInput.checked = true;
        selectProfile(nextInput.value);
      });
    });
    panel.querySelectorAll(".apcf-profile").forEach(label => {
      label.addEventListener("keydown", event => {
        const input = label.previousElementSibling;
        if (!input || !input.matches("input[name='apcf-profile']")) return;
        input.dispatchEvent(new KeyboardEvent("keydown", {
          key: event.key,
          bubbles: true,
          cancelable: true
        }));
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
    scheduleMediaRescan();
  }
  function close() { closePanel(); }
  function toggle() {
    if (document.getElementById(PANEL_ID)) closePanel();
    else render();
  }

  const api = {
    build: BUILD,
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
