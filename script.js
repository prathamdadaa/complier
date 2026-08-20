(function(){

  /* ============================================================
     STARTER CODE
     ============================================================ */
  const WEB_STARTER = {
    html: `<h1>Hello, Dada 🎩</h1>
<p>Edit the HTML, CSS and JS tabs, then hit <strong>Run</strong>.</p>
<button id="shuffle">Shuffle words</button>
<p id="poem">chance / language / collage / noise</p>`,
    css: `body{
  font-family: system-ui, sans-serif;
  background: #f3ede0;
  color: #111;
  padding: 40px;
  text-align: center;
}
h1{ color:#e94f37; }
button{
  margin-top: 12px;
  padding: 10px 16px;
  border: 2px solid #111;
  background: #e8b93a;
  cursor: pointer;
  font-weight: 700;
}
#poem{ font-style: italic; margin-top: 16px; }`,
    js: `console.log("Dada compiler booted.");

const words = ["chance","language","collage","noise","scissors","manifesto","nonsense","echo"];

document.getElementById('shuffle').addEventListener('click', () => {
  const line = Array.from({length:4}, () => words[Math.floor(Math.random()*words.length)]).join(' / ');
  document.getElementById('poem').textContent = line;
  console.log("New line:", line);
});`
  };

  const PROGRAM_LANGS = {
    python: {
      label: 'main.py',
      cmMode: 'python',
      piston: { language: 'python', version: '*' },
      filename: 'main.py',
      starter: `print("Hello from Dada Python!")

name = input("What's your name? ")
print(f"Hello, {name}! Welcome to the compiler.")`
    },
    cpp: {
      label: 'main.cpp',
      cmMode: 'text/x-c++src',
      piston: { language: 'cpp', version: '*' },
      filename: 'main.cpp',
      starter: `#include <iostream>
using namespace std;

int main(){
    cout << "Hello from Dada C++!" << endl;

    string name;
    cout << "What's your name? ";
    getline(cin, name);
    cout << "Hello, " << name << "! Welcome to the compiler." << endl;
    return 0;
}`
    },
    csharp: {
      label: 'main.cs',
      cmMode: 'text/x-csharp',
      piston: { language: 'csharp', version: '*' },
      filename: 'main.cs',
      starter: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from Dada C#!");
        Console.Write("What's your name? ");
        string name = Console.ReadLine();
        Console.WriteLine($"Hello, {name}! Welcome to the compiler.");
    }
}`
    }
  };

  const PISTON_ENDPOINT = 'https://emkc.org/api/v2/piston/execute';

  /* ============================================================
     STATE
     ============================================================ */
  let currentMode = 'web';        // 'web' | 'program'
  let currentProgLang = 'python';
  const webEditors = {};
  let programEditor = null;

  /* ============================================================
     DOM REFS
     ============================================================ */
  const runBtn = document.getElementById('runBtn');
  const resetBtn = document.getElementById('resetBtn');
  const langSelect = document.getElementById('langSelect');
  const modeToggle = document.getElementById('modeToggle');
  const webTabbar = document.getElementById('webTabbar');
  const programTabbar = document.getElementById('programTabbar');
  const progTabLabel = document.getElementById('progTabLabel');
  const preview = document.getElementById('preview');
  const programOutput = document.getElementById('programOutput');
  const stdinBox = document.getElementById('stdinBox');
  const previewLabel = document.getElementById('previewLabel');
  const consoleTitle = document.getElementById('consoleTitle');
  const consoleBody = document.getElementById('consoleBody');
  const consoleEl = document.getElementById('console');

  /* ============================================================
     EDITORS SETUP
     ============================================================ */
  const webModes = { html:'htmlmixed', css:'css', js:'javascript' };
  Object.keys(webModes).forEach(lang => {
    webEditors[lang] = CodeMirror(document.getElementById('slot-'+lang), {
      value: WEB_STARTER[lang],
      mode: webModes[lang],
      theme: 'material-darker',
      lineNumbers: true,
      tabSize: 2,
      indentWithTabs: false,
      autoCloseBrackets: true,
      matchBrackets: true,
      viewportMargin: Infinity
    });
  });

  programEditor = CodeMirror(document.getElementById('slot-program'), {
    value: PROGRAM_LANGS[currentProgLang].starter,
    mode: PROGRAM_LANGS[currentProgLang].cmMode,
    theme: 'material-darker',
    lineNumbers: true,
    tabSize: 4,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    viewportMargin: Infinity
  });

  /* ============================================================
     WEB MODE : TAB SWITCHING
     ============================================================ */
  webTabbar.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      webTabbar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('#slot-html, #slot-css, #slot-js').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('slot-' + tab.dataset.lang).classList.add('active');
      webEditors[tab.dataset.lang].refresh();
    });
  });

  /* ============================================================
     MODE TOGGLE : WEB <-> PROGRAM
     ============================================================ */
  modeToggle.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.mode === currentMode) return;
      currentMode = btn.dataset.mode;

      modeToggle.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const isWeb = currentMode === 'web';

      webTabbar.classList.toggle('hidden', !isWeb);
      programTabbar.classList.toggle('hidden', isWeb);
      langSelect.classList.toggle('hidden', isWeb);
      preview.classList.toggle('hidden', !isWeb);
      programOutput.classList.toggle('hidden', isWeb);

      document.querySelectorAll('#slot-html, #slot-css, #slot-js').forEach(s => s.classList.remove('active'));
      document.getElementById('slot-program').classList.remove('active');

      if (isWeb) {
        const activeTab = webTabbar.querySelector('.tab.active') || webTabbar.querySelector('.tab');
        activeTab.classList.add('active');
        document.getElementById('slot-' + activeTab.dataset.lang).classList.add('active');
        webEditors[activeTab.dataset.lang].refresh();
        previewLabel.textContent = 'live preview';
        consoleTitle.textContent = 'Console';
        clearConsolePanel();
        runWeb();
      } else {
        document.getElementById('slot-program').classList.add('active');
        programEditor.refresh();
        previewLabel.textContent = 'runtime';
        consoleTitle.textContent = 'Output';
        clearConsolePanel();
      }
    });
  });

  langSelect.addEventListener('change', () => {
    currentProgLang = langSelect.value;
    const cfg = PROGRAM_LANGS[currentProgLang];
    progTabLabel.textContent = cfg.label;
    programEditor.setOption('mode', cfg.cmMode);
    programEditor.setValue(cfg.starter);
  });

  /* ============================================================
     CONSOLE / OUTPUT PANEL
     ============================================================ */
  document.getElementById('consoleToggle').addEventListener('click', () => {
    consoleEl.classList.toggle('collapsed');
  });
  document.getElementById('clearConsole').addEventListener('click', (e) => {
    e.stopPropagation();
    clearConsolePanel();
  });

  function clearConsolePanel(){
    consoleBody.innerHTML = '<div class="console-empty">// output will appear here on run</div>';
  }

  function logToPanel(type, text){
    if (consoleBody.querySelector('.console-empty')) consoleBody.innerHTML = '';
    const line = document.createElement('div');
    line.className = 'console-line ' + type;
    const prefix = type === 'error' ? '✖ ' : type === 'warn' ? '⚠ ' : type === 'info' ? '· ' : '› ';
    line.textContent = prefix + text;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  window.addEventListener('message', (e) => {
    if (e.data && e.data.__dadaConsole) {
      const text = e.data.args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch(err){ return String(a); }
      }).join(' ');
      logToPanel(e.data.level, text);
    }
  });

  /* ============================================================
     RUN : WEB MODE (iframe srcdoc)
     ============================================================ */
  function runWeb(){
    const html = webEditors.html.getValue();
    const css = webEditors.css.getValue();
    const js = webEditors.js.getValue();

    const doc = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${css}</style>
</head>
<body>
${html}
<script>
  (function(){
    const send = (level) => (...args) => {
      parent.postMessage({ __dadaConsole:true, level, args }, '*');
    };
    console.log = send('log');
    console.warn = send('warn');
    console.error = send('error');
    window.addEventListener('error', (e) => {
      parent.postMessage({ __dadaConsole:true, level:'error', args:[e.message] }, '*');
    });
  })();
<\/script>
<script>
try {
${js}
} catch(err){
  parent.postMessage({ __dadaConsole:true, level:'error', args:[err.message] }, '*');
}
<\/script>
</body>
</html>`;

    clearConsolePanel();
    preview.srcdoc = doc;
  }

  /* ============================================================
     RUN : PROGRAM MODE (Piston API)
     ============================================================ */
  async function runProgram(){
    const cfg = PROGRAM_LANGS[currentProgLang];
    const code = programEditor.getValue();
    const stdin = stdinBox.value;

    consoleBody.innerHTML = '';
    logToPanel('info', `Compiling & running ${cfg.filename} (${cfg.piston.language})…`);

    runBtn.disabled = true;
    const originalLabel = runBtn.textContent;
    runBtn.textContent = '⏳ Running…';

    try {
      const res = await fetch(PISTON_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: cfg.piston.language,
          version: cfg.piston.version,
          files: [{ name: cfg.filename, content: code }],
          stdin: stdin
        })
      });

      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`);
      }

      const data = await res.json();
      consoleBody.innerHTML = '';

      if (data.compile && data.compile.stderr) {
        logToPanel('error', 'Compile error:\n' + data.compile.stderr);
      }
      if (data.run) {
        if (data.run.stdout) logToPanel('log', data.run.stdout);
        if (data.run.stderr) logToPanel('error', data.run.stderr);
        logToPanel('info', `Process exited with code ${data.run.code}`);
      }
      if (!data.compile?.stderr && !data.run?.stdout && !data.run?.stderr) {
        logToPanel('info', '(no output)');
      }
    } catch (err) {
      consoleBody.innerHTML = '';
      logToPanel('error', 'Execution failed: ' + err.message);
      logToPanel('info', 'This runs via the free public Piston API — check your network connection.');
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = originalLabel;
    }
  }

  /* ============================================================
     RUN DISPATCH
     ============================================================ */
  function run(){
    if (currentMode === 'web') runWeb();
    else runProgram();
  }

  runBtn.addEventListener('click', run);

  resetBtn.addEventListener('click', () => {
    if (currentMode === 'web') {
      if (!confirm('Reset HTML/CSS/JS to the starter code?')) return;
      Object.keys(WEB_STARTER).forEach(lang => webEditors[lang].setValue(WEB_STARTER[lang]));
      runWeb();
    } else {
      if (!confirm('Reset this program to the starter code?')) return;
      programEditor.setValue(PROGRAM_LANGS[currentProgLang].starter);
      clearConsolePanel();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run();
    }
  });

  // initial run (web mode demo)
  runWeb();
})();
