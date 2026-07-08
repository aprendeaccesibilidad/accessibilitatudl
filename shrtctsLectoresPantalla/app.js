const DATA = [
  // JAWS — The basics
  { id: "jaws-stop", reader: "jaws", category: "Lectura", title: "Detener lectura", description: "Interrumpe la lectura actual de JAWS.", combos: [["Control"]], tags: "parar detener speech" },
  { id: "jaws-say-all", reader: "jaws", category: "Lectura", title: "Leer continuamente desde aquí", description: "Inicia la lectura continua desde la posición actual.", combos: [["Insert", "ArrowDown"]], tags: "say all leer continuamente" },
  { id: "jaws-next-item", reader: "jaws", category: "Lectura", title: "Leer siguiente elemento", description: "Lee el siguiente elemento del contenido.", combos: [["ArrowDown"]], tags: "siguiente item elemento" },
  { id: "jaws-focus-next", reader: "jaws", category: "Navegación", title: "Siguiente elemento enfocable", description: "Mueve el foco al siguiente enlace, botón o control.", combos: [["Tab"]], tags: "focus foco enlace botón control" },
  { id: "jaws-next-heading", reader: "jaws", category: "Navegación", title: "Siguiente encabezado", description: "Recorre la estructura de encabezados de la página.", combos: [["H"]], tags: "heading titulo encabezado" },
  { id: "jaws-headings-list", reader: "jaws", category: "Navegación", title: "Listar encabezados", description: "Muestra una lista con todos los encabezados de la página.", combos: [["Insert", "F6"]], tags: "headings titulos lista" },
  { id: "jaws-heading-level", reader: "jaws", category: "Navegación", title: "Encabezado de nivel concreto", description: "Va al siguiente encabezado del nivel elegido, de 1 a 6.", combos: [["1"], ["2"], ["3"], ["4"], ["5"], ["6"]], tags: "h1 h2 h3 h4 h5 h6" },
  { id: "jaws-landmark", reader: "jaws", category: "Navegación", title: "Siguiente región o landmark", description: "Salta a la siguiente región estructural de la página.", combos: [["R"]], tags: "region landmark aria" },
  { id: "jaws-main", reader: "jaws", category: "Navegación", title: "Ir a la región principal", description: "Salta al contenido principal de la página.", combos: [["Q"]], tags: "main principal contenido" },
  { id: "jaws-elements-list", reader: "jaws", category: "Navegación", title: "Lista de elementos", description: "Muestra botones, marcos, gráficos, listas, enlaces y otros elementos.", combos: [["Insert", "F3"]], tags: "elementos botones frames graficos listas links" },
  { id: "jaws-links-list", reader: "jaws", category: "Navegación", title: "Listar enlaces", description: "Muestra todos los enlaces disponibles en la página.", combos: [["Insert", "F7"]], tags: "links enlaces lista" },
  { id: "jaws-unvisited", reader: "jaws", category: "Navegación", title: "Siguiente enlace no visitado", description: "Va al siguiente enlace no visitado.", combos: [["U"]], tags: "unvisited no visitado enlace" },
  { id: "jaws-visited", reader: "jaws", category: "Navegación", title: "Siguiente enlace visitado", description: "Va al siguiente enlace visitado.", combos: [["V"]], tags: "visited visitado enlace" },
  { id: "jaws-list", reader: "jaws", category: "Navegación", title: "Siguiente lista", description: "Salta a la siguiente lista del contenido.", combos: [["L"]], tags: "lista list" },
  { id: "jaws-list-item", reader: "jaws", category: "Navegación", title: "Siguiente elemento de lista", description: "Salta al siguiente ítem de una lista.", combos: [["I"]], tags: "item lista" },
  { id: "jaws-graphic", reader: "jaws", category: "Navegación", title: "Siguiente gráfico", description: "Va al siguiente gráfico o imagen.", combos: [["G"]], tags: "imagen grafico graphic" },
  { id: "jaws-vpc", reader: "jaws", category: "Comandos generales", title: "Alternar Virtual PC Cursor", description: "Activa o desactiva el cursor virtual de JAWS.", combos: [["Insert", "Z"]], tags: "cursor virtual browse" },

  // JAWS — Reading text
  { id: "jaws-current-line", reader: "jaws", category: "Lectura", title: "Leer línea actual", description: "Lee la línea en la que se encuentra el cursor.", combos: [["Insert", "ArrowUp"]], tags: "linea actual" },
  { id: "jaws-prior-word", reader: "jaws", category: "Lectura", title: "Leer palabra anterior", description: "Lee la palabra anterior.", combos: [["Insert", "ArrowLeft"]], tags: "palabra anterior" },
  { id: "jaws-next-word", reader: "jaws", category: "Lectura", title: "Leer palabra siguiente", description: "Lee la palabra siguiente.", combos: [["Insert", "ArrowRight"]], tags: "palabra siguiente" },
  { id: "jaws-current-word", reader: "jaws", category: "Lectura", title: "Leer palabra actual", description: "Lee la palabra actual.", combos: [["Insert", "Numpad5"]], tags: "palabra actual" },
  { id: "jaws-current-sentence", reader: "jaws", category: "Lectura", title: "Leer frase actual", description: "Lee la frase actual.", combos: [["Alt", "Numpad5"]], tags: "frase sentence" },

  // JAWS — Tables
  { id: "jaws-table-next", reader: "jaws", category: "Tablas", title: "Siguiente tabla", description: "Salta a la siguiente tabla.", combos: [["T"]], tags: "tabla table" },
  { id: "jaws-cell-right", reader: "jaws", category: "Tablas", title: "Celda a la derecha", description: "Mueve la navegación a la celda de la derecha.", combos: [["Control", "Alt", "ArrowRight"]], tags: "tabla celda derecha" },
  { id: "jaws-cell-left", reader: "jaws", category: "Tablas", title: "Celda a la izquierda", description: "Mueve la navegación a la celda de la izquierda.", combos: [["Control", "Alt", "ArrowLeft"]], tags: "tabla celda izquierda" },
  { id: "jaws-cell-down", reader: "jaws", category: "Tablas", title: "Celda inferior", description: "Mueve la navegación a la celda situada debajo.", combos: [["Control", "Alt", "ArrowDown"]], tags: "tabla celda abajo" },
  { id: "jaws-cell-up", reader: "jaws", category: "Tablas", title: "Celda superior", description: "Mueve la navegación a la celda situada encima.", combos: [["Control", "Alt", "ArrowUp"]], tags: "tabla celda arriba" },
  { id: "jaws-first-cell", reader: "jaws", category: "Tablas", title: "Primera celda", description: "Va a la primera celda de la tabla.", combos: [["Control", "Alt", "Home"]], tags: "tabla primera celda" },
  { id: "jaws-last-cell", reader: "jaws", category: "Tablas", title: "Última celda", description: "Va a la última celda de la tabla.", combos: [["Control", "Alt", "End"]], tags: "tabla ultima celda" },

  // JAWS — Forms
  { id: "jaws-form-list", reader: "jaws", category: "Formularios", title: "Listar campos de formulario", description: "Muestra todos los elementos de formulario.", combos: [["Insert", "F5"]], tags: "forms formulario campos" },
  { id: "jaws-form-next", reader: "jaws", category: "Formularios", title: "Siguiente campo de formulario", description: "Salta al siguiente campo de formulario.", combos: [["F"]], tags: "form field campo" },
  { id: "jaws-button-next", reader: "jaws", category: "Formularios", title: "Siguiente botón", description: "Salta al siguiente botón.", combos: [["B"]], tags: "boton button" },
  { id: "jaws-checkbox-next", reader: "jaws", category: "Formularios", title: "Siguiente casilla", description: "Salta a la siguiente casilla de verificación.", combos: [["X"]], tags: "checkbox casilla" },
  { id: "jaws-activate-control", reader: "jaws", category: "Formularios", title: "Activar control", description: "Activa un enlace, botón o campo enfocado.", combos: [["Enter"], ["Space"]], tags: "activar boton enlace control" },
  { id: "jaws-forms-mode", reader: "jaws", category: "Formularios", title: "Entrar en modo formulario", description: "Activa el modo formulario cuando el foco está sobre un campo.", combos: [["Enter"]], tags: "forms mode modo formulario" },
  { id: "jaws-browse-mode", reader: "jaws", category: "Formularios", title: "Salir de modo formulario", description: "Vuelve al modo exploración o browse mode.", combos: [["NumpadPlus"]], tags: "browse mode salir formulario" },

  // NVDA — The basics
  { id: "nvda-on", reader: "nvda", category: "Comandos generales", title: "Activar NVDA", description: "Inicia NVDA en Windows.", combos: [["Control", "Alt", "N"]], tags: "activar iniciar on" },
  { id: "nvda-off", reader: "nvda", category: "Comandos generales", title: "Desactivar NVDA", description: "Cierra NVDA.", combos: [["NVDA", "Q"]], tags: "desactivar salir quit" },
  { id: "nvda-toggle-mode", reader: "nvda", category: "Comandos generales", title: "Alternar modo foco y exploración", description: "Cambia entre Browse Mode y Focus Mode.", combos: [["NVDA", "Space"]], tags: "focus browse modo formulario" },
  { id: "nvda-stop", reader: "nvda", category: "Lectura", title: "Detener lectura", description: "Interrumpe la lectura actual.", combos: [["Control"]], tags: "parar detener" },
  { id: "nvda-say-all", reader: "nvda", category: "Lectura", title: "Leer continuamente desde aquí", description: "Inicia la lectura continua desde la posición actual.", combos: [["NVDA", "ArrowDown"], ["NumpadPlus"]], tags: "say all lectura continua" },
  { id: "nvda-say-all-laptop", reader: "nvda", category: "Lectura", title: "Leer continuamente en distribución portátil", description: "Atajo alternativo en layout de portátil.", combos: [["NVDA", "A"]], tags: "laptop portátil say all" },
  { id: "nvda-next-heading", reader: "nvda", category: "Navegación", title: "Siguiente encabezado", description: "Recorre los encabezados de la página.", combos: [["H"]], tags: "heading encabezado titulo" },
  { id: "nvda-heading-list", reader: "nvda", category: "Navegación", title: "Listar encabezados", description: "Abre la lista de elementos, desde la que se pueden revisar encabezados.", combos: [["NVDA", "F7"]], tags: "headings titulos lista elementos" },
  { id: "nvda-landmark", reader: "nvda", category: "Navegación", title: "Siguiente región o landmark", description: "Salta a la siguiente región de la página.", combos: [["D"]], tags: "landmark region" },
  { id: "nvda-elements-list", reader: "nvda", category: "Navegación", title: "Lista de elementos", description: "Muestra enlaces, encabezados, campos de formulario, botones y regiones.", combos: [["NVDA", "F7"]], tags: "elementos lista links headings botones landmarks" },
  { id: "nvda-next-link", reader: "nvda", category: "Navegación", title: "Siguiente enlace", description: "Va al siguiente enlace.", combos: [["K"]], tags: "link enlace" },
  { id: "nvda-links-list", reader: "nvda", category: "Navegación", title: "Listar enlaces", description: "Muestra la lista de enlaces en la lista de elementos.", combos: [["NVDA", "F7"]], tags: "links enlaces lista" },
  { id: "nvda-unvisited", reader: "nvda", category: "Navegación", title: "Siguiente enlace no visitado", description: "Va al siguiente enlace no visitado.", combos: [["U"]], tags: "unvisited no visitado" },
  { id: "nvda-visited", reader: "nvda", category: "Navegación", title: "Siguiente enlace visitado", description: "Va al siguiente enlace visitado.", combos: [["V"]], tags: "visited visitado" },
  { id: "nvda-list", reader: "nvda", category: "Navegación", title: "Siguiente lista", description: "Salta a la siguiente lista.", combos: [["L"]], tags: "lista list" },
  { id: "nvda-list-item", reader: "nvda", category: "Navegación", title: "Siguiente elemento de lista", description: "Salta al siguiente elemento de lista.", combos: [["I"]], tags: "item lista" },
  { id: "nvda-graphic", reader: "nvda", category: "Navegación", title: "Siguiente gráfico", description: "Va al siguiente gráfico o imagen.", combos: [["G"]], tags: "grafico imagen graphic" },

  // NVDA — Reading text and tables/forms
  { id: "nvda-current-line", reader: "nvda", category: "Lectura", title: "Leer línea actual", description: "Lee la línea actual.", combos: [["NVDA", "ArrowUp"], ["Numpad8"]], tags: "linea actual" },
  { id: "nvda-current-word", reader: "nvda", category: "Lectura", title: "Leer palabra actual", description: "Lee la palabra actual.", combos: [["Numpad5"]], tags: "palabra word" },
  { id: "nvda-word-left", reader: "nvda", category: "Lectura", title: "Palabra anterior", description: "Lee la palabra anterior.", combos: [["Control", "ArrowLeft"], ["Numpad4"]], tags: "palabra anterior" },
  { id: "nvda-word-right", reader: "nvda", category: "Lectura", title: "Palabra siguiente", description: "Lee la palabra siguiente.", combos: [["Control", "ArrowRight"], ["Numpad6"]], tags: "palabra siguiente" },
  { id: "nvda-table-next", reader: "nvda", category: "Tablas", title: "Siguiente tabla", description: "Salta a la siguiente tabla.", combos: [["T"]], tags: "tabla table" },
  { id: "nvda-cell-right", reader: "nvda", category: "Tablas", title: "Celda a la derecha", description: "Mueve la navegación a la celda de la derecha.", combos: [["Control", "Alt", "ArrowRight"]], tags: "celda derecha tabla" },
  { id: "nvda-cell-left", reader: "nvda", category: "Tablas", title: "Celda a la izquierda", description: "Mueve la navegación a la celda de la izquierda.", combos: [["Control", "Alt", "ArrowLeft"]], tags: "celda izquierda tabla" },
  { id: "nvda-cell-down", reader: "nvda", category: "Tablas", title: "Celda inferior", description: "Mueve la navegación a la celda inferior.", combos: [["Control", "Alt", "ArrowDown"]], tags: "celda abajo tabla" },
  { id: "nvda-cell-up", reader: "nvda", category: "Tablas", title: "Celda superior", description: "Mueve la navegación a la celda superior.", combos: [["Control", "Alt", "ArrowUp"]], tags: "celda arriba tabla" },
  { id: "nvda-form-list", reader: "nvda", category: "Formularios", title: "Listar campos de formulario", description: "Muestra los elementos de formulario desde la lista de elementos.", combos: [["NVDA", "F7"]], tags: "forms formulario campos lista" },
  { id: "nvda-next-form", reader: "nvda", category: "Formularios", title: "Siguiente campo de formulario", description: "Salta al siguiente campo de formulario.", combos: [["F"]], tags: "form field campo" },
  { id: "nvda-next-button", reader: "nvda", category: "Formularios", title: "Siguiente botón", description: "Salta al siguiente botón.", combos: [["B"]], tags: "button boton" },
  { id: "nvda-next-checkbox", reader: "nvda", category: "Formularios", title: "Siguiente casilla", description: "Salta a la siguiente casilla de verificación.", combos: [["X"]], tags: "checkbox casilla" },
  { id: "nvda-next-combo", reader: "nvda", category: "Formularios", title: "Siguiente lista desplegable", description: "Salta al siguiente combo box o lista desplegable.", combos: [["C"]], tags: "combo select desplegable" },
  { id: "nvda-next-radio", reader: "nvda", category: "Formularios", title: "Siguiente botón de opción", description: "Salta al siguiente radio button.", combos: [["R"]], tags: "radio option" },
  { id: "nvda-activate-control", reader: "nvda", category: "Formularios", title: "Activar control", description: "Activa un enlace, botón o control enfocado.", combos: [["Enter"], ["Space"]], tags: "activar boton enlace control" },

  // VoiceOver — basics and reading
  { id: "vo-toggle", reader: "voiceover", category: "Comandos generales", title: "Activar o desactivar VoiceOver", description: "Inicia o detiene VoiceOver en macOS.", combos: [["Command", "F5"]], tags: "activar desactivar mac" },
  { id: "vo-keys", reader: "voiceover", category: "Comandos generales", title: "Teclas VO", description: "VoiceOver usa Control + Option como teclas VO.", combos: [["Control", "Option"]], tags: "vo keys control option" },
  { id: "vo-lock", reader: "voiceover", category: "Comandos generales", title: "Bloquear o desbloquear teclas VO", description: "Permite no tener que mantener pulsadas las teclas VO en cada comando.", combos: [["VO", ";"]], tags: "bloquear vo semicolon" },
  { id: "vo-repeat", reader: "voiceover", category: "Lectura", title: "Repetir última frase", description: "Repite la última frase hablada.", combos: [["VO", "Z"]], tags: "repeat repetir" },
  { id: "vo-start-reading", reader: "voiceover", category: "Lectura", title: "Empezar lectura", description: "Comienza la lectura con VoiceOver.", combos: [["VO", "A"]], tags: "start reading leer" },
  { id: "vo-pause", reader: "voiceover", category: "Lectura", title: "Pausar o reanudar lectura", description: "Pausa o reanuda la salida de voz.", combos: [["Control"]], tags: "pausar reanudar lectura" },
  { id: "vo-next-item", reader: "voiceover", category: "Lectura", title: "Leer siguiente elemento", description: "Lee el siguiente elemento.", combos: [["VO", "ArrowRight"]], tags: "next item" },
  { id: "vo-prev-item", reader: "voiceover", category: "Lectura", title: "Leer elemento anterior", description: "Lee el elemento anterior.", combos: [["VO", "ArrowLeft"]], tags: "previous item" },
  { id: "vo-paragraph", reader: "voiceover", category: "Lectura", title: "Leer párrafo", description: "Lee el párrafo actual.", combos: [["VO", "P"]], tags: "parrafo paragraph" },
  { id: "vo-sentence", reader: "voiceover", category: "Lectura", title: "Leer frase", description: "Lee la frase actual.", combos: [["VO", "S"]], tags: "frase sentence" },
  { id: "vo-word", reader: "voiceover", category: "Lectura", title: "Leer palabra", description: "Lee la palabra; al pulsar varias veces puede deletrear.", combos: [["VO", "W"]], tags: "word palabra deletrear" },
  { id: "vo-char", reader: "voiceover", category: "Lectura", title: "Leer carácter", description: "Lee el carácter actual; dos pulsaciones pueden leerlo fonéticamente.", combos: [["VO", "C"]], tags: "character caracter" },
  { id: "vo-top", reader: "voiceover", category: "Navegación", title: "Ir al inicio de la página", description: "Salta al inicio de la página en teclados de escritorio.", combos: [["VO", "Home"]], tags: "top inicio pagina" },
  { id: "vo-bottom", reader: "voiceover", category: "Navegación", title: "Ir al final de la página", description: "Salta al final de la página en teclados de escritorio.", combos: [["VO", "End"]], tags: "bottom final pagina" },

  // VoiceOver — navigation, tables, rotor
  { id: "vo-rotor", reader: "voiceover", category: "Rotor", title: "Abrir rotor", description: "Abre el rotor para navegar por tipos de elementos.", combos: [["VO", "U"]], tags: "rotor links headings tables" },
  { id: "vo-next-focus", reader: "voiceover", category: "Navegación", title: "Siguiente elemento enfocable", description: "Va al siguiente elemento enfocable, como enlace, botón o campo.", combos: [["Tab"]], tags: "focus link button input" },
  { id: "vo-prev-focus", reader: "voiceover", category: "Navegación", title: "Elemento enfocable anterior", description: "Vuelve al elemento enfocable anterior.", combos: [["Shift", "Tab"]], tags: "focus anterior" },
  { id: "vo-next-link", reader: "voiceover", category: "Navegación", title: "Siguiente enlace", description: "Va al siguiente enlace.", combos: [["VO", "Command", "L"]], tags: "link enlace" },
  { id: "vo-next-visited", reader: "voiceover", category: "Navegación", title: "Siguiente enlace visitado", description: "Va al siguiente enlace visitado.", combos: [["VO", "Command", "V"]], tags: "visited visitado link" },
  { id: "vo-next-heading", reader: "voiceover", category: "Navegación", title: "Siguiente encabezado", description: "Va al siguiente encabezado.", combos: [["VO", "Command", "H"]], tags: "heading titulo encabezado" },
  { id: "vo-next-form", reader: "voiceover", category: "Formularios", title: "Siguiente elemento de formulario", description: "Va al siguiente elemento de formulario.", combos: [["VO", "Command", "J"]], tags: "form formulario campo" },
  { id: "vo-next-table", reader: "voiceover", category: "Tablas", title: "Siguiente tabla", description: "Va a la siguiente tabla.", combos: [["VO", "Command", "T"]], tags: "tabla table" },
  { id: "vo-next-list", reader: "voiceover", category: "Navegación", title: "Siguiente lista", description: "Va a la siguiente lista.", combos: [["VO", "Command", "X"]], tags: "lista list" },
  { id: "vo-next-graphic", reader: "voiceover", category: "Navegación", title: "Siguiente gráfico", description: "Va al siguiente gráfico o imagen.", combos: [["VO", "Command", "G"]], tags: "graphic imagen grafico" },
  { id: "vo-activate-control", reader: "voiceover", category: "Formularios", title: "Activar enlace o control", description: "Activa un enlace, botón o control de formulario.", combos: [["VO", "Space"]], tags: "activar control boton enlace" },
  { id: "vo-interact-in", reader: "voiceover", category: "Navegación", title: "Interactuar con objeto", description: "Entra en objetos como iframes, menús o regiones de aplicación.", combos: [["VO", "Shift", "ArrowDown"]], tags: "interactuar objeto iframe menu" },
  { id: "vo-interact-out", reader: "voiceover", category: "Navegación", title: "Salir de objeto", description: "Sale del objeto con el que se está interactuando.", combos: [["VO", "Shift", "ArrowUp"]], tags: "salir objeto iframe menu" },
  { id: "vo-table-right", reader: "voiceover", category: "Tablas", title: "Celda a la derecha", description: "Navega a la celda de la derecha.", combos: [["VO", "ArrowRight"]], tags: "tabla celda derecha" },
  { id: "vo-table-left", reader: "voiceover", category: "Tablas", title: "Celda a la izquierda", description: "Navega a la celda de la izquierda.", combos: [["VO", "ArrowLeft"]], tags: "tabla celda izquierda" },
  { id: "vo-table-down", reader: "voiceover", category: "Tablas", title: "Celda inferior", description: "Navega a la celda inferior.", combos: [["VO", "ArrowDown"]], tags: "tabla celda abajo" },
  { id: "vo-table-up", reader: "voiceover", category: "Tablas", title: "Celda superior", description: "Navega a la celda superior.", combos: [["VO", "ArrowUp"]], tags: "tabla celda arriba" },
  { id: "vo-column-header", reader: "voiceover", category: "Tablas", title: "Leer encabezado de columna", description: "Lee el encabezado de la columna actual.", combos: [["VO", "C"]], tags: "tabla columna header" },
  { id: "vo-row-read", reader: "voiceover", category: "Tablas", title: "Leer fila desde la posición actual", description: "Lee la fila desde la posición actual del cursor de VoiceOver hasta el final.", combos: [["VO", "R"]], tags: "tabla fila row" },
  { id: "vo-column-read", reader: "voiceover", category: "Tablas", title: "Leer columna desde la posición actual", description: "Lee la columna desde la posición actual hasta el final.", combos: [["VO", "R", "C"]], tags: "tabla columna column" }
];

