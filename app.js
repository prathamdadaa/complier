// Sample Code Templates
const codeTemplates = {
  python: `print("Hello from VS Code Python Engine!")\nnumbers = [1, 2, 3, 4, 5]\nprint([x**2 for x in numbers])`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++ Engine!" << endl;\n    return 0;\n}`,
  javascript: `const items = ['VS Code', 'Browser Engine', 'JavaScript'];\nconsole.log("Status:", items.join(' -> '));`,
  html: `<div style="text-align:center; padding: 20px; font-family: sans-serif;">\n  <h1 style="color:#007acc;">VS Code Web Preview</h1>\n  <p>Live HTML/CSS rendering works automatically!</p>\n</div>`,
  sql: `CREATE TABLE Users (id INT, name STRING);\nINSERT INTO Users VALUES (1, 'Alice'), (2, 'Bob');\nSELECT * FROM Users;`
};

let currentLang = 'python';
let pyodideInstance = null;

// Initialize CodeMirror Editor
const editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
  lineNumbers: true,
  theme: "dracula",
  mode: "python"
});
editor.setValue(codeTemplates.python);

// Initialize Python Engine Asynchronously
async function loadPythonEngine() {
  try {
    pyodideInstance = await loadPyodide();
    document.getElementById('status-engine').innerText = 'Python Engine Ready';
    document.getElementById('terminal-output').innerText = 'Ready to execute code.';
  } catch (e) {
    document.getElementById('status-engine').innerText = 'Python Load Error';
  }
}
loadPythonEngine();

// Sidebar File Explorer Switcher
document.querySelectorAll('.file-tree .file').forEach(fileEl => {
  fileEl.addEventListener('click', () => {
    document.querySelectorAll('.file-tree .file').forEach(f => f.classList.remove('active'));
    fileEl.classList.add('active');

    currentLang = fileEl.dataset.lang;
    const mode = fileEl.dataset.mode;
    const fileName = fileEl.innerText.trim();

    document.getElementById('current-tab-name').innerText = fileName;
    document.getElementById('status-lang').innerText = currentLang.toUpperCase();
    
    editor.setOption("mode", mode);
    editor.setValue(codeTemplates[currentLang]);

    const consoleOut = document.getElementById('terminal-output');
    const preview = document.getElementById('web-preview');

    if (currentLang === 'html') {
      consoleOut.style.display = 'none';
      preview.style.display = 'block';
    } else {
      consoleOut.style.display = 'block';
      preview.style.display = 'none';
    }
  });
});

// Run Code Execution Handler
document.getElementById('run-btn').addEventListener('click', async () => {
  const code = editor.getValue();
  const consoleOut = document.getElementById('terminal-output');
  consoleOut.innerText = "Running execution...\n";

  if (currentLang === 'python') {
    if (!pyodideInstance) {
      consoleOut.innerText = "Python engine is loading, please wait...";
      return;
    }
    try {
      pyodideInstance.runPython(`import sys, io; sys.stdout = io.StringIO()`);
      await pyodideInstance.runPythonAsync(code);
      consoleOut.innerText = pyodideInstance.runPython('sys.stdout.getvalue()') || 'Executed without output.';
    } catch (err) {
      consoleOut.innerText = `Python Error:\n${err.message}`;
    }
  }
  else if (currentLang === 'cpp') {
    try {
      let out = '';
      JSCPP.run(code, '', { stdio: { write: s => out += s } });
      consoleOut.innerText = out || 'Executed without output.';
    } catch (err) {
      consoleOut.innerText = `C++ Error:\n${err}`;
    }
  }
  else if (currentLang === 'javascript') {
    try {
      let logs = [];
      const customConsole = { log: (...a) => logs.push(a.join(' ')) };
      new Function('console', code)(customConsole);
      consoleOut.innerText = logs.join('\n') || 'Executed without output.';
    } catch (err) {
      consoleOut.innerText = `JS Error:\n${err.message}`;
    }
  }
  else if (currentLang === 'html') {
    document.getElementById('web-preview').srcdoc = code;
  }
  else if (currentLang === 'sql') {
    try {
      consoleOut.innerText = JSON.stringify(alasql(code), null, 2);
    } catch (err) {
      consoleOut.innerText = `SQL Error:\n${err.message}`;
    }
  }
});

// Clear Terminal Output
document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('terminal-output').innerText = '';
});
