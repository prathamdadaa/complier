let editor;
let currentLanguage = 'python';
let pyodideInstance = null;

// Boilerplate Code
const files = {
  python: { name: 'main.py', lang: 'python', code: `# VS Code Web - Python\nnumbers = [1, 2, 3, 4, 5]\nprint(f"Squares: {[x**2 for x in numbers]}")` },
  cpp: { name: 'main.cpp', lang: 'cpp', code: `// VS Code Web - C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from VS Code C++ Engine!" << endl;\n    return 0;\n}` },
  javascript: { name: 'app.js', lang: 'javascript', code: `// VS Code Web - JavaScript\nconst items = ['VS Code', 'Monaco', 'WebAssembly'];\nconsole.log("Components:", items.join(', '));` },
  html: { name: 'index.html', lang: 'html', code: `<!-- VS Code Web - Live Preview -->\n<h1 style="color: #007acc; font-family: sans-serif;">Hello VS Code!</h1>` },
  sql: { name: 'query.sql', lang: 'sql', code: `-- In-Memory SQL Query\nCREATE TABLE Users (id INT, name STRING);\nINSERT INTO Users VALUES (1, 'Alice'), (2, 'Bob');\nSELECT * FROM Users;` }
};

// Initialize Monaco Editor Engine
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' }});
require(['vs/editor/editor.main'], function() {
  editor = monaco.editor.create(document.getElementById('monaco-editor-container'), {
    value: files.python.code,
    language: 'python',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    cursorBlinking: 'smooth'
  });
});

// Load Pyodide Engine
async function initPyodide() {
  try {
    pyodideInstance = await loadPyodide();
    document.getElementById('status-engine').innerHTML = '<i class="codicon codicon-check"></i> Python Engine Ready';
  } catch (err) {
    document.getElementById('status-engine').innerText = 'Engine Error';
  }
}
initPyodide();

// Switch Files in Explorer
document.querySelectorAll('.file-tree .file').forEach(fileEl => {
  fileEl.addEventListener('click', () => {
    document.querySelectorAll('.file-tree .file').forEach(f => f.classList.remove('active'));
    fileEl.classList.add('active');

    currentLanguage = fileEl.dataset.lang;
    const fileData = files[currentLanguage];

    document.getElementById('current-tab-name').innerText = fileData.name;
    document.getElementById('status-lang').innerText = fileData.lang.toUpperCase();

    // Change Monaco Language Model
    monaco.editor.setModelLanguage(editor.getModel(), fileData.lang === 'cpp' ? 'cpp' : fileData.lang);
    editor.setValue(fileData.code);

    // Toggle Preview Panel for HTML
    const consoleOutput = document.getElementById('terminal-output');
    const iframePreview = document.getElementById('web-preview');
    if (currentLanguage === 'html') {
      consoleOutput.style.display = 'none';
      iframePreview.style.display = 'block';
    } else {
      consoleOutput.style.display = 'block';
      iframePreview.style.display = 'none';
    }
  });
});

// Execution Logic
document.getElementById('run-btn').addEventListener('click', executeCode);

async function executeCode() {
  const code = editor.getValue();
  const consoleOutput = document.getElementById('terminal-output');
  consoleOutput.innerText = 'Executing...\n';

  if (currentLanguage === 'python') {
    if (!pyodideInstance) return consoleOutput.innerText = 'Python Engine loading...';
    try {
      pyodideInstance.runPython(`import sys, io; sys.stdout = io.StringIO()`);
      await pyodideInstance.runPythonAsync(code);
      consoleOutput.innerText = pyodideInstance.runPython('sys.stdout.getvalue()') || 'Executed with no output.';
    } catch (err) { consoleOutput.innerText = `Error:\n${err.message}`; }
  } 
  else if (currentLanguage === 'cpp') {
    try {
      let out = '';
      JSCPP.run(code, '', { stdio: { write: s => out += s } });
      consoleOutput.innerText = out || 'Executed with no output.';
    } catch (err) { consoleOutput.innerText = `C++ Error:\n${err}`; }
  } 
  else if (currentLanguage === 'javascript') {
    try {
      let logs = [];
      const customConsole = { log: (...a) => logs.push(a.join(' ')) };
      new Function('console', code)(customConsole);
      consoleOutput.innerText = logs.join('\n') || 'Executed with no output.';
    } catch (err) { consoleOutput.innerText = `JS Error:\n${err.message}`; }
  } 
  else if (currentLanguage === 'html') {
    document.getElementById('web-preview').srcdoc = code;
  } 
  else if (currentLanguage === 'sql') {
    try {
      consoleOutput.innerText = JSON.stringify(alasql(code), null, 2);
    } catch (err) { consoleOutput.innerText = `SQL Error:\n${err.message}`; }
  }
}

// Clear Console
document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('terminal-output').innerText = '';
});