const READER_META = {
  jaws: {
    name: "JAWS",
    platform: "Windows",
    note: "JAWS suele usar Insert como tecla modificadora. En modo formulario, Enter activa el modo y Numpad + vuelve al modo exploración.",
    modifierHelp: "Insert funciona como tecla JAWS en muchos comandos."
  },
  nvda: {
    name: "NVDA",
    platform: "Windows",
    note: "En NVDA, la tecla NVDA suele ser Insert. También puede configurarse como Caps Lock; aquí se visualiza como Insert para facilitar la lectura.",
    modifierHelp: "La tecla NVDA se representa visualmente como Insert."
  },
  voiceover: {
    name: "VoiceOver",
    platform: "macOS",
    note: "En VoiceOver, VO equivale a Control + Option. Cuando un comando usa VO, se marcan Control y Option en el teclado visual.",
    modifierHelp: "VO equivale visualmente a Control + Option."
  }
};

const KEY_LABELS = {
  Control: "Ctrl",
  Alt: "Alt",
  Option: "Option",
  Command: "⌘ Cmd",
  Shift: "Shift",
  Insert: "Insert",
  NVDA: "NVDA",
  VO: "VO",
  Space: "Space",
  Enter: "Enter",
  Tab: "Tab",
  Escape: "Esc",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Backspace: "⌫",
  CapsLock: "Caps",
  Home: "Home",
  End: "End",
  PageUp: "PgUp",
  PageDown: "PgDn",
  Numpad5: "Num 5",
  NumpadPlus: "Num +",
  ";": ";",
  ",": ",",
  ".": ".",
  "/": "/",
  "-": "-",
  "=": "=",
  "[": "[",
  "]": "]"
};

