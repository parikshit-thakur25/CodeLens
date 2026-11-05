import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGES = [
  { value: 'python', label: 'Python 3', monaco: 'python', ext: 'main.py', version: 'v3.12' },
  { value: 'java', label: 'Java 21', monaco: 'java', ext: 'Main.java', version: 'v21' },
  { value: 'cpp', label: 'C++ 20', monaco: 'cpp', ext: 'main.cpp', version: 'GCC 13' },
]

const DEFAULT_CODE = {
  python: `def binary_search(arr, target):
    """
    Classic binary search: O(log n) time, O(1) space.
    Halves search space at each iteration.
    """
    low = 0
    high = len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1

# Sample execution test:
dataset = [2, 7, 11, 15, 24, 38, 56, 72, 91, 105]
target = 38
idx = binary_search(dataset, target)
print(f"Dataset: {dataset}")
print(f"Target {target} located at index: {idx}")
`,
  java: `import java.util.*;

public class Main {
    /**
     * Binary Search: O(log n) Time | O(1) Auxiliary Space
     */
    public static int binarySearch(int[] arr, int target) {
        int low = 0, high = arr.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] dataset = {2, 7, 11, 15, 24, 38, 56, 72, 91, 105};
        int target = 38;
        System.out.println("Dataset: " + Arrays.toString(dataset));
        System.out.println("Target " + target + " located at index: " + binarySearch(dataset, target));
    }
}
`,
  cpp: `#include <iostream>
#include <vector>

using namespace std;

// Binary Search: O(log n) Time | O(1) Auxiliary Space
int binarySearch(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> dataset = {2, 7, 11, 15, 24, 38, 56, 72, 91, 105};
    int target = 38;
    cout << "Dataset: [";
    for (size_t i = 0; i < dataset.size(); ++i) {
        cout << dataset[i] << (i + 1 < dataset.size() ? ", " : "");
    }
    cout << "]" << endl;
    cout << "Target " << target << " located at index: " << binarySearch(dataset, target) << endl;
    return 0;
}
`,
}

// Complexity spectrum scale for visualization
const COMPLEXITY_SPECTRUM = [
  { label: 'O(1)', name: 'Constant', color: 'emerald' },
  { label: 'O(log n)', name: 'Logarithmic', color: 'cyan' },
  { label: 'O(n)', name: 'Linear', color: 'blue' },
  { label: 'O(n log n)', name: 'Linearithmic', color: 'amber' },
  { label: 'O(n²)', name: 'Quadratic', color: 'orange' },
  { label: 'O(2^n)', name: 'Exponential', color: 'rose' },
]

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://codelens-ijv2.onrender.com'
const API_URL = rawApiUrl.replace(/\/+$/, '')

export default function App() {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE.python)
  const [stdin, setStdin] = useState('')
  const [showStdin, setShowStdin] = useState(false)

  // Status & Results
  const [analysisResult, setAnalysisResult] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [activeTab, setActiveTab] = useState('console') // 'console' | 'diagnostics'

  const [analyzing, setAnalyzing] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  // Editor telemetry
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [copied, setCopied] = useState(false)

  // History state
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  // Configure custom Monaco dark theme
  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('codelens-studio-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: 'a78bfa' },
        { token: 'function', foreground: '818cf8' },
        { token: 'delimiter', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#0a0c12',
        'editor.foreground': '#e2e8f0',
        'editorCursor.foreground': '#10b981',
        'editor.lineHighlightBackground': '#121520',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#94a3b8',
        'editor.selectionBackground': '#1e293b',
        'editor.inactiveSelectionBackground': '#182030',
        'editorIndentGuide.background': '#1e293b',
        'editorIndentGuide.activeBackground': '#334155',
      },
    })
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({
        line: e.position.lineNumber,
        col: e.position.column,
      })
    })
  }

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    setCode(DEFAULT_CODE[newLang])
    setAnalysisResult(null)
    setRunResult(null)
    setError('')
  }

  const jumpToLine = (lineNumber) => {
    if (!editorRef.current) return
    editorRef.current.revealLineInCenter(lineNumber)
    editorRef.current.setPosition({ lineNumber, column: 1 })
    editorRef.current.focus()
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Run execution
  const handleRun = async () => {
    setError('')
    setRunning(true)
    setActiveTab('console')

    try {
      const response = await fetch(`${API_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || 'Execution failed')
      } else {
        setRunResult(data)
      }
    } catch (err) {
      setError('Could not reach execution backend. Is it active?')
    } finally {
      setRunning(false)
    }
  }

  // Analyze complexity
  const handleAnalyze = async () => {
    setError('')
    setAnalyzing(true)
    setActiveTab('diagnostics')

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || 'Analysis failed')
      } else {
        setAnalysisResult(data)
      }
    } catch (err) {
      setError('Could not reach backend analyzer.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Keyboard Shortcuts: Cmd+Enter (Run), Cmd+Shift+Enter (Analyze)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          handleAnalyze()
        } else {
          handleRun()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [code, language, stdin])

  const handleToggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false)
      return
    }

    setHistoryLoading(true)
    try {
      const response = await fetch(`${API_URL}/history`)
      const data = await response.json()
      setHistory(data)
      setShowHistory(true)
    } catch (err) {
      setError('Could not retrieve past records.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const currentLangConfig = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]

  // Spectrum matching for Big-O scale
  const getSpectrumIndex = (complexityStr) => {
    if (!complexityStr) return -1
    const s = complexityStr.toLowerCase()
    if (s.includes('o(1)')) return 0
    if (s.includes('log n') && !s.includes('n log')) return 1
    if (s === 'o(n)') return 2
    if (s.includes('n log n')) return 3
    if (s.includes('n^2') || s.includes('n²')) return 4
    if (s.includes('2^n') || s.includes('n!')) return 5
    return 2 // default to linear
  }

  const activeSpectrumIdx = analysisResult
    ? getSpectrumIndex(analysisResult.estimated_time_complexity)
    : -1

  return (
    <div className="min-h-screen bg-[#08090D] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300 ambient-grid relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="border-b border-white/[0.06] bg-[#0A0C14]/80 backdrop-blur-xl px-5 py-3 sticky top-0 z-30 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
            <div className="relative h-9 w-9 rounded-xl bg-[#0F121C] border border-white/10 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm shadow-inner">
              &lt;/&gt;
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                Code<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Lens</span>
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider uppercase font-mono">
                Studio
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Language Sandbox</span>
            </div>
          </div>
        </div>

        {/* Center: Language Switcher Tabs */}
        <div className="bg-[#0F121C]/90 p-1 rounded-xl border border-white/[0.08] shadow-inner flex items-center gap-1">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              onClick={() => handleLanguageChange(l.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                language === l.value
                  ? 'bg-gradient-to-b from-slate-800 to-slate-850 text-white shadow-md border border-white/10 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              <span>{l.label}</span>
              <span className="text-[10px] font-mono text-slate-500">
                {l.version}
              </span>
            </button>
          ))}
        </div>

        {/* Right Action Toolbar */}
        <div className="flex items-center gap-2">
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={running || analyzing}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {running ? (
              <svg className="animate-spin h-3.5 w-3.5 text-slate-950" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-[10px] transform group-hover:scale-110 transition">▶</span>
            )}
            <span>Run Code</span>
            <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono font-bold bg-emerald-950/20 text-slate-900 rounded border border-emerald-900/30">
              ⌘↵
            </kbd>
          </button>

          {/* Analyze Complexity Button */}
          <button
            onClick={handleAnalyze}
            disabled={running || analyzing}
            className="group relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {analyzing ? (
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-[10px]">⚡</span>
            )}
            <span>Analyze Big-O</span>
            <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono font-bold bg-indigo-950/40 text-indigo-200 rounded border border-indigo-400/20">
              ⇧⌘↵
            </kbd>
          </button>

          {/* Past analyses history button */}
          <button
            onClick={handleToggleHistory}
            disabled={historyLoading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#0F121C] hover:bg-slate-800/60 text-slate-300 text-xs font-medium border border-white/[0.08] transition flex items-center gap-1.5 cursor-pointer"
            title="Past Analyses History"
          >
            <span className="text-sm">📜</span>
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 p-3 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1780px] w-full mx-auto">
        {/* Left Column: Editor Studio (7 cols) */}
        <section className="lg:col-span-7 flex flex-col rounded-2xl border border-white/[0.08] bg-[#0A0C14]/90 backdrop-blur-2xl overflow-hidden shadow-2xl">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-[#0D101A] text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#08090D] border border-white/10 text-slate-200 font-mono text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{currentLangConfig.ext}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
                Read/Write
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStdin(!showStdin)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 border ${
                  showStdin
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200'
                }`}
              >
                <span>STDIN</span>
                {stdin.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition text-xs flex items-center gap-1"
                title="Copy Code"
              >
                {copied ? <span className="text-emerald-400">✓ Copied</span> : <span>Copy</span>}
              </button>

              <button
                onClick={() => setCode(DEFAULT_CODE[language])}
                className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition text-xs"
                title="Reset to boilerplate"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Optional Stdin Drawer */}
          {showStdin && (
            <div className="p-3 bg-[#08090E] border-b border-white/[0.06] animate-fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Standard Input (passed to program via stdin)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {stdin.length} bytes
                </span>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input parameters here (e.g., lines for input() or cin >>)..."
                rows={2}
                className="w-full bg-[#0D101A] border border-white/10 rounded-xl p-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-y"
              />
            </div>
          )}

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[460px] lg:min-h-[560px]">
            <Editor
              height="100%"
              language={currentLangConfig.monaco}
              value={code}
              onChange={(value) => setCode(value || '')}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              theme="codelens-studio-theme"
              options={{
                fontSize: 13.5,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                lineHeight: 22,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: 'all',
              }}
            />
          </div>

          {/* Editor Status Bar */}
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0D101A] flex items-center justify-between text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-3">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>•</span>
              <span>UTF-8</span>
              <span>•</span>
              <span>Spaces: 4</span>
            </div>

            <div className="flex items-center gap-3">
              <span>{code.length} chars</span>
              <span>•</span>
              <span className="text-slate-400">Sandbox Isolation Active</span>
            </div>
          </div>
        </section>

        {/* Right Column: Console & Diagnostics HUD (5 cols) */}
        <section className="lg:col-span-5 flex flex-col rounded-2xl border border-white/[0.08] bg-[#0A0C14]/90 backdrop-blur-2xl overflow-hidden shadow-2xl">
          {/* Header Tab Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0D101A] px-3 py-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('console')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'console'
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm border border-white/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🖥️</span> Terminal
                {runResult && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      runResult.success ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                )}
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'diagnostics'
                    ? 'bg-slate-800 text-indigo-400 font-semibold shadow-sm border border-white/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡</span> Complexity HUD
                {analysisResult && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </button>
            </div>

            <button
              onClick={() => {
                setRunResult(null)
                setAnalysisResult(null)
                setError('')
              }}
              className="text-[11px] font-mono text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-white/[0.04] transition"
            >
              Clear
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
              <span className="text-sm">⚠️</span>
              <p className="flex-1 font-mono">{error}</p>
            </div>
          )}

          {/* Panel Viewport */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Terminal Tab */}
            {activeTab === 'console' && (
              <div className="flex flex-col h-full font-mono text-xs">
                {/* Terminal Window Header */}
                <div className="flex items-center justify-between text-slate-400 mb-2 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block" />
                    </div>
                    <span className="text-[11px] text-slate-500">stdio stream</span>
                  </div>

                  {runResult && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          runResult.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        Exit Code {runResult.exit_code || (runResult.success ? 0 : 1)}
                      </span>
                      <span className="text-slate-400">⚡ {runResult.execution_time_ms} ms</span>
                    </div>
                  )}
                </div>

                {/* Terminal Canvas */}
                <div className="flex-1 bg-[#06070B] rounded-xl p-4 border border-white/[0.06] overflow-auto min-h-[380px] shadow-inner font-mono text-[12.5px]">
                  {running ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-16">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
                      </div>
                      <p className="text-xs text-slate-400">Compiling and running in sandbox...</p>
                    </div>
                  ) : runResult ? (
                    <div className="space-y-1">
                      {runResult.stdout && (
                        <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                          {runResult.stdout}
                        </pre>
                      )}
                      {runResult.stderr && (
                        <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed mt-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40">
                          {runResult.stderr}
                        </pre>
                      )}
                      {!runResult.stdout && !runResult.stderr && (
                        <p className="text-slate-500 italic">Program finished successfully with no standard output.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center justify-center h-full py-20 gap-2 text-center">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-500 text-lg mb-1">
                        &gt;_
                      </div>
                      <p className="text-xs text-slate-400 font-sans font-medium">Terminal Idle</p>
                      <p className="text-[11px] text-slate-600 font-sans max-w-xs">
                        Click &quot;Run Code&quot; or press <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">⌘+Enter</kbd> to execute.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnostics HUD Tab */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-4">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center min-h-[380px] text-slate-500 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                    <p className="text-xs text-slate-400">Traversing syntax tree and calculating Big-O...</p>
                  </div>
                ) : analysisResult ? (
                  <>
                    {/* Visual Big-O Spectrum Radar */}
                    <div className="p-3.5 rounded-xl border border-white/[0.06] bg-[#06070B]">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
                        <span>ALGORITHMIC COMPLEXITY SPECTRUM</span>
                        <span className="text-emerald-400">Optimal ➔ High</span>
                      </div>

                      {/* Spectrum Bar */}
                      <div className="grid grid-cols-6 gap-1.5">
                        {COMPLEXITY_SPECTRUM.map((item, idx) => {
                          const isActive = idx === activeSpectrumIdx
                          return (
                            <div
                              key={item.label}
                              className={`p-2 rounded-lg text-center transition-all duration-300 border ${
                                isActive
                                  ? 'bg-gradient-to-b from-indigo-500/20 to-purple-500/20 border-indigo-400/50 shadow-lg shadow-indigo-500/10'
                                  : 'bg-white/[0.02] border-white/[0.04] opacity-50'
                              }`}
                            >
                              <p
                                className={`font-mono text-xs font-bold ${
                                  isActive ? 'text-white' : 'text-slate-400'
                                }`}
                              >
                                {item.label}
                              </p>
                              <p className="text-[9px] text-slate-500 truncate mt-0.5">
                                {item.name}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Dual Metric Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Time Complexity Card */}
                      <div className="p-4 rounded-xl border border-white/[0.06] bg-[#06070B] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block">
                          Time Complexity
                        </span>
                        <p className="mt-2 text-2xl font-black font-mono text-emerald-400">
                          {analysisResult.estimated_time_complexity}
                        </p>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Worst-Case Scaling
                        </span>
                      </div>

                      {/* Space Complexity Card */}
                      <div className="p-4 rounded-xl border border-white/[0.06] bg-[#06070B] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 block">
                          Auxiliary Space
                        </span>
                        <p className="mt-2 text-2xl font-black font-mono text-indigo-400">
                          {analysisResult.estimated_space_complexity}
                        </p>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          Memory Footprint
                        </span>
                      </div>
                    </div>

                    {/* Reasoning Breakdown */}
                    {analysisResult.explanation && (
                      <div className="p-4 rounded-xl border border-white/[0.06] bg-[#06070B]">
                        <p className="text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                          <span>💡</span> Diagnostic Breakdown
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          {analysisResult.explanation}
                        </p>
                      </div>
                    )}

                    {/* Bottlenecks List */}
                    {analysisResult.bottlenecks && analysisResult.bottlenecks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
                          Critical Loops & Recurrences
                        </p>
                        <div className="space-y-2">
                          {analysisResult.bottlenecks.map((b, idx) => (
                            <div
                              key={idx}
                              onClick={() => jumpToLine(b.line)}
                              className="p-3 rounded-xl border border-white/[0.06] hover:border-indigo-500/40 bg-[#06070B] hover:bg-slate-900/60 cursor-pointer transition flex items-start gap-3 group"
                              title="Click to jump to line in editor"
                            >
                              <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-white/[0.05] text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition">
                                L{b.line}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-200 font-sans">
                                    {b.type}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-amber-400">
                                    {b.complexity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 font-sans leading-normal">
                                  {b.reason}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-slate-600 flex flex-col items-center justify-center min-h-[380px] gap-2 text-center py-20">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-slate-500 text-lg mb-1">
                      ⚡
                    </div>
                    <p className="text-xs text-slate-400 font-sans font-medium">Diagnostics Idle</p>
                    <p className="text-[11px] text-slate-600 font-sans max-w-xs">
                      Click &quot;Analyze Big-O&quot; or press <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">⇧⌘↵</kbd> to inspect structure.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Slide-over Past History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0D101A] border-l border-white/10 h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">📜</span>
                <h3 className="text-base font-bold text-white">Past Executions & Analyses</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center py-10 font-mono">
                  No previous records found.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-white/[0.06] bg-[#08090E] hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-500">
                        Record #{item.id}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                        <span className="text-emerald-400">{item.time_complexity}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-indigo-400">{item.space_complexity}</span>
                      </div>
                    </div>
                    <pre className="text-[11px] text-slate-400 font-mono line-clamp-3 bg-[#0D101A] p-2 rounded-lg border border-white/5 overflow-hidden">
                      {item.code}
                    </pre>
                    <button
                      onClick={() => {
                        setCode(item.code)
                        setShowHistory(false)
                      }}
                      className="mt-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                    >
                      <span>Load into editor</span>
                      <span>→</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
