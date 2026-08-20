// Default Boilerplate Code Templates
const codeTemplates = {
  python: `# Python 3 Engine\nnumbers = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in numbers]\nprint(f"Computed Squares: {squares}")`,
  
  cpp: `// C++ Standard Interpreter\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from Browser C++!" << endl;\n    return 0;\n}`,
  
  javascript: `// Native JavaScript ES6 Engine\nconst data = [10, 20, 30];\nconst sum = data.reduce((a, b) => a + b, 0);\nconsole.log("Calculated Sum:", sum);`,
  
  html: `<!-- HTML/CSS Live Renderer -->\n<div style="text-align: center; padding: 20px;">\n  <h1 style="color: #007acc;">Interactive UI</h1>\n  <p>Rendered directly inside an iframe sandbox.</p>\n</div>`,
  
  sql: `-- Browser In-Memory SQL\nCREATE TABLE Users (id INT, name STRING);\nINSERT INTO Users VALUES (1, 'Alice'), (2, 'Bob');\nSELECT * FROM Users WHERE id = 1;`,
  
  bash: `# Simulating Bash Commands\necho "Initializing system script..."\ndate\necho "Process Complete."`
};

const extensions = {
  python: 'main.py',
  cpp: 'main.cpp',
  javascript: 'app.js',
  html: 'index.html',
  sql: 'query.sql',
  bash: 'script.sh'
};

// UI Elements
const editor = document.getElementById('code-editor');
const langSelect = document.getElementById('language-select');
const consoleOutput = document.getElementById('terminal-output');
const iframePreview = document.getElementById('web-preview');
const fileLabel = document.getElementById('file-label');
const statusTag = document.getElementById('status-tag');
const runBtn = document.getElementById('run-btn');

// System Engines Initialization
let pyodideInstance = null;

async function initEngines() {
  statusTag.textContent = 'Loading Python...';
  statusTag.className = 'tag loading';
  try {
    pyodideInstance = await loadPyodide();
    statusTag.textContent = 'System Ready';
    statusTag.className = 'tag ready';
  } catch (err) {
    statusTag.textContent = 'Engine Load Error';
  }
}
initEngines();

// Switch Code View & File Extensions
langSelect.addEventListener('change', () => {
  const lang = langSelect.value;
  editor.value = codeTemplates[lang];
  fileLabel.textContent = extensions[lang];
  
  if (lang === 'html') {
    consoleOutput.style.display = 'none';
    iframePreview.style.display = 'block';
  } else {
    consoleOutput.style.display = 'block';
    iframePreview.style.display = 'none';
  }
});

// Default Load Setup
editor.value = codeTemplates.python;

// Execution Router
runBtn.addEventListener('click', async () => {
  const lang = langSelect.value;
  const code = editor.value;
  consoleOutput.textContent = 'Running...';

  switch (lang) {
    case 'python':
      runPython(code);
      break;
    case 'cpp':
      runCpp(code);
      break;
    case 'javascript':
      runJavaScript(code);
      break;
    case 'html':
      runHTML(code);
      break;
    case 'sql':
      runSQL(code);
      break;
    case 'bash':
      runBash(code);
      break;
  }
});

// Language Runners
async function runPython(code) {
  if (!pyodideInstance) {
    consoleOutput.textContent = 'Python engine is still initializing...';
    return;
  }
  try {
    pyodideInstance.runPython(`
      import sys, io
      sys.stdout = io.StringIO()
    `);
    await pyodideInstance.runPythonAsync(code);
    const stdout = pyodideInstance.runPython('sys.stdout.getvalue()');
    consoleOutput.textContent = stdout || 'Code executed successfully (no stdout).';
  } catch (err) {
    consoleOutput.textContent = `Python Runtime Error:\n${err.message}`;
  }
}

function runCpp(code) {
  try {
    let outputText = '';
    const config = {
      stdio: {
        write: (s) => { outputText += s; }
      }
    };
    JSCPP.run(code, '', config);
    consoleOutput.textContent = outputText || 'Code executed with no output.';
  } catch (err) {
    consoleOutput.textContent = `C++ Execution Error:\n${err}`;
  }
}

function runJavaScript(code) {
  try {
    let logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.join(' ')),
      error: (...args) => logs.push('Error: ' + args.join(' ')),
      warn: (...args) => logs.push('Warning: ' + args.join(' '))
    };
    
    // Scoped Execution
    const runInScope = new Function('console', code);
    runInScope(customConsole);
    
    consoleOutput.textContent = logs.join('\n') || 'Executed successfully (no console outputs).';
  } catch (err) {
    consoleOutput.textContent = `JS Runtime Error:\n${err.message}`;
  }
}

function runHTML(code) {
  iframePreview.srcdoc = code;
}

function runSQL(code) {
  try {
    const res = alasql(code);
    consoleOutput.textContent = JSON.stringify(res, null, 2);
  } catch (err) {
    consoleOutput.textContent = `SQL Query Error:\n${err.message}`;
  }
}

function runBash(code) {
  // Simple Bash/Shell Simulator for basic echo/date calls
  const lines = code.split('\n');
  let output = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('echo ')) {
      output.push(trimmed.substring(5).replace(/['"]/g, ''));
    } else if (trimmed === 'date') {
      output.push(new Date().toString());
    } else if (trimmed.startsWith('#') || trimmed === '') {
      // Ignore comments and blank lines
    } else {
      output.push(`bash: ${trimmed}: command not recognized in browser environment`);
    }
  });
  consoleOutput.textContent = output.join('\n');
}