function key(id, size = "") {
  return { id, size };
}

const WINDOWS_KEYBOARD = [
  [key("Escape", "small"), key("F1"), key("F2"), key("F3"), key("F4"), key("F5"), key("F6"), key("F7"), key("F8"), key("F9"), key("F10"), key("F11"), key("F12")],
  [key("1"), key("2"), key("3"), key("4"), key("5"), key("6"), key("7"), key("8"), key("9"), key("0"), key("-"), key("="), key("Backspace", "wide")],
  [key("Tab", "wide"), key("Q"), key("W"), key("E"), key("R"), key("T"), key("Y"), key("U"), key("I"), key("O"), key("P"), key("["), key("]")],
  [key("CapsLock", "xl"), key("A"), key("S"), key("D"), key("F"), key("G"), key("H"), key("J"), key("K"), key("L"), key(";"), key("Enter", "xl")],
  [key("Shift", "xxl"), key("Z"), key("X"), key("C"), key("V"), key("B"), key("N"), key("M"), key(","), key("."), key("/"), key("Shift", "xxl")],
  [key("Control", "wide"), key("Alt", "wide"), key("Insert", "wide"), key("Space", "space"), key("Alt", "wide"), key("Control", "wide")],
  [key("Home", "wide"), key("End", "wide"), key("ArrowLeft"), key("ArrowUp"), key("ArrowDown"), key("ArrowRight"), key("Numpad5", "wide"), key("NumpadPlus", "wide")]
];

