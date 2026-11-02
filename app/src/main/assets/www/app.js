// rehansCode - Mobile & Node.js Engine
(function() {
  // File Store
  const files = {
    "main.js": `// rehansCode Starter Script
console.log("Welcome to rehansCode! 🚀");

function greet(user) {
    return `Hello, ${user}! Node.js runtime is active.`;
}

console.log(greet("Developer"));
`,
    "index.html": `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>rehansCode App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello from rehansCode!</h1>
  <p>Live Web & Node.js preview on Android.</p>
  <button onclick="alert('Running live on Android!')">Click Me</button>
</body>
</html>`,
    "style.css": `body {
  background-color: #181a1f;
  color: #00d2ff;
  font-family: monospace;
  padding: 24px;
  text-align: center;
}
button {
  background: #007acc;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}`
  };

  let activeFile = "main.js";
  let openTabs = ["main.js"];
  let undoStack = [];
  let redoStack = [];
  let isTerminalOpen = false;

  // DOM Elements
  const headerFileName = document.getElementById("headerFileName");
  const tabsContainer = document.getElementById("tabsContainer");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const editorScreen = document.getElementById("editorScreen");
  const terminalScreen = document.getElementById("terminalScreen");
  const codeTextarea = document.getElementById("codeTextarea");
  const lineGutter = document.getElementById("lineGutter");
  const statLineCol = document.getElementById("statLineCol");
  const statChars = document.getElementById("statChars");
  const statLanguage = document.getElementById("statLanguage");
  const fileTreeList = document.getElementById("fileTreeList");
  const sidebarDrawer = document.getElementById("sidebarDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const findBar = document.getElementById("findBar");
  const findInput = document.getElementById("findInput");
  const replaceInput = document.getElementById("replaceInput");
  const terminalBody = document.getElementById("terminalBody");
  const termInput = document.getElementById("termInput");
  const runModal = document.getElementById("runModal");
  const previewFrame = document.getElementById("previewFrame");

  // Init App
  function init() {
    renderTabs();
    renderFileList();
    setupEventListeners();
    openFile("main.js");
  }

  function setupEventListeners() {
    document.getElementById("btnDrawer").onclick = () => openDrawer("explorer");
    document.getElementById("btnSaveFile").onclick = saveActiveFile;
    document.getElementById("btnToggleTerminal").onclick = toggleTerminal;
    document.getElementById("btnRunApp").onclick = runProjectPreview;
    document.getElementById("btnNewTab").onclick = createNewFile;
    document.getElementById("btnFindNext").onclick = findNext;
    document.getElementById("btnReplace").onclick = replaceNext;
    document.getElementById("btnReplaceAll").onclick = replaceAll;
    document.getElementById("btnCloseFind").onclick = () => findBar.classList.add("hidden");
    document.getElementById("btnScrollTop").onclick = () => codeTextarea.scrollTo({ top: 0, behavior: "smooth" });
    
    codeTextarea.addEventListener("input", handleTextChange);
    codeTextarea.addEventListener("keyup", updateStats);
    codeTextarea.addEventListener("click", updateStats);
    codeTextarea.addEventListener("scroll", syncLineScroll);

    termInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleTerminalCommand();
    });
    document.getElementById("btnTermEnter").onclick = handleTerminalCommand;
  }

  function openFile(filename) {
    if (!files[filename]) return;
    activeFile = filename;
    if (!openTabs.includes(filename)) {
      openTabs.push(filename);
    }

    welcomeScreen.classList.add("hidden");
    terminalScreen.classList.add("hidden");
    editorScreen.classList.remove("hidden");
    isTerminalOpen = false;

    headerFileName.textContent = filename;
    codeTextarea.value = files[filename];
    undoStack = [];
    redoStack = [];

    detectLanguage(filename);
    updateLineNumbers();
    updateStats();
    renderTabs();
    renderFileList();
  }

  window.openFile = openFile;

  function renderTabs() {
    tabsContainer.innerHTML = "";
    openTabs.forEach(name => {
      const tab = document.createElement("div");
      tab.className = "tab-item" + (name === activeFile && !isTerminalOpen ? " active" : "");
      
      const icon = getFileIcon(name);
      tab.innerHTML = `<span>${icon}</span> <span>${name}</span> <span class="tab-close" onclick="closeTab(event, '${name}')">✕</span>`;
      tab.onclick = (e) => {
        if (!e.target.classList.contains("tab-close")) {
          openFile(name);
        }
      };
      tabsContainer.appendChild(tab);
    });

    if (isTerminalOpen) {
      const termTab = document.createElement("div");
      termTab.className = "tab-item active";
      termTab.innerHTML = `<span>💻</span> <span>Terminal 1</span> <span class="tab-close" onclick="toggleTerminal()">✕</span>`;
      tabsContainer.appendChild(termTab);
    }
  }

  window.closeTab = function(e, filename) {
    e.stopPropagation();
    openTabs = openTabs.filter(t => t !== filename);
    if (activeFile === filename) {
      if (openTabs.length > 0) {
        openFile(openTabs[openTabs.length - 1]);
      } else {
        editorScreen.classList.add("hidden");
        welcomeScreen.classList.remove("hidden");
        headerFileName.textContent = "Welcome";
      }
    }
    renderTabs();
  };

  function renderFileList() {
    fileTreeList.innerHTML = "";
    Object.keys(files).forEach(name => {
      const row = document.createElement("div");
      row.className = "file-row" + (name === activeFile ? " active" : "");
      row.innerHTML = `
        <span class="file-icon">${getFileIcon(name)}</span>
        <span class="file-name">${name}</span>
        <span class="file-delete" onclick="deleteFile(event, '${name}')">✕</span>
      `;
      row.onclick = () => {
        openFile(name);
        closeDrawer();
      };
      fileTreeList.appendChild(row);
    });
  }

  function getFileIcon(name) {
    const l = name.toLowerCase();
    if (l.endsWith(".js") || l.endsWith(".jsx")) return "⚡";
    if (l.endsWith(".html")) return "🌐";
    if (l.endsWith(".css")) return "🎨";
    if (l.endsWith(".json")) return "⚙️";
    if (l.endsWith(".py")) return "🐍";
    return "📄";
  }

  function detectLanguage(name) {
    const l = name.toLowerCase();
    let lang = "Plain Text";
    if (l.endsWith(".js")) lang = "JavaScript";
    else if (l.endsWith(".jsx")) lang = "React JSX";
    else if (l.endsWith(".html")) lang = "HTML5";
    else if (l.endsWith(".css")) lang = "CSS3";
    else if (l.endsWith(".json")) lang = "JSON";
    else if (l.endsWith(".py")) lang = "Python";
    statLanguage.textContent = lang;
  }

  function handleTextChange() {
    files[activeFile] = codeTextarea.value;
    updateLineNumbers();
    updateStats();
  }

  function updateLineNumbers() {
    const lines = codeTextarea.value.split("\n").length || 1;
    let gutterHtml = "";
    for (let i = 1; i <= lines; i++) {
      gutterHtml += i + "<br>";
    }
    lineGutter.innerHTML = gutterHtml;
  }

  function updateStats() {
    const text = codeTextarea.value;
    const pos = codeTextarea.selectionStart;
    const line = text.substring(0, pos).split("\n").length;
    const col = pos - text.lastIndexOf("\n", pos - 1);
    statLineCol.textContent = `Ln ${line}, Col ${col}`;
    statChars.textContent = `${text.length} chars`;
  }

  function syncLineScroll() {
    lineGutter.scrollTop = codeTextarea.scrollTop;
  }

  window.saveActiveFile = function() {
    files[activeFile] = codeTextarea.value;
    showToast("Saved " + activeFile);
  };

  window.createNewFile = function() {
    const name = prompt("Enter new file name (e.g. script.js, page.html):");
    if (!name) return;
    if (files[name]) {
      alert("File already exists");
      return;
    }
    files[name] = "// " + name + "\n";
    openFile(name);
  };

  window.createNewFolder = function() {
    const f = prompt("Enter folder name:");
    if (!f) return;
    showToast("Folder " + f + " created");
  };

  window.deleteFile = function(e, name) {
    e.stopPropagation();
    if (confirm("Delete " + name + "?")) {
      delete files[name];
      openTabs = openTabs.filter(t => t !== name);
      if (activeFile === name) {
        if (openTabs.length > 0) openFile(openTabs[0]);
        else {
          editorScreen.classList.add("hidden");
          welcomeScreen.classList.remove("hidden");
        }
      }
      renderTabs();
      renderFileList();
    }
  };

  // Terminal
  function toggleTerminal() {
    isTerminalOpen = !isTerminalOpen;
    if (isTerminalOpen) {
      welcomeScreen.classList.add("hidden");
      editorScreen.classList.add("hidden");
      terminalScreen.classList.remove("hidden");
      headerFileName.textContent = "Terminal 1";
      termInput.focus();
    } else {
      terminalScreen.classList.add("hidden");
      if (activeFile && files[activeFile]) {
        openFile(activeFile);
      } else {
        welcomeScreen.classList.remove("hidden");
      }
    }
    renderTabs();
  }
  window.toggleTerminal = toggleTerminal;

  function handleTerminalCommand() {
    const cmd = termInput.value.trim();
    if (!cmd) return;
    
    appendTermLine("root@localhost ~/rehanscode $ " + cmd, "info");
    termInput.value = "";

    const lower = cmd.toLowerCase();
    if (lower === "clear") {
      terminalBody.innerHTML = "";
    } else if (lower === "help") {
      appendTermLine("Available commands: npm run dev, node main.js, ls, cat <file>, git status, clear, help", "info");
    } else if (lower === "ls") {
      appendTermLine(Object.keys(files).join("   "), "success");
    } else if (lower.startsWith("cat ")) {
      const f = cmd.substring(4).trim();
      if (files[f]) appendTermLine(files[f], "");
      else appendTermLine("File not found: " + f, "err");
    } else if (lower === "npm run dev" || lower === "npm dev") {
      appendTermLine("> rehanscode@1.0.0 dev\n> vite\n", "info");
      setTimeout(() => {
        appendTermLine("  VITE v8.0.16  ready in 249 ms", "success");
        appendTermLine("  ➜  Local:   http://localhost:5173/", "info");
        appendTermLine("  ➜  Network: use --host to expose", "info");
        appendTermLine("  ➜  press h + enter to show help", "");
      }, 300);
    } else if (lower.startsWith("node ") || lower === "node") {
      try {
        const out = eval(codeTextarea.value);
        appendTermLine("Node Output: " + (out !== undefined ? out : "Done (0 errors)"), "success");
      } catch (err) {
        appendTermLine("Error: " + err.message, "err");
      }
    } else if (lower.startsWith("git ")) {
      if (lower.includes("status")) {
        appendTermLine("On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges to be committed:\n  modified:   main.js", "warn");
      } else {
        appendTermLine("Git command executed successfully.", "success");
      }
    } else {
      appendTermLine("Executing: " + cmd + "... OK", "success");
    }

    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function appendTermLine(text, type) {
    const l = document.createElement("div");
    l.className = "term-line " + (type || "");
    l.innerText = text;
    terminalBody.appendChild(l);
  }

  window.clearTerminal = function() {
    terminalBody.innerHTML = "";
  };

  // Quick Keys
  window.insertSymbol = function(sym) {
    const start = codeTextarea.selectionStart;
    const end = codeTextarea.selectionEnd;
    const val = codeTextarea.value;
    codeTextarea.value = val.substring(0, start) + sym + val.substring(end);
    codeTextarea.selectionStart = codeTextarea.selectionEnd = start + sym.length;
    codeTextarea.focus();
    handleTextChange();
  };

  // Run Preview
  function runProjectPreview() {
    const html = files["index.html"] || "<h1>No index.html</h1>";
    const css = files["style.css"] || "";
    const js = files["main.js"] || "";

    const combined = `
      <!DOCTYPE html>
      <html>
      <head><style>${css}</style></head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
      </html>
    `;

    runModal.classList.remove("hidden");
    previewFrame.srcdoc = combined;
  }

  window.closeRunModal = function() {
    runModal.classList.add("hidden");
    previewFrame.srcdoc = "";
  };

  // Drawer
  window.openDrawer = function(tab) {
    sidebarDrawer.classList.add("active");
    drawerOverlay.classList.add("active");
    if (tab) switchDrawerTab(tab);
  };

  window.closeDrawer = function() {
    sidebarDrawer.classList.remove("active");
    drawerOverlay.classList.remove("active");
  };

  window.switchDrawerTab = function(tabName) {
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelectorAll(".rail-btn").forEach(b => b.classList.remove("active"));

    if (tabName === "explorer") {
      document.getElementById("panelExplorer").classList.add("active");
    } else if (tabName === "git") {
      document.getElementById("panelGit").classList.add("active");
    } else if (tabName === "plugins") {
      document.getElementById("panelPlugins").classList.add("active");
    } else if (tabName === "settings") {
      document.getElementById("panelSettings").classList.add("active");
    } else if (tabName === "terminal") {
      closeDrawer();
      toggleTerminal();
      return;
    }
  };

  // Toast
  function showToast(msg) {
    const t = document.createElement("div");
    t.style.position = "fixed";
    t.style.bottom = "36px";
    t.style.left = "50%";
    t.style.transform = "translateX(-50%)";
    t.style.background = "#2ea043";
    t.style.color = "#fff";
    t.style.padding = "6px 14px";
    t.style.borderRadius = "20px";
    t.style.fontSize = "12px";
    t.style.zIndex = "999";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }

  window.toggleFindBar = function() {
    findBar.classList.toggle("hidden");
    if (!findBar.classList.contains("hidden")) findInput.focus();
  };

  function findNext() {
    const q = findInput.value;
    if (!q) return;
    const idx = codeTextarea.value.indexOf(q, codeTextarea.selectionEnd);
    if (idx !== -1) {
      codeTextarea.setSelectionRange(idx, idx + q.length);
      codeTextarea.focus();
    } else {
      const wrap = codeTextarea.value.indexOf(q, 0);
      if (wrap !== -1) {
        codeTextarea.setSelectionRange(wrap, wrap + q.length);
        codeTextarea.focus();
      } else {
        alert("Not found");
      }
    }
  }

  function replaceNext() {
    const q = findInput.value;
    const r = replaceInput.value;
    if (!q) return;
    const sel = codeTextarea.value.substring(codeTextarea.selectionStart, codeTextarea.selectionEnd);
    if (sel === q) {
      insertSymbol(r);
      findNext();
    } else {
      findNext();
    }
  }

  function replaceAll() {
    const q = findInput.value;
    const r = replaceInput.value;
    if (!q) return;
    codeTextarea.value = codeTextarea.value.replaceAll(q, r);
    handleTextChange();
    showToast("Replaced all");
  }

  window.installPlugin = function(btn) {
    btn.textContent = "Installing...";
    setTimeout(() => {
      btn.textContent = "Installed";
      btn.classList.add("installed");
      showToast("Plugin activated!");
    }, 800);
  };

  window.doGitCommit = function() {
    const msg = document.getElementById("gitCommitInput").value;
    if (!msg) return;
    showToast("Committed to main: " + msg);
    document.getElementById("gitCommitInput").value = "";
    document.getElementById("gitChangesCount").textContent = "0";
    document.getElementById("gitChangesList").innerHTML = "<div style='color:#5c6370;font-size:11px;padding:8px 0'>Working tree clean</div>";
  };

  window.openCommandPalette = function() {
    const cmd = prompt("Command Palette:\n- New file\n- Toggle terminal\n- Run project\n- Git commit\n- Settings");
    if (!cmd) return;
    const c = cmd.toLowerCase();
    if (c.includes("terminal")) toggleTerminal();
    else if (c.includes("file")) createNewFile();
    else if (c.includes("run")) runProjectPreview();
    else if (c.includes("git")) openDrawer("git");
    else if (c.includes("set")) openDrawer("settings");
  };

  window.toggleThemeModal = function() {
    openDrawer("settings");
  };

  window.changeTheme = function(theme) {
    showToast("Theme changed to " + theme);
  };

  window.changeFontSize = function(size) {
    codeTextarea.style.fontSize = size;
    lineGutter.style.fontSize = size;
  };

  window.toggleWordWrap = function(enable) {
    codeTextarea.style.whiteSpace = enable ? "pre-wrap" : "pre";
  };

  init();
})();