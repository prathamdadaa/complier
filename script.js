(function(){
  const STARTER = {
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

  const modes = { html:'htmlmixed', css:'css', js:'javascript' };
  const editors = {};

  Object.keys(modes).forEach(lang => {
    editors[lang] = CodeMirror(document.getElementById('slot-'+lang), {
      value: STARTER[lang],
      mode: modes[lang],
      theme: 'material-darker',
      lineNumbers: true,
      tabSize: 2,
      indentWithTabs: false,
      autoCloseBrackets: true,
      matchBrackets: true,
      viewportMargin: Infinity
    });
  });

  // tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.editor-slot').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('slot-' + tab.dataset.lang).classList.add('active');
      editors[tab.dataset.lang].refresh();
    });
  });

  // console panel
  const consoleBody = document.getElementById('consoleBody');
  const consoleEl = document.getElementById('console');
  document.getElementById('consoleToggle').addEventListener('click', () => {
    consoleEl.classList.toggle('collapsed');
  });
  document.getElementById('clearConsole').addEventListener('click', (e) => {
    e.stopPropagation();
    consoleBody.innerHTML = '<div class="console-empty">// output will appear here on run</div>';
  });

  function logToPanel(type, args){
    if(consoleBody.querySelector('.console-empty')) consoleBody.innerHTML = '';
    const line = document.createElement('div');
    line.className = 'console-line ' + type;
    const prefix = type === 'error' ? '✖ ' : type === 'warn' ? '⚠ ' : '› ';
    line.textContent = prefix + args.map(a => {
      try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
      catch(e){ return String(a); }
    }).join(' ');
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  window.addEventListener('message', (e) => {
    if(e.data && e.data.__dadaConsole){
      logToPanel(e.data.level, e.data.args);
    }
  });

  const preview = document.getElementById('preview');

  function run(){
    const html = editors.html.getValue();
    const css = editors.css.getValue();
    const js = editors.js.getValue();

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

    consoleBody.innerHTML = '';
    preview.srcdoc = doc;
  }

  document.getElementById('runBtn').addEventListener('click', run);

  document.getElementById('resetBtn').addEventListener('click', () => {
    if(!confirm('Reset all three files to the starter code?')) return;
    Object.keys(STARTER).forEach(lang => editors[lang].setValue(STARTER[lang]));
    run();
  });

  document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
      e.preventDefault();
      run();
    }
  });

  // initial run
  run();
})();