const MAC_KEYBOARD = [
  [key("Escape", "small"), key("F1"), key("F2"), key("F3"), key("F4"), key("F5"), key("F6"), key("F7"), key("F8"), key("F9"), key("F10"), key("F11"), key("F12")],
  [key("1"), key("2"), key("3"), key("4"), key("5"), key("6"), key("7"), key("8"), key("9"), key("0"), key("-"), key("="), key("Backspace", "wide")],
  [key("Tab", "wide"), key("Q"), key("W"), key("E"), key("R"), key("T"), key("Y"), key("U"), key("I"), key("O"), key("P"), key("["), key("]")],
  [key("CapsLock", "xl"), key("A"), key("S"), key("D"), key("F"), key("G"), key("H"), key("J"), key("K"), key("L"), key(";"), key("Enter", "xl")],
  [key("Shift", "xxl"), key("Z"), key("X"), key("C"), key("V"), key("B"), key("N"), key("M"), key(","), key("."), key("/"), key("Shift", "xxl")],
  [key("Control", "wide"), key("Option", "wide"), key("Command", "wide"), key("Space", "space"), key("Command", "wide"), key("Option", "wide"), key("Control", "wide")],
  [key("Home", "wide"), key("End", "wide"), key("ArrowLeft"), key("ArrowUp"), key("ArrowDown"), key("ArrowRight")]
];

