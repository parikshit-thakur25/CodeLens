import { useState, useEffect, useRef, useMemo } from 'react'
import Editor from '@monaco-editor/react'
import LandingPage from './LandingPage'

const LANGUAGES = [
  { value: 'python', label: 'Python 3', monaco: 'python', ext: 'main.py', version: 'v3.12', badge: '🐍' },
  { value: 'c', label: 'C', monaco: 'c', ext: 'main.c', version: 'GCC 13', badge: '🔷' },
  { value: 'cpp', label: 'C++ 20', monaco: 'cpp', ext: 'main.cpp', version: 'GCC 13', badge: '⚡' },
  { value: 'java', label: 'Java 21', monaco: 'java', ext: 'Main.java', version: 'v21', badge: '☕' },
]

const THEMES = [
  { value: 'vscode-dark', label: 'VS Code Dark', monacoTheme: 'vs-dark', bg: 'bg-[#1e1e1e]', surface: 'bg-[#252526]', border: 'border-[#3c3c3c]', text: 'text-[#cccccc]', headerBg: 'bg-[#323233]' },
  { value: 'obsidian', label: 'Obsidian Black', monacoTheme: 'vs-dark', bg: 'bg-[#0d1117]', surface: 'bg-[#161b22]', border: 'border-[#30363d]', text: 'text-slate-200', headerBg: 'bg-[#161b22]' },
  { value: 'light', label: 'Clean Light', monacoTheme: 'vs', bg: 'bg-[#f8fafc]', surface: 'bg-white', border: 'border-slate-200', text: 'text-slate-800', headerBg: 'bg-slate-100' },
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
  c: `#include <stdio.h>

/**
 * Binary Search in C: O(log n) Time | O(1) Auxiliary Space
 */
int binarySearch(int arr[], int size, int target) {
    int low = 0, high = size - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    int dataset[] = {2, 7, 11, 15, 24, 38, 56, 72, 91, 105};
    int size = sizeof(dataset) / sizeof(dataset[0]);
    int target = 38;
    int idx = binarySearch(dataset, size, target);
    printf("Dataset size: %d\\n", size);
    printf("Target %d located at index: %d\\n", target, idx);
    return 0;
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
}

const COMPLEXITY_SPECTRUM = [
  { label: 'O(1)', name: 'Constant' },
  { label: 'O(log n)', name: 'Logarithmic' },
  { label: 'O(n)', name: 'Linear' },
  { label: 'O(n log n)', name: 'Linearithmic' },
  { label: 'O(n²)', name: 'Quadratic' },
  { label: 'O(2^n)', name: 'Exponential' },
]

const rawApiUrl = import.meta.env.VITE_API_URL || 'https://codelens-ijv2.onrender.com'
const API_URL = rawApiUrl.replace(/\/+$/, '')

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined' && (window.location.hash.includes('compiler') || window.location.hash.includes('studio'))) {
      return 'compiler'
    }
    return 'landing'
  })

  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE.python)
  const [currentFileName, setCurrentFileName] = useState('main.py')
  const [terminalLogs, setTerminalLogs] = useState('')
  const [terminalInputVal, setTerminalInputVal] = useState('')
  const [isTerminalRunning, setIsTerminalRunning] = useState(false)
  const wsRef = useRef(null)
  const terminalBottomRef = useRef(null)
  const terminalInputRef = useRef(null)

  // Auto-scroll terminal to bottom when new logs or prompts arrive
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalLogs, isTerminalRunning])

  // Dropdown States
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('vscode-dark')

  // Status & Results
  const [analysisResult, setAnalysisResult] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [activeTab, setActiveTab] = useState('console')

  const [analyzing, setAnalyzing] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  // Editor telemetry
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  // File Workspace State (Local persistent storage)
  const [showWorkspace, setShowWorkspace] = useState(false)
  const [workspaceFiles, setWorkspaceFiles] = useState([])
  const [workspaceLang, setWorkspaceLang] = useState('all')
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveFileName, setSaveFileName] = useState('')

  // History State
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const editorRef = useRef(null)

  // Synchronize browser back/forward buttons (<- left arrow navigation)
  useEffect(() => {
    const handlePopState = () => {
      const isCompiler = window.location.hash.includes('compiler') || window.location.hash.includes('studio')
      setCurrentView(isCompiler ? 'compiler' : 'landing')
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  const navigateToCompiler = () => {
    window.history.pushState({ view: 'compiler' }, '', '#compiler')
    setCurrentView('compiler')
  }

  const navigateToLanding = () => {
    try {
      window.history.pushState({ view: 'landing' }, '', window.location.pathname || '/')
    } catch {
      window.location.hash = ''
    }
    setCurrentView('landing')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const closeDropdowns = () => {
      setShowLangDropdown(false)
      setShowThemeDropdown(false)
    }
    window.addEventListener('click', closeDropdowns)
    return () => window.removeEventListener('click', closeDropdowns)
  }, [])

  // Load persistent workspace files on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('codelens_workspace_files') || localStorage.getItem('codelens_guest_files')
      if (saved) {
        setWorkspaceFiles(JSON.parse(saved))
      }
    } catch (_) {}
  }, [])

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
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
    const cfg = LANGUAGES.find((l) => l.value === newLang)
    setCurrentFileName(cfg ? cfg.ext : 'snippet.txt')
    setAnalysisResult(null)
    setRunResult(null)
    setError('')
    setShowLangDropdown(false)
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
    showToast('✓ Code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = currentFileName || `code.${language}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast(`✓ Exported ${link.download}`)
  }

  // --- File Workspace Handlers (100% Local Browser Persistence) ---
  const handleOpenSaveModal = () => {
    setSaveFileName(currentFileName || `solution.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : 'java'}`)
    setSaveModalOpen(true)
  }

  const handleSaveFileConfirm = () => {
    if (!saveFileName.trim()) return
    const name = saveFileName.trim()
    const newFile = {
      id: Date.now(),
      name,
      language,
      code,
      updated_at: new Date().toISOString(),
    }
    const updated = [newFile, ...workspaceFiles.filter((f) => f.name !== name)]
    setWorkspaceFiles(updated)
    try {
      localStorage.setItem('codelens_workspace_files', JSON.stringify(updated))
    } catch (_) {}
    setCurrentFileName(name)
    setSaveModalOpen(false)
    showToast(`✓ Saved "${name}" to workspace`)
  }

  const handleLoadFile = (f) => {
    setLanguage(f.language)
    setCode(f.code)
    setCurrentFileName(f.name)
    setShowWorkspace(false)
    setAnalysisResult(null)
    setRunResult(null)
    showToast(`📁 Loaded "${f.name}"`)
  }

  const handleDeleteFile = (fId) => {
    const file = workspaceFiles.find((f) => f.id === fId)
    const filtered = workspaceFiles.filter((f) => f.id !== fId)
    setWorkspaceFiles(filtered)
    try {
      localStorage.setItem('codelens_workspace_files', JSON.stringify(filtered))
    } catch (_) {}
    showToast(`🗑️ Deleted ${file ? file.name : 'file'}`)
  }

  // --- History Handlers with Delete Support ---
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
    } catch (_) {
      setError('Could not retrieve past records.')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleClearAllHistory = async () => {
    if (!confirm('Clear all analysis history records?')) return
    try {
      await fetch(`${API_URL}/history`, { method: 'DELETE' })
      setHistory([])
    } catch (_) {}
  }

  const handleDeleteHistoryItem = async (recordId, e) => {
    e.stopPropagation()
    try {
      await fetch(`${API_URL}/history/${recordId}`, { method: 'DELETE' })
      setHistory(history.filter((h) => h.id !== recordId))
    } catch (_) {}
  }

  // --- Execution & Analysis ---
  const handleRun = () => {
    setError('')
    setActiveTab('console')
    setRunning(true)
    setIsTerminalRunning(true)
    setTerminalInputVal('')

    // Close any previous websocket
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch (_) {}
    }

    const startBanner = `parikshit@codelens:~$ run ${currentFileName}\n`
    setTerminalLogs(startBanner)

    const rawWsUrl = API_URL.replace(/^http/, 'ws')
    let ws = null
    try {
      ws = new WebSocket(`${rawWsUrl}/ws/terminal`)
      wsRef.current = ws
    } catch (_) {
      executeHttpFallback()
      return
    }

    let isConnected = false
    const fallbackTimer = setTimeout(() => {
      if (!isConnected) {
        try { ws.close() } catch (_) {}
        executeHttpFallback()
      }
    }, 4000)

    ws.onopen = () => {
      isConnected = true
      clearTimeout(fallbackTimer)
      ws.send(JSON.stringify({ type: 'start', code, language }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'stdout' || msg.type === 'stderr') {
          setTerminalLogs((prev) => prev + msg.data)
        } else if (msg.type === 'exit') {
          setIsTerminalRunning(false)
          setRunning(false)
          setTerminalLogs((prev) => prev + `\n[Process completed in ${msg.execution_time_ms}ms with exit code ${msg.code}]\n`)
          setRunResult({
            success: msg.code === 0,
            exit_code: String(msg.code),
            execution_time_ms: msg.execution_time_ms,
          })
          try { ws.close() } catch (_) {}
        }
      } catch (_) {
        setTerminalLogs((prev) => prev + event.data)
      }
    }

    ws.onerror = () => {
      clearTimeout(fallbackTimer)
      if (!isConnected) {
        executeHttpFallback()
      }
    }

    ws.onclose = () => {
      clearTimeout(fallbackTimer)
      setIsTerminalRunning(false)
      setRunning(false)
    }
  }

  const executeHttpFallback = async () => {
    setRunning(true)
    setIsTerminalRunning(false)
    try {
      const response = await fetch(`${API_URL}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, stdin: '' }),
      })
      const data = await response.json()
      if (!response.ok) {
        setTerminalLogs((prev) => prev + `\n${data.detail || 'Execution failed'}\n`)
      } else {
        let out = data.stdout || ''
        if (data.stderr) out += (out ? '\n' : '') + data.stderr
        setTerminalLogs((prev) => prev + out + `\n[Process finished in ${data.execution_time_ms}ms (exit ${data.exit_code})]\n`)
        setRunResult(data)
      }
    } catch (_) {
      setTerminalLogs((prev) => prev + '\n[Could not connect to execution backend]\n')
    } finally {
      setRunning(false)
    }
  }

  const handleTerminalInputSubmit = (e) => {
    e?.preventDefault()
    if (!isTerminalRunning || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }
    const val = terminalInputVal
    setTerminalLogs((prev) => prev + val + '\n')
    wsRef.current.send(JSON.stringify({ type: 'stdin', data: val + '\n' }))
    setTerminalInputVal('')
  }

  const handleTerminalKill = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill' }))
    }
    setTerminalLogs((prev) => prev + '^C\n[Process terminated by user]\n')
    setIsTerminalRunning(false)
    setRunning(false)
  }

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
    } catch (_) {
      setError('Could not reach backend analyzer.')
    } finally {
      setAnalyzing(false)
    }
  }

  // Keyboard Shortcuts
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
  }, [code, language])

  const currentLangConfig = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]
  const themeConfig = THEMES.find((t) => t.value === currentTheme) || THEMES[0]

  const getSpectrumIndex = (complexityStr) => {
    if (!complexityStr) return -1
    const s = complexityStr.toLowerCase()
    if (s.includes('o(1)')) return 0
    if (s.includes('log n') && !s.includes('n log')) return 1
    if (s === 'o(n)') return 2
    if (s.includes('n log n')) return 3
    if (s.includes('n^2') || s.includes('n²')) return 4
    if (s.includes('2^n') || s.includes('n!')) return 5
    return 2
  }

  const activeSpectrumIdx = analysisResult
    ? getSpectrumIndex(analysisResult.estimated_time_complexity)
    : -1

  const filteredWorkspaceFiles = workspaceLang === 'all'
    ? workspaceFiles
    : workspaceFiles.filter((f) => f.language === workspaceLang)

  const isLight = currentTheme === 'light'

  if (currentView === 'landing') {
    return (
      <LandingPage
        onLaunchStudio={navigateToCompiler}
      />
    )
  }

  return (
    <div className={`min-h-screen ${themeConfig.bg} ${themeConfig.text} flex flex-col font-sans transition-colors duration-200 select-none`}>
      {/* Top Navbar — Professional VS Code / Linear Aesthetic */}
      <header className={`border-b ${themeConfig.border} ${themeConfig.headerBg} px-4 py-2 sticky top-0 z-30 flex items-center justify-between gap-3 text-xs`}>
        {/* Left: Clean, Minimalist Typography Logo & Workspace */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWorkspace(true)}
            className={`p-1.5 px-2.5 rounded border ${isLight ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800' : `${themeConfig.border} hover:bg-black/10 dark:hover:bg-white/5`} transition flex items-center gap-1.5 cursor-pointer text-xs`}
            title="Open Files Explorer"
          >
            <span>📁</span>
            <span className="font-medium hidden sm:inline">Files</span>
            {workspaceFiles.length > 0 && (
              <span className={`font-mono text-[10px] ${isLight ? 'text-slate-600 font-bold' : 'opacity-60'}`}>({workspaceFiles.length})</span>
            )}
          </button>

          <button
            onClick={navigateToLanding}
            className={`flex items-center gap-2 group cursor-pointer text-left px-2 py-1 rounded-md transition ${
              isLight
                ? 'hover:bg-slate-200/80 active:bg-slate-300'
                : 'hover:bg-white/10 active:bg-white/15'
            }`}
            title="Return to Main Interface (Landing & Overview)"
          >
            <span className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
              <span className={`font-mono text-base ${isLight ? 'text-blue-600 font-bold' : 'text-blue-400 font-bold'} group-hover:scale-110 transition-transform duration-150`}>λ</span>
              <span className={`${isLight ? 'text-slate-900 font-extrabold' : 'text-zinc-100 font-bold'} group-hover:text-blue-500 transition-colors`}>CodeLens</span>
              <span className={`${isLight ? 'text-slate-600 font-semibold' : 'text-zinc-500 font-normal'} text-xs`}>studio</span>
            </span>
            <span className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
              isLight ? 'text-emerald-800 bg-emerald-100 border border-emerald-300 font-semibold' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sandbox
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded transition hidden md:inline-flex items-center gap-1 font-medium ${
              isLight ? 'text-slate-700 bg-white border border-slate-300 group-hover:border-slate-400 shadow-2xs' : 'text-zinc-300 border border-zinc-700/60 group-hover:border-zinc-500'
            }`}>
              ← Main Page
            </span>
          </button>
        </div>

        {/* Center: Language & Theme Vertical Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Vertical Language Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowLangDropdown(!showLangDropdown)
                setShowThemeDropdown(false)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${themeConfig.border} ${isLight ? 'bg-white hover:bg-slate-50 text-slate-800 shadow-xs' : 'bg-[#1e1e1e] hover:bg-[#2d2d2d] text-zinc-200'} transition cursor-pointer text-xs font-medium`}
            >
              <span>{currentLangConfig.badge}</span>
              <span>{currentLangConfig.label}</span>
              <span className="text-[10px] opacity-60">▾</span>
            </button>

            {showLangDropdown && (
              <div className={`absolute top-full mt-1 left-0 w-48 rounded-md shadow-2xl border ${themeConfig.border} ${isLight ? 'bg-white' : 'bg-[#252526]'} py-1 z-50 animate-fade-in`}>
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-inherit">
                  Select Language
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => handleLanguageChange(l.value)}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                      language === l.value
                        ? 'bg-blue-600 text-white font-medium'
                        : isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-zinc-300 hover:bg-[#2a2d2e]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.badge}</span>
                      <span>{l.label}</span>
                    </span>
                    <span className={`text-[10px] font-mono ${language === l.value ? 'text-blue-100' : 'text-zinc-500'}`}>
                      {l.version}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vertical Theme / Background Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowThemeDropdown(!showThemeDropdown)
                setShowLangDropdown(false)
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${themeConfig.border} ${isLight ? 'bg-white hover:bg-slate-50 text-slate-700 shadow-xs' : 'bg-[#1e1e1e] hover:bg-[#2d2d2d] text-zinc-300'} transition cursor-pointer text-xs`}
              title="Change Editor Theme & Background"
            >
              <span>🎨</span>
              <span className="hidden md:inline">{themeConfig.label}</span>
              <span className="text-[10px] opacity-60">▾</span>
            </button>

            {showThemeDropdown && (
              <div className={`absolute top-full mt-1 right-0 w-44 rounded-md shadow-2xl border ${themeConfig.border} ${isLight ? 'bg-white' : 'bg-[#252526]'} py-1 z-50 animate-fade-in`}>
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-inherit">
                  Editor Theme
                </div>
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setCurrentTheme(t.value)
                      setShowThemeDropdown(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition cursor-pointer ${
                      currentTheme === t.value
                        ? 'bg-blue-600 text-white font-medium'
                        : isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-zinc-300 hover:bg-[#2a2d2e]'
                    }`}
                  >
                    <span>{t.label}</span>
                    {currentTheme === t.value && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Polished Fast Run Button */}
          <button
            onClick={handleRun}
            disabled={running || analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer active:scale-95 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Execute Code (⌘+Enter)"
          >
            {running ? (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-xs">▶</span>
            )}
            <span>Run</span>
            <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-mono bg-black/25 rounded opacity-80">⌘↵</kbd>
          </button>

          {/* Polished Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={running || analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition cursor-pointer active:scale-95 shadow-sm bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/40 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Algorithmic AST Analysis (⇧+⌘+Enter)"
          >
            {analyzing ? (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-xs">⚡</span>
            )}
            <span>Analyze</span>
            <kbd className="hidden md:inline-block px-1 py-0.2 text-[9px] font-mono bg-black/25 rounded opacity-80">⇧⌘↵</kbd>
          </button>

          {/* History Icon */}
          <button
            onClick={handleToggleHistory}
            disabled={historyLoading}
            className={`p-1.5 rounded-md border ${isLight ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700' : `${themeConfig.border} hover:bg-black/10 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-200`} transition cursor-pointer text-xs`}
            title="Past Analysis Records"
          >
            📜
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 p-2 lg:p-3 grid grid-cols-1 lg:grid-cols-12 gap-2 max-w-[1900px] w-full mx-auto">
        {/* Left Column: Editor Studio (7 cols) */}
        <section className={`lg:col-span-7 flex flex-col rounded-lg border ${themeConfig.border} ${themeConfig.surface} overflow-hidden shadow-sm`}>
          {/* File Tab Header with Save & Export */}
          <div className={`flex items-center justify-between px-3 py-1.5 border-b ${themeConfig.border} ${themeConfig.headerBg} text-xs`}>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-2.5 py-0.5 rounded ${themeConfig.bg} border ${isLight ? 'border-slate-300 text-slate-900 font-bold' : `${themeConfig.border} text-zinc-200 font-mono`} text-xs shadow-xs`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{currentFileName}</span>
              </div>

              <button
                onClick={handleOpenSaveModal}
                className={`px-2 py-0.5 rounded border border-transparent transition text-[11px] flex items-center gap-1 cursor-pointer font-medium ${
                  isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200 hover:border-slate-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 hover:border-zinc-700'
                }`}
                title="Save file to workspace"
              >
                <span>💾</span>
                <span>Save</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className={`px-2 py-0.5 rounded border border-transparent transition text-[11px] flex items-center gap-1 cursor-pointer font-medium ${
                  isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200 hover:border-slate-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 hover:border-zinc-700'
                }`}
                title="Download file to computer"
              >
                <span>📥</span>
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className={`px-2 py-0.5 rounded border border-transparent transition text-[11px] font-medium ${
                  isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200 hover:border-slate-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 hover:border-zinc-700'
                }`}
                title="Copy Code"
              >
                {copied ? <span className="text-emerald-600 font-bold">✓ Copied</span> : <span>Copy</span>}
              </button>

              <button
                onClick={() => setCode(DEFAULT_CODE[language])}
                className={`px-2 py-0.5 rounded border border-transparent transition text-[11px] font-medium ${
                  isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200 hover:border-slate-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 hover:border-zinc-700'
                }`}
                title="Reset to boilerplate"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[480px] lg:min-h-[580px]">
            <Editor
              height="100%"
              language={currentLangConfig.monaco}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              theme={themeConfig.monacoTheme}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', Consolas, Menlo, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                lineHeight: 20,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                padding: { top: 8, bottom: 8 },
                renderLineHighlight: 'all',
              }}
            />
          </div>

          {/* Editor Status Bar — VS Code Style */}
          <div className={`px-3 py-1 border-t ${themeConfig.border} ${themeConfig.headerBg} flex items-center justify-between text-[11px] font-mono ${isLight ? 'text-slate-700 font-medium' : 'text-zinc-400'}`}>
            <div className="flex items-center gap-3">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>•</span>
              <span>UTF-8</span>
              <span>•</span>
              <span>Local Workspace</span>
            </div>

            <div className="flex items-center gap-3">
              <span>{code.length} chars</span>
              <span>•</span>
              <span>{currentLangConfig.label}</span>
            </div>
          </div>
        </section>

        {/* Right Column: Console & Diagnostics HUD (5 cols) */}
        <section className={`lg:col-span-5 flex flex-col rounded-lg border ${themeConfig.border} ${themeConfig.surface} overflow-hidden shadow-sm`}>
          {/* Header Tab Bar */}
          <div className={`flex items-center justify-between border-b ${themeConfig.border} ${themeConfig.headerBg} px-2 py-1`}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('console')}
                className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'console'
                    ? `${themeConfig.bg} ${isLight ? 'text-slate-900 font-bold border-slate-300' : 'text-zinc-100 font-semibold'} shadow-xs border ${themeConfig.border}`
                    : isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Terminal</span>
                {isTerminalRunning ? (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ) : runResult ? (
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${runResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                ) : null}
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'diagnostics'
                    ? `${themeConfig.bg} ${isLight ? 'text-slate-900 font-bold border-slate-300' : 'text-zinc-100 font-semibold'} shadow-xs border ${themeConfig.border}`
                    : isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Complexity Diagnostics</span>
                {analysisResult && <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            </div>

            <button
              onClick={() => {
                setRunResult(null)
                setAnalysisResult(null)
                setError('')
              }}
              className={`text-[11px] font-mono px-2 py-0.5 rounded transition ${
                isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200 font-medium' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              Clear
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-2 p-2 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2">
              <span>⚠️</span>
              <p className="flex-1 font-mono">{error}</p>
            </div>
          )}

          {/* Panel Viewport */}
          <div className="flex-1 p-3 overflow-y-auto">
            {/* Terminal Tab */}
            {activeTab === 'console' && (
              <div className="flex flex-col h-full font-mono text-xs">
                {/* Terminal Toolbar */}
                <div className={`flex items-center justify-between ${isLight ? 'text-slate-700' : 'text-zinc-400'} mb-2 pb-1.5 border-b ${themeConfig.border}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-mono font-semibold ${isLight ? 'text-slate-800' : 'text-zinc-300'}`}>
                      Interactive Terminal
                    </span>
                    {isTerminalRunning ? (
                      <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Running ({language.toUpperCase()})
                      </span>
                    ) : runResult ? (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 ${
                        runResult.success
                          ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/10 text-emerald-400'
                          : isLight ? 'bg-rose-100 text-rose-800' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${runResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        Exit {runResult.exit_code ?? 0} ({runResult.execution_time_ms} ms)
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 font-mono">• Ready</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isTerminalRunning && (
                      <button
                        onClick={handleTerminalKill}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                        title="Stop running program (Ctrl+C)"
                      >
                        <span>■</span>
                        <span>Stop</span>
                      </button>
                    )}

                    {terminalLogs && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(terminalLogs)
                          showToast('✓ Terminal logs copied')
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition flex items-center gap-1 cursor-pointer font-mono ${
                          isLight ? 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100' : 'text-zinc-400 border-zinc-700/60 hover:bg-white/5 hover:text-zinc-200'
                        }`}
                        title="Copy terminal output"
                      >
                        <span>📋</span>
                        <span>Copy</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setTerminalLogs('')
                        setRunResult(null)
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border transition flex items-center gap-1 cursor-pointer font-mono ${
                        isLight ? 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100' : 'text-zinc-400 border-zinc-700/60 hover:bg-white/5 hover:text-zinc-200'
                      }`}
                      title="Clear terminal"
                    >
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Main Unified Terminal Viewport */}
                <div
                  className={`flex-1 ${isLight ? 'bg-slate-950 text-slate-100' : 'bg-[#0f1013] text-zinc-100'} rounded-lg p-3 border ${themeConfig.border} overflow-y-auto min-h-[420px] max-h-[640px] font-mono text-xs cursor-text flex flex-col shadow-inner`}
                  onClick={() => terminalInputRef.current?.focus()}
                >
                  {terminalLogs ? (
                    <div className="flex-1 font-mono text-xs leading-relaxed">
                      <pre className="whitespace-pre-wrap font-mono inline text-emerald-400/90 selection:bg-emerald-800/40 selection:text-white">
                        {terminalLogs}
                      </pre>
                      {isTerminalRunning && (
                        <form
                          onSubmit={handleTerminalInputSubmit}
                          className="inline-flex items-center align-baseline ml-0.5"
                        >
                          <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInputVal}
                            onChange={(e) => setTerminalInputVal(e.target.value)}
                            autoFocus
                            className="bg-transparent border-b border-emerald-400 outline-none font-mono text-xs text-white min-w-[70px] max-w-full px-1 py-0 caret-emerald-400 placeholder-zinc-600 focus:border-emerald-300"
                            placeholder="type & ↵"
                          />
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-16 gap-2 text-center select-none text-zinc-500">
                      <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 font-mono text-sm shadow-inner">
                        ❯_
                      </div>
                      <p className="font-mono text-xs font-semibold text-zinc-300">CodeLens Interactive Terminal</p>
                      <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                        Interactive standard I/O sandbox. Type prompts directly here just like in VS Code.
                      </p>
                      <p className="text-[10px] text-zinc-600 font-mono">
                        Press <span className="text-zinc-400 font-bold">Run</span> or <span className="text-zinc-400 font-bold">⌘↵</span> to execute.
                      </p>
                    </div>
                  )}
                  <div ref={terminalBottomRef} />
                </div>
              </div>
            )}

            {/* Diagnostics HUD Tab */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-3">
                {analyzing ? (
                  <div className="flex items-center justify-center min-h-[380px] text-zinc-400 gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    <span className={isLight ? 'text-slate-700 font-medium' : 'text-zinc-400'}>Analyzing code structure & loops...</span>
                  </div>
                ) : analysisResult ? (
                  <>
                    {/* Big-O Spectrum Radar */}
                    <div className={`p-2.5 rounded border ${isLight ? 'bg-white border-slate-300 shadow-xs' : `${themeConfig.border} bg-[#181818]`}`}>
                      <div className={`flex items-center justify-between text-[11px] mb-1.5 font-mono ${isLight ? 'text-slate-700 font-bold' : 'text-zinc-500'}`}>
                        <span>COMPLEXITY RATING</span>
                        <span>O(1) ➔ O(2^n)</span>
                      </div>

                      <div className="grid grid-cols-6 gap-1">
                        {COMPLEXITY_SPECTRUM.map((item, idx) => {
                          const isActive = idx === activeSpectrumIdx
                          return (
                            <div
                              key={item.label}
                              className={`p-1.5 rounded text-center border transition ${
                                isActive
                                  ? isLight
                                    ? 'bg-blue-600 text-white font-extrabold border-blue-600 shadow-md shadow-blue-500/30 ring-1 ring-blue-600'
                                    : 'bg-gradient-to-b from-blue-600/30 to-indigo-600/20 border-blue-500 text-white font-bold ring-1 ring-blue-500/70 shadow-sm shadow-blue-500/20'
                                  : isLight
                                    ? 'border-slate-300 bg-slate-50 text-slate-700 font-medium hover:border-slate-400'
                                    : 'border-transparent text-zinc-500 opacity-60'
                              }`}
                            >
                              <p className="font-mono text-[11px]">{item.label}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Dual Metric Cards */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`p-3 rounded border ${isLight ? 'bg-white border-slate-300 shadow-xs' : `${themeConfig.border} bg-[#181818]`}`}>
                        <span className={`text-[10px] uppercase font-mono font-semibold block ${isLight ? 'text-slate-600 font-bold' : 'text-zinc-500'}`}>
                          Time Complexity
                        </span>
                        <p className={`mt-1 text-xl font-bold font-mono ${isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400'}`}>
                          {analysisResult.estimated_time_complexity}
                        </p>
                      </div>

                      <div className={`p-3 rounded border ${isLight ? 'bg-white border-slate-300 shadow-xs' : `${themeConfig.border} bg-[#181818]`}`}>
                        <span className={`text-[10px] uppercase font-mono font-semibold block ${isLight ? 'text-slate-600 font-bold' : 'text-zinc-500'}`}>
                          Auxiliary Space
                        </span>
                        <p className={`mt-1 text-xl font-bold font-mono ${isLight ? 'text-indigo-700 font-extrabold' : 'text-indigo-400'}`}>
                          {analysisResult.estimated_space_complexity}
                        </p>
                      </div>
                    </div>

                    {/* Algorithmic Efficiency Assessment */}
                    {activeSpectrumIdx >= 0 && (
                      <div>
                        {activeSpectrumIdx <= 1 && (
                          <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                            isLight
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium'
                              : 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                          }`}>
                            <span>⚡</span>
                            <span><strong>Optimal Efficiency:</strong> Sub-linear scaling. Handles large-scale datasets with minimal latency.</span>
                          </div>
                        )}
                        {activeSpectrumIdx >= 2 && activeSpectrumIdx <= 3 && (
                          <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                            isLight
                              ? 'border-blue-300 bg-blue-50 text-blue-950 font-medium'
                              : 'border-blue-800/40 bg-blue-950/20 text-blue-300'
                          }`}>
                            <span>🔷</span>
                            <span><strong>Scalable Efficiency:</strong> Linear or linearithmic runtime. Standard production efficiency.</span>
                          </div>
                        )}
                        {activeSpectrumIdx >= 4 && (
                          <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
                            isLight
                              ? 'border-amber-300 bg-amber-50 text-amber-950 font-medium'
                              : 'border-amber-800/40 bg-amber-950/20 text-amber-300'
                          }`}>
                            <span>⚠️</span>
                            <span><strong>Performance Bottleneck:</strong> Nested loops or recursion detected. Consider hash maps or two-pointer techniques.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reasoning Breakdown */}
                    {analysisResult.explanation && (
                      <div className={`p-3 rounded border ${isLight ? 'bg-white border-slate-300 shadow-xs' : `${themeConfig.border} bg-[#181818]`}`}>
                        <p className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-900 font-bold' : 'text-zinc-300'}`}>
                          <span>💡</span> Diagnostic Breakdown
                        </p>
                        <p className={`text-xs leading-relaxed font-sans ${isLight ? 'text-slate-700 font-normal' : 'text-zinc-400'}`}>
                          {analysisResult.explanation}
                        </p>
                      </div>
                    )}

                    {/* Bottlenecks List */}
                    {analysisResult.bottlenecks && analysisResult.bottlenecks.length > 0 && (
                      <div>
                        <p className={`text-[10px] font-mono uppercase tracking-wider font-semibold mb-1.5 ${isLight ? 'text-slate-700 font-bold' : 'text-zinc-500'}`}>
                          Detected Loop & Recursion Lines
                        </p>
                        <div className="space-y-1.5">
                          {analysisResult.bottlenecks.map((b, idx) => (
                            <div
                              key={idx}
                              onClick={() => jumpToLine(b.line)}
                              className={`p-2.5 rounded border cursor-pointer transition flex items-start gap-2.5 group ${
                                isLight
                                  ? 'bg-white hover:bg-slate-50 border-slate-300 shadow-xs'
                                  : `bg-[#181818] hover:bg-[#202020] ${themeConfig.border} hover:border-zinc-500`
                              }`}
                              title="Click to jump to line in editor"
                            >
                              <span className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold transition ${
                                isLight
                                  ? 'bg-slate-200 text-slate-800 group-hover:bg-blue-600 group-hover:text-white'
                                  : 'bg-white/10 text-zinc-200 group-hover:bg-blue-600 group-hover:text-white'
                              }`}>
                                L{b.line}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-medium ${isLight ? 'text-slate-900 font-bold' : 'text-zinc-300'}`}>{b.type}</span>
                                  <span className={`text-xs font-mono font-bold ${isLight ? 'text-amber-700 font-extrabold' : 'text-amber-400'}`}>{b.complexity}</span>
                                </div>
                                <p className={`text-[11px] mt-0.5 font-sans leading-normal ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
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
                  <div className="text-zinc-500 flex flex-col items-center justify-center min-h-[380px] gap-1 text-center py-20">
                    <p className="font-mono text-xs">Diagnostics ready</p>
                    <p className="text-[11px] text-zinc-500">
                      Press Analyze to estimate algorithmic Big-O complexity.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Workspace Sidebar Drawer (Files grouped by language) */}
      {showWorkspace && (
        <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md ${themeConfig.surface} border-r ${themeConfig.border} h-full flex flex-col p-5 shadow-2xl`}>
            <div className={`flex items-center justify-between pb-3 border-b ${themeConfig.border}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">📁</span>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900 font-bold' : ''}`}>Workspace Files</h3>
              </div>
              <button
                onClick={() => setShowWorkspace(false)}
                className={`w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center transition cursor-pointer ${
                  isLight ? 'text-slate-600 hover:text-slate-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Language filter pills for workspace */}
            <div className={`flex items-center gap-1 py-2.5 border-b ${themeConfig.border} overflow-x-auto`}>
              <button
                onClick={() => setWorkspaceLang('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  workspaceLang === 'all'
                    ? 'bg-blue-600 text-white font-semibold'
                    : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({workspaceFiles.length})
              </button>
              {LANGUAGES.map((l) => {
                const count = workspaceFiles.filter((f) => f.language === l.value).length
                return (
                  <button
                    key={l.value}
                    onClick={() => setWorkspaceLang(l.value)}
                    className={`px-2 py-1 rounded text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                      workspaceLang === l.value
                        ? 'bg-blue-600 text-white font-semibold'
                        : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{l.badge}</span>
                    <span>{l.label}</span>
                    {count > 0 && <span className="text-[10px] opacity-60">({count})</span>}
                  </button>
                )
              })}
            </div>

            {/* Workspace File List */}
            <div className="flex-1 overflow-y-auto py-2.5 space-y-1.5">
              {filteredWorkspaceFiles.length === 0 ? (
                <div className={`text-center py-12 ${isLight ? 'text-slate-500' : 'text-zinc-500'}`}>
                  <p className="text-xl mb-1">📂</p>
                  <p className="text-xs">No files saved in this section yet.</p>
                  <p className="text-[11px] mt-1">
                    Click &quot;Save&quot; in the editor to store snippets.
                  </p>
                </div>
              ) : (
                filteredWorkspaceFiles.map((f) => (
                  <div
                    key={f.id}
                    className={`p-2.5 rounded border transition flex items-center justify-between group ${
                      isLight
                        ? 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                        : `${themeConfig.border} ${themeConfig.bg} hover:border-zinc-500`
                    }`}
                  >
                    <div
                      onClick={() => handleLoadFile(f)}
                      className="flex-1 cursor-pointer pr-2"
                    >
                      <div className="flex items-center gap-2">
                        <span>{LANGUAGES.find((l) => l.value === f.language)?.badge || '📄'}</span>
                        <span className={`text-xs font-mono group-hover:text-blue-500 transition ${isLight ? 'text-slate-900 font-bold' : 'text-zinc-200 font-medium'}`}>
                          {f.name}
                        </span>
                      </div>
                      <p className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-zinc-500'}`}>
                        {f.language.toUpperCase()} • {f.code.length} chars
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLoadFile(f)}
                        className="px-2 py-0.5 rounded text-[11px] bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 transition cursor-pointer font-medium"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteFile(f.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1 transition text-xs cursor-pointer"
                        title="Delete File"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`pt-2.5 border-t ${themeConfig.border} text-[11px] flex items-center justify-between ${isLight ? 'text-slate-700 font-medium' : 'text-zinc-500'}`}>
              <span>Local browser storage</span>
              <span className={`font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-zinc-400'}`}>Zero login required</span>
            </div>
          </div>
        </div>
      )}

      {/* Save File Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`w-full max-w-sm ${themeConfig.surface} border ${themeConfig.border} rounded-lg p-4 shadow-2xl`}>
            <h3 className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${isLight ? 'text-slate-900 font-bold' : 'text-zinc-200'}`}>
              <span>💾</span> Save to {language.toUpperCase()} Section
            </h3>
            <p className={`text-xs mb-3 ${isLight ? 'text-slate-600' : 'text-zinc-400'}`}>
              Enter file name:
            </p>

            <input
              type="text"
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              placeholder="e.g. solution.py"
              className={`w-full ${themeConfig.bg} border ${isLight ? 'border-slate-300 text-slate-900 focus:bg-white' : `${themeConfig.border}`} rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500 mb-3`}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className={`px-3 py-1 rounded text-xs transition ${isLight ? 'text-slate-600 hover:text-slate-900' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFileConfirm}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Slide-Over Drawer with Clear All & Delete Single */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md ${themeConfig.surface} border-l ${themeConfig.border} h-full flex flex-col p-5 shadow-2xl`}>
            <div className={`flex items-center justify-between pb-3 border-b ${themeConfig.border}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">📜</span>
                <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900 font-bold' : ''}`}>Analysis History</h3>
              </div>

              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-xs text-rose-500 hover:text-rose-600 hover:underline cursor-pointer font-medium"
                    title="Delete all history"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className={`w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center transition cursor-pointer ${isLight ? 'text-slate-600 hover:text-slate-950' : 'text-zinc-400 hover:text-white'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {history.length === 0 ? (
                <p className={`${isLight ? 'text-slate-500' : 'text-zinc-500'} text-xs italic text-center py-12 font-mono`}>
                  No previous records found.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded border transition group ${
                      isLight
                        ? 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                        : `${themeConfig.border} ${themeConfig.bg} hover:border-zinc-500`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-zinc-500'}`}>Record #{item.id}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                          <span className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}>{item.time_complexity}</span>
                          <span className={isLight ? 'text-slate-400' : 'text-zinc-500'}>•</span>
                          <span className={isLight ? 'text-indigo-700 font-bold' : 'text-indigo-400'}>{item.space_complexity}</span>
                        </div>
                        {/* Delete Single History Record Button */}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="text-zinc-400 hover:text-rose-500 p-0.5 transition cursor-pointer text-xs"
                          title="Delete this record"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <pre className={`text-[11px] font-mono line-clamp-3 p-2 rounded border overflow-hidden ${
                      isLight ? 'bg-slate-50 text-slate-800 border-slate-200' : `${themeConfig.border} bg-[#181818] text-zinc-400`
                    }`}>
                      {item.code}
                    </pre>
                    <button
                      onClick={() => {
                        setCode(item.code)
                        setShowHistory(false)
                        showToast(`Loaded Record #${item.id}`)
                      }}
                      className="mt-1.5 text-xs font-medium text-blue-500 hover:underline transition flex items-center gap-1 cursor-pointer"
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

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#161b22] text-zinc-100 border border-zinc-700/80 px-4 py-2 rounded-lg shadow-2xl text-xs flex items-center gap-2 backdrop-blur-md animate-fade-in font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}
