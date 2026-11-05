import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGES = [
  { value: 'python', label: 'Python 3', monaco: 'python', ext: 'main.py' },
  { value: 'java', label: 'Java 21', monaco: 'java', ext: 'Main.java' },
  { value: 'cpp', label: 'C++ 20', monaco: 'cpp', ext: 'main.cpp' },
]

const DEFAULT_CODE = {
  python: `def binary_search(arr, target):
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

# Test runner
nums = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target = 23
print(f"Array: {nums}")
print(f"Target {target} found at index: {binary_search(nums, target)}")
`,
  java: `import java.util.*;

public class Main {
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
        int[] nums = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
        int target = 23;
        System.out.println("Array: " + Arrays.toString(nums));
        System.out.println("Target " + target + " found at index: " + binarySearch(nums, target));
    }
}
`,
  cpp: `#include <iostream>
#include <vector>

using namespace std;

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
    vector<int> nums = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int target = 23;
    cout << "Target " << target << " found at index: " << binarySearch(nums, target) << endl;
    return 0;
}
`,
}

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://codelens-ijv2.onrender.com'
const API_URL = rawApiUrl.replace(/\/+$/, '')

export default function App() {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE.python)
  const [stdin, setStdin] = useState('')
  const [showStdin, setShowStdin] = useState(false)

  // Diagnostics & Runner state
  const [analysisResult, setAnalysisResult] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [activeTab, setActiveTab] = useState('console') // 'console' | 'diagnostics'

  const [analyzing, setAnalyzing] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  // History state
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Monaco editor reference for decorations/jumping
  const editorRef = useRef(null)
  const monacoRef = useRef(null)

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
  }

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    setCode(DEFAULT_CODE[newLang])
    setAnalysisResult(null)
    setRunResult(null)
    setError('')
  }

  // Highlight line in editor when bottleneck clicked
  const jumpToLine = (lineNumber) => {
    if (!editorRef.current) return
    editorRef.current.revealLineInCenter(lineNumber)
    editorRef.current.setPosition({ lineNumber, column: 1 })
    editorRef.current.focus()
  }

  // Run Code Execution
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
      setError('Could not connect to execution backend.')
    } finally {
      setRunning(false)
    }
  }

  // Analyze Complexity
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

  // Combo: Run & Analyze
  const handleRunAndAnalyze = async () => {
    setError('')
    setRunning(true)
    setAnalyzing(true)

    try {
      const [runRes, analyzeRes] = await Promise.all([
        fetch(`${API_URL}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language, stdin }),
        }).then((r) => r.json()),
        fetch(`${API_URL}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language }),
        }).then((r) => r.json()),
      ])

      setRunResult(runRes)
      setAnalysisResult(analyzeRes)
      setActiveTab('diagnostics')
    } catch (err) {
      setError('Failed to complete full run & analyze.')
    } finally {
      setRunning(false)
      setAnalyzing(false)
    }
  }

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
      setError('Could not load past analyses.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const currentLangConfig = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]

  // Time complexity color mapping
  const getTimeBadgeColor = (timeStr) => {
    if (!timeStr) return 'text-slate-400 bg-slate-800 border-slate-700'
    if (timeStr.includes('O(1)')) return 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50'
    if (timeStr.includes('log n')) return 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50'
    if (timeStr === 'O(n)') return 'text-blue-400 bg-blue-950/60 border-blue-700/50'
    if (timeStr.includes('n log n')) return 'text-amber-400 bg-amber-950/60 border-amber-700/50'
    if (timeStr.includes('n^2')) return 'text-orange-400 bg-orange-950/60 border-orange-700/50'
    return 'text-rose-400 bg-rose-950/60 border-rose-700/50'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
            CL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight">
                Code<span className="text-emerald-400">Lens</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Studio 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Interactive Compiler & Algorithmic Diagnostics
            </p>
          </div>
        </div>

        {/* Center / Action toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Language selector pills */}
          <div className="bg-slate-950/70 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                onClick={() => handleLanguageChange(l.value)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  language === l.value
                    ? 'bg-slate-800 text-emerald-400 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <button
            onClick={handleRun}
            disabled={running || analyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-slate-950" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running...
              </>
            ) : (
              <>
                <span>▶</span> Run
              </>
            )}
          </button>

          <button
            onClick={handleAnalyze}
            disabled={running || analyzing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <span>⚡</span> Analyze
              </>
            )}
          </button>

          <button
            onClick={handleRunAndAnalyze}
            disabled={running || analyzing}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 transition disabled:opacity-50"
          >
            Run & Analyze
          </button>

          <button
            onClick={handleToggleHistory}
            disabled={historyLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700/60 transition flex items-center gap-1.5"
          >
            <span>📜</span> History
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1700px] w-full mx-auto">
        {/* Left Column: Monaco Code Editor (7 cols) */}
        <section className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/40 backdrop-blur overflow-hidden shadow-2xl">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/70 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300 font-medium">
                {currentLangConfig.ext}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span>{code.length} chars</span>
              <button
                onClick={() => setCode(DEFAULT_CODE[language])}
                className="hover:text-slate-200 transition underline underline-offset-2"
                title="Reset to boilerplate"
              >
                Reset
              </button>
              <button
                onClick={() => setShowStdin(!showStdin)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition border ${
                  showStdin
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'
                }`}
              >
                STDIN {stdin.length > 0 && `(${stdin.length})`}
              </button>
            </div>
          </div>

          {/* Optional Stdin Drawer */}
          {showStdin && (
            <div className="p-3 bg-slate-950/80 border-b border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Standard Input (stdin):
              </label>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input passed to code (e.g. for input() or cin)..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
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
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        </section>

        {/* Right Column: Console & Diagnostics Panel (5 cols) */}
        <section className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800/90 bg-slate-900/40 backdrop-blur overflow-hidden shadow-2xl">
          {/* Tab Selection Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('console')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'console'
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700/70 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🖥️</span> Terminal Output
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'diagnostics'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700/70 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡</span> Complexity Diagnostics
                {analysisResult && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                )}
              </button>
            </div>

            {/* Quick action: Clear */}
            <button
              onClick={() => {
                setRunResult(null)
                setAnalysisResult(null)
                setError('')
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 px-2 py-1 rounded transition"
            >
              Clear
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2">
              <span className="text-base leading-none">⚠️</span>
              <p className="flex-1">{error}</p>
            </div>
          )}

          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'console' && (
              <div className="flex flex-col h-full font-mono text-xs">
                {/* Status Bar */}
                <div className="flex items-center justify-between text-slate-400 mb-2 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className="text-[11px] text-slate-500">stdout/stderr</span>
                  </div>

                  {runResult && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold ${
                          runResult.success
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        Exit {runResult.exit_code || (runResult.success ? 0 : 1)}
                      </span>
                      <span>{runResult.execution_time_ms} ms</span>
                    </div>
                  )}
                </div>

                {/* Console Output Screen */}
                <div className="flex-1 bg-slate-950/90 rounded-xl p-4 border border-slate-800/80 overflow-auto min-h-[360px]">
                  {running ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                      <svg className="animate-spin h-6 w-6 text-emerald-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p>Compiling and executing in sandbox...</p>
                    </div>
                  ) : runResult ? (
                    <div>
                      {runResult.stdout && (
                        <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                          {runResult.stdout}
                        </pre>
                      )}
                      {runResult.stderr && (
                        <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed mt-2">
                          {runResult.stderr}
                        </pre>
                      )}
                      {!runResult.stdout && !runResult.stderr && (
                        <p className="text-slate-500 italic">Program finished with no output.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center justify-center h-full gap-2 text-center">
                      <span className="text-3xl">⌨️</span>
                      <p>Click &quot;Run&quot; to execute your code.</p>
                      <p className="text-[11px] text-slate-700">
                        Supports Python 3, Java 21, and C++ 20 in a secure sandbox.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'diagnostics' && (
              <div className="space-y-4">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-500 gap-2">
                    <svg className="animate-spin h-6 w-6 text-indigo-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p>Traversing syntax tree and computing Big-O metrics...</p>
                  </div>
                ) : analysisResult ? (
                  <>
                    {/* Big-O Metric Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Time Complexity Card */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                          Time Complexity
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span
                            className={`text-2xl font-black font-mono px-2.5 py-1 rounded-lg border ${getTimeBadgeColor(
                              analysisResult.estimated_time_complexity
                            )}`}
                          >
                            {analysisResult.estimated_time_complexity}
                          </span>
                        </div>
                      </div>

                      {/* Space Complexity Card */}
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                          Auxiliary Space
                        </p>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono px-2.5 py-1 rounded-lg border text-indigo-400 bg-indigo-950/60 border-indigo-700/50">
                            {analysisResult.estimated_space_complexity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Explanation Summary */}
                    {analysisResult.explanation && (
                      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/50">
                        <p className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                          <span>💡</span> Algorithmic Reasoning
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {analysisResult.explanation}
                        </p>
                      </div>
                    )}

                    {/* Bottlenecks Breakdown */}
                    {analysisResult.bottlenecks && analysisResult.bottlenecks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Identified Critical Loops & Bottlenecks
                        </p>
                        <div className="space-y-2">
                          {analysisResult.bottlenecks.map((b, idx) => (
                            <div
                              key={idx}
                              onClick={() => jumpToLine(b.line)}
                              className="p-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/70 hover:bg-slate-900/80 cursor-pointer transition flex items-start gap-3 group"
                            >
                              <span className="px-2 py-1 rounded font-mono text-xs font-bold bg-slate-800 text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                                L{b.line}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-200">
                                    {b.type}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-amber-400">
                                    {b.complexity}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
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
                  <div className="text-slate-600 flex flex-col items-center justify-center min-h-[360px] gap-2 text-center">
                    <span className="text-3xl">⚡</span>
                    <p>Click &quot;Analyze&quot; to estimate Big-O complexity.</p>
                    <p className="text-[11px] text-slate-700">
                      Static structural AST & Tree-sitter inspection with zero risk.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* History Slide-Over Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="text-lg font-bold">Past Analyses</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm italic text-center py-10">
                  No previous records found.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        #{item.id}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-mono font-bold">
                        <span className="text-emerald-400">
                          {item.time_complexity}
                        </span>
                        <span className="text-slate-600">|</span>
                        <span className="text-indigo-400">
                          {item.space_complexity}
                        </span>
                      </div>
                    </div>
                    <pre className="text-[11px] text-slate-400 font-mono line-clamp-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 overflow-hidden">
                      {item.code}
                    </pre>
                    <button
                      onClick={() => {
                        setCode(item.code)
                        setShowHistory(false)
                      }}
                      className="mt-2.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
                    >
                      Load into Editor →
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