const state = {
  reader: "jaws",
  category: "Todos",
  query: "",
  keyFilter: "",
  selectedId: "jaws-links-list",
  selectedComboIndex: 0
};

const els = {
  readerButtons: document.querySelectorAll(".reader-button"),
  readerNote: document.querySelector("#reader-note"),
  search: document.querySelector("#search-input"),
  clearSearch: document.querySelector("#clear-search"),
  categories: document.querySelector("#category-filters"),
  filterBar: document.querySelector("#active-filter-bar"),
  filterSummaryHelp: document.querySelector("#filter-summary-help"),
  results: document.querySelector("#shortcut-results"),
  count: document.querySelector("#result-count"),
  selectedReader: document.querySelector("#selected-reader"),
  selectedTitle: document.querySelector("#selected-title"),
  selectedCategory: document.querySelector("#selected-category"),
  selectedDescription: document.querySelector("#selected-description"),
  selectedCombo: document.querySelector("#selected-combo"),
  comboAlternatives: document.querySelector("#combo-alternatives"),
  keyboard: document.querySelector("#visual-keyboard"),
  textualKeys: document.querySelector("#textual-keys-content")
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function labelKey(keyId) {
  return KEY_LABELS[keyId] || keyId;
}

function comboLabel(combo) {
  return combo.map(labelKey).join(" + ");
}

function comboGroups(combo, reader) {
  return combo.map((keyId) => {
    if (keyId === "VO" && reader === "voiceover") {
      return { original: "VO", keys: ["Control", "Option"], label: "VO = Control + Option" };
    }
    if (keyId === "NVDA" && reader === "nvda") {
      return { original: "NVDA", keys: ["Insert"], label: "NVDA = Insert" };
    }
    return { original: keyId, keys: [keyId], label: labelKey(keyId) };
  });
}

function activeKeyMap(combo, reader) {
  const map = new Map();
  comboGroups(combo, reader).forEach((group, index) => {
    group.keys.forEach((keyId) => {
      const normal = normalize(keyId);
      if (!map.has(normal)) {
        map.set(normal, { order: index + 1, source: group.original, label: group.label });
      }
    });
  });
  return map;
}

function comboUsesKey(combo, keyId, reader) {
  const filter = normalize(keyId);
  return comboGroups(combo, reader).some((group) => group.keys.some((item) => normalize(item) === filter));
}

function shortcutUsesKey(shortcut, keyId) {
  return shortcut.combos.some((combo) => comboUsesKey(combo, keyId, shortcut.reader));
}

function categoriesForReader(reader) {
  return ["Todos", ...new Set(DATA.filter((item) => item.reader === reader).map((item) => item.category))];
}

function searchableText(shortcut) {
  return [
    shortcut.title,
    shortcut.description,
    shortcut.category,
    shortcut.tags,
    shortcut.combos.map((combo) => comboLabel(combo)).join(" "),
    shortcut.combos.flat().map(labelKey).join(" ")
  ].join(" ").toLowerCase();
}

function filteredShortcuts() {
  const query = state.query.trim().toLowerCase();
  return DATA.filter((shortcut) => {
    const sameReader = shortcut.reader === state.reader;
    const sameCategory = state.category === "Todos" || shortcut.category === state.category;
    const matchesQuery = !query || searchableText(shortcut).includes(query);
    const matchesKey = !state.keyFilter || shortcutUsesKey(shortcut, state.keyFilter);
    return sameReader && sameCategory && matchesQuery && matchesKey;
  });
}

function getSelectedShortcut() {
  return DATA.find((item) => item.id === state.selectedId) || null;
}

function ensureSelection() {
  const list = filteredShortcuts();
  if (!list.length) {
    state.selectedId = "";
    state.selectedComboIndex = 0;
    return;
  }

  if (!list.some((item) => item.id === state.selectedId)) {
    state.selectedId = list[0].id;
    state.selectedComboIndex = 0;
  }

  const selected = getSelectedShortcut();
  if (selected && state.selectedComboIndex >= selected.combos.length) {
    state.selectedComboIndex = 0;
  }
}

function renderReaderButtons() {
  els.readerButtons.forEach((button) => {
    const active = button.dataset.reader === state.reader;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderCategories() {
  els.categories.innerHTML = categoriesForReader(state.reader).map((category) => {
    const active = category === state.category;
    const count = category === "Todos"
      ? DATA.filter((item) => item.reader === state.reader).length
      : DATA.filter((item) => item.reader === state.reader && item.category === category).length;
    return `
      <button
        class="category-button ${active ? "is-active" : ""}"
        type="button"
        data-category="${escapeHtml(category)}"
        aria-pressed="${active}"
      >${escapeHtml(category)} <span aria-hidden="true">${count}</span></button>
    `;
  }).join("");

  els.categories.querySelectorAll(".category-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      state.selectedComboIndex = 0;
      render();
    });
  });
}

function renderFilterBar() {
  const chips = [];

  if (state.query.trim()) {
    chips.push({
      type: "query",
      label: `Búsqueda activa: “${state.query.trim()}”`,
      action: "Borrar búsqueda"
    });
  }

  if (state.category !== "Todos") {
    chips.push({
      type: "category",
      label: `Categoría activa: ${state.category}`,
      action: "Ver todas"
    });
  }

  if (state.keyFilter) {
    chips.push({
      type: "key",
      label: `Mostrando funciones que usan la tecla ${labelKey(state.keyFilter)}`,
      action: "Quitar filtro"
    });
  }

  els.filterSummaryHelp.textContent = chips.length
    ? `${chips.length} filtro${chips.length === 1 ? "" : "s"} activo${chips.length === 1 ? "" : "s"}`
    : "Sin filtros";

  if (!chips.length) {
    els.filterBar.innerHTML = "";
    return;
  }

  const clearAll = chips.length > 1
    ? `<button class="clear-all-filters" type="button" data-filter-type="all">Quitar todos</button>`
    : "";

  els.filterBar.innerHTML = `
    <div class="active-filter-heading">Filtros aplicados</div>
    ${chips.map((chip) => `
      <div class="filter-chip">
        <span>${escapeHtml(chip.label)}</span>
        <button type="button" data-filter-type="${chip.type}">${escapeHtml(chip.action)}</button>
      </div>
    `).join("")}
    ${clearAll}
  `;

  els.filterBar.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.filterType;

      if (type === "query" || type === "all") {
        state.query = "";
        els.search.value = "";
      }
      if (type === "category" || type === "all") {
        state.category = "Todos";
      }
      if (type === "key" || type === "all") {
        state.keyFilter = "";
      }

      state.selectedComboIndex = 0;
      render();
    });
  });
}

function renderSelectedCommand() {
  const selected = getSelectedShortcut();
  const meta = READER_META[state.reader];
  els.readerNote.textContent = meta.note;

  if (!selected) {
    els.selectedReader.textContent = meta.name;
    els.selectedTitle.textContent = "Sin resultados";
    els.selectedCategory.textContent = "";
    els.selectedDescription.textContent = "No hay funciones que coincidan con los filtros actuales.";
    els.selectedCombo.innerHTML = `<p class="empty-state">Borra la búsqueda, cambia de categoría o quita el filtro por tecla.</p>`;
    els.comboAlternatives.innerHTML = "";
    els.textualKeys.textContent = "No hay combinación activa.";
    return;
  }

  const combo = selected.combos[state.selectedComboIndex] || selected.combos[0];
  els.selectedReader.textContent = `${meta.name} · ${meta.platform}`;
  els.selectedTitle.textContent = selected.title;
  els.selectedCategory.textContent = selected.category;
  els.selectedDescription.textContent = `${selected.description} ${meta.modifierHelp}`;

  els.selectedCombo.innerHTML = combo.map((keyId, index) => `
    ${index > 0 ? `<span class="combo-plus" aria-hidden="true">+</span>` : ""}
    <span class="combo-key">
      <span class="order" aria-hidden="true">${index + 1}</span>
      <span>${escapeHtml(labelKey(keyId))}</span>
    </span>
  `).join("");

  els.textualKeys.textContent = `Para “${selected.title}”, pulsa: ${comboLabel(combo)}.`;

  if (selected.combos.length > 1) {
    els.comboAlternatives.innerHTML = `
      <span class="visually-hidden">Combinaciones alternativas para ${escapeHtml(selected.title)}</span>
      ${selected.combos.map((item, index) => `
        <button
          class="combo-alt-button ${index === state.selectedComboIndex ? "is-active" : ""}"
          type="button"
          data-combo-index="${index}"
          aria-pressed="${index === state.selectedComboIndex}"
        >${escapeHtml(comboLabel(item))}</button>
      `).join("")}
    `;
  } else {
    els.comboAlternatives.innerHTML = "";
  }

  els.comboAlternatives.querySelectorAll(".combo-alt-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedComboIndex = Number(button.dataset.comboIndex || 0);
      render();
    });
  });
}

function renderKeyboard() {
  const layout = state.reader === "voiceover" ? MAC_KEYBOARD : WINDOWS_KEYBOARD;
  const selected = getSelectedShortcut();
  const combo = selected ? selected.combos[state.selectedComboIndex] || selected.combos[0] : [];
  const activeMap = activeKeyMap(combo, state.reader);
  const filter = normalize(state.keyFilter);

  els.keyboard.innerHTML = layout.map((row, rowIndex) => `
    <div class="keyboard-row" role="group" aria-label="Fila ${rowIndex + 1} del teclado">
      ${row.map((item) => {
        const keyId = item.id;
        const keyInfo = activeMap.get(normalize(keyId));
        const isShortcut = Boolean(keyInfo);
        const isFiltered = Boolean(filter && normalize(keyId) === filter);
        const label = labelKey(keyId);
        const aria = isShortcut
          ? `Tecla ${label}. Forma parte del atajo seleccionado en la posición ${keyInfo.order}. Pulsar para filtrar funciones que usan esta tecla.`
          : `Tecla ${label}. Pulsar para filtrar funciones que usan esta tecla.`;
        return `
          <button
            class="key-button ${isShortcut ? "is-shortcut" : ""} ${isFiltered ? "is-filtered" : ""}"
            type="button"
            data-key="${escapeHtml(keyId)}"
            data-size="${escapeHtml(item.size || "")}" 
            aria-pressed="${isFiltered}"
            aria-label="${escapeHtml(aria)}"
          >
            <span class="key-marker" aria-hidden="true">${isShortcut ? keyInfo.order : ""}</span>
            <span class="key-label">${escapeHtml(label)}</span>
            <span class="key-caption" aria-hidden="true">${isShortcut ? "Atajo" : ""}</span>
          </button>
        `;
      }).join("")}
    </div>
  `).join("");

  els.keyboard.querySelectorAll(".key-button").forEach((button) => {
    button.addEventListener("click", () => {
      const keyId = button.dataset.key;
      state.keyFilter = state.keyFilter === keyId ? "" : keyId;
      state.selectedComboIndex = 0;
      render();
    });
  });
}

function groupByCategory(list) {
  return list.reduce((groups, shortcut) => {
    if (!groups.has(shortcut.category)) groups.set(shortcut.category, []);
    groups.get(shortcut.category).push(shortcut);
    return groups;
  }, new Map());
}

function renderResults() {
  const list = filteredShortcuts();
  els.count.textContent = `${list.length} función${list.length === 1 ? "" : "es"}`;

  if (!list.length) {
    els.results.innerHTML = `
      <li class="empty-state">
        <strong>No hay funciones con esos filtros.</strong><br>
        Prueba a borrar la búsqueda, cambiar de categoría o quitar el filtro por tecla.
      </li>
    `;
    return;
  }

  const groups = groupByCategory(list);
  const parts = [];
  groups.forEach((items, category) => {
    parts.push(`<li class="function-group-title" aria-hidden="true">${escapeHtml(category)}</li>`);
    items.forEach((shortcut) => {
      const selected = shortcut.id === state.selectedId;
      const combo = shortcut.combos[0];
      parts.push(`
        <li class="function-item">
          <button
            class="function-button"
            type="button"
            data-id="${escapeHtml(shortcut.id)}"
            aria-current="${selected ? "true" : "false"}"
            aria-label="${escapeHtml(`${shortcut.title}. Atajo: ${comboLabel(combo)}. ${selected ? "Seleccionado." : "Mostrar en el teclado visual."}`)}"
          >
            <span class="function-meta">
              <span class="function-title-compact">${escapeHtml(shortcut.title)}</span>
              <span class="mini-combo" aria-hidden="true">
                ${combo.map((keyId, index) => `
                  ${index > 0 ? `<span>+</span>` : ""}
                  <kbd>${escapeHtml(labelKey(keyId))}</kbd>
                `).join("")}
              </span>
            </span>
          </button>
        </li>
      `);
    });
  });

  els.results.innerHTML = parts.join("");

  els.results.querySelectorAll(".function-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.id;
      state.selectedComboIndex = 0;
      render();
    });

    button.addEventListener("keydown", (event) => {
      const buttons = Array.from(els.results.querySelectorAll(".function-button"));
      const index = buttons.indexOf(event.currentTarget);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = buttons[index + 1] || buttons[0];
        next.focus();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = buttons[index - 1] || buttons[buttons.length - 1];
        prev.focus();
      }
      if (event.key === "Home") {
        event.preventDefault();
        buttons[0]?.focus();
      }
      if (event.key === "End") {
        event.preventDefault();
        buttons[buttons.length - 1]?.focus();
      }
    });
  });
}

function render() {
  ensureSelection();
  renderReaderButtons();
  renderCategories();
  renderFilterBar();
  renderSelectedCommand();
  renderKeyboard();
  renderResults();
}

els.readerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.reader = button.dataset.reader;
    state.category = "Todos";
    state.query = "";
    state.keyFilter = "";
    state.selectedComboIndex = 0;
    const first = DATA.find((item) => item.reader === state.reader);
    state.selectedId = first ? first.id : "";
    els.search.value = "";
    render();
  });
});

els.search.addEventListener("input", () => {
  state.query = els.search.value;
  state.selectedComboIndex = 0;
  render();
});

els.clearSearch.addEventListener("click", () => {
  state.query = "";
  els.search.value = "";
  state.selectedComboIndex = 0;
  render();
  els.search.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && (state.keyFilter || state.query || state.category !== "Todos")) {
    state.keyFilter = "";
    state.query = "";
    state.category = "Todos";
    state.selectedComboIndex = 0;
    els.search.value = "";
    render();
  }
});

render();
