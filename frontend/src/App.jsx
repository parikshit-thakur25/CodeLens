import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

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
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE.python)
  const [currentFileName, setCurrentFileName] = useState('main.py')
  const [stdin, setStdin] = useState('')
  const [showStdin, setShowStdin] = useState(false)

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

  // User Auth State
  const [token, setToken] = useState(localStorage.getItem('codelens_token') || '')
  const [user, setUser] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState('phone') // 'phone' | 'password'
  const [authMode, setAuthMode] = useState('login')
  const [authUsername, setAuthUsername] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Phone Auth State
  const [phone, setPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phonePassword, setPhonePassword] = useState('')
  const [phoneStep, setPhoneStep] = useState('phone') // 'phone' | 'otp'
  const [phoneInfo, setPhoneInfo] = useState('')

  // Google Auth State
  const [googleClientId, setGoogleClientId] = useState(
    localStorage.getItem('codelens_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  )
  const [showGoogleConfig, setShowGoogleConfig] = useState(false)

  // File Workspace State
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

  // Close dropdowns on outside click
  useEffect(() => {
    const closeDropdowns = () => {
      setShowLangDropdown(false)
      setShowThemeDropdown(false)
    }
    window.addEventListener('click', closeDropdowns)
    return () => window.removeEventListener('click', closeDropdowns)
  }, [])

  // Check Auth Session on mount
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((u) => {
          if (u) {
            setUser(u)
            loadUserFiles(token)
          } else {
            handleLogout()
          }
        })
        .catch(() => {})
    } else {
      const local = localStorage.getItem('codelens_guest_files')
      if (local) {
        try {
          setWorkspaceFiles(JSON.parse(local))
        } catch (_) {}
      }
    }
  }, [token])

  // Handle Google OAuth Redirect Return
  useEffect(() => {
    if (window.location.hash.includes('access_token=')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      if (accessToken) {
        window.history.replaceState(null, '', window.location.pathname)
        setAuthLoading(true)
        setShowAuthModal(true)
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((r) => r.json())
          .then((info) => {
            if (info.email) {
              handleGoogleSubmit(info.email, info.name, info.picture)
            } else {
              setAuthError('Google sign in did not return an email address.')
            }
          })
          .catch(() => {
            setAuthError('Could not verify Google authentication session.')
          })
          .finally(() => {
            setAuthLoading(false)
          })
      }
    }
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
  }

  // --- Auth Handlers ---
  const handleGoogleSubmit = async (customEmail = null, customName = null, customAvatar = null) => {
    setAuthError('')
    setAuthLoading(true)
    const emailToUse = customEmail || 'parikshit@gmail.com'
    const nameToUse = customName || emailToUse.split('@')[0]

    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToUse, name: nameToUse, avatar: customAvatar }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(data.detail || 'Google authentication failed')
      } else {
        localStorage.setItem('codelens_token', data.token)
        setToken(data.token)
        setUser(data.user)
        setShowAuthModal(false)
        setShowGoogleConfig(false)
        loadUserFiles(data.token)
      }
    } catch (_) {
      setAuthError('Could not connect to Google sign in service.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleOAuthRedirect = () => {
    const cid = googleClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('codelens_google_client_id')
    if (cid && cid.trim().length > 5) {
      const redirectUri = window.location.origin
      const scope = 'openid email profile'
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        cid.trim()
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=${encodeURIComponent(
        scope
      )}&prompt=select_account`
      window.location.href = authUrl
    } else {
      setShowGoogleConfig(true)
    }
  }

  const handleSaveGoogleClientId = (id) => {
    localStorage.setItem('codelens_google_client_id', id.trim())
    setGoogleClientId(id.trim())
    setShowGoogleConfig(false)
    if (id.trim().length > 5) {
      const redirectUri = window.location.origin
      const scope = 'openid email profile'
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        id.trim()
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=${encodeURIComponent(
        scope
      )}&prompt=select_account`
    }
  }

  const handleSendPhoneOtp = async (e) => {
    e.preventDefault()
    setAuthError('')
    setPhoneInfo('')
    if (!phone || phone.trim().length < 8) {
      setAuthError('Please enter a valid mobile number with country code (e.g. +91 98765 43210)')
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/phone/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(data.detail || 'Failed to send OTP')
      } else {
        setPhoneStep('otp')
        setPhoneInfo(data.message || `Verification code sent to ${phone}`)
      }
    } catch (_) {
      setAuthError('Could not reach mobile verification service.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault()
    setAuthError('')
    if (!phoneOtp || phoneOtp.trim().length < 4) {
      setAuthError('Please enter the verification code')
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/phone/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: phoneOtp,
          password: phonePassword || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(data.detail || 'Invalid verification code')
      } else {
        localStorage.setItem('codelens_token', data.token)
        setToken(data.token)
        setUser(data.user)
        setShowAuthModal(false)
        setPhoneStep('phone')
        setPhoneOtp('')
        setPhonePassword('')
        loadUserFiles(data.token)
      }
    } catch (_) {
      setAuthError('Verification failed. Please retry.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login'
    const body = authMode === 'register'
      ? { username: authUsername, email: authEmail, password: authPassword }
      : { username: authUsername, password: authPassword }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthError(data.detail || 'Authentication failed')
      } else {
        localStorage.setItem('codelens_token', data.token)
        setToken(data.token)
        setUser(data.user)
        setShowAuthModal(false)
        setAuthPassword('')
        loadUserFiles(data.token)
      }
    } catch (_) {
      setAuthError('Could not reach auth service.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('codelens_token')
    setToken('')
    setUser(null)
    const local = localStorage.getItem('codelens_guest_files')
    if (local) {
      try {
        setWorkspaceFiles(JSON.parse(local))
      } catch (_) {}
    } else {
      setWorkspaceFiles([])
    }
  }

  // --- File Workspace Handlers ---
  const loadUserFiles = async (authToken) => {
    try {
      const res = await fetch(`${API_URL}/files`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setWorkspaceFiles(data)
      }
    } catch (_) {}
  }

  const handleOpenSaveModal = () => {
    setSaveFileName(currentFileName || `solution.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'c' ? 'c' : 'java'}`)
    setSaveModalOpen(true)
  }

  const handleSaveFileConfirm = async () => {
    if (!saveFileName.trim()) return
    const name = saveFileName.trim()

    if (token) {
      try {
        const res = await fetch(`${API_URL}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, language, code }),
        })
        if (res.ok) {
          const saved = await res.json()
          setWorkspaceFiles([saved, ...workspaceFiles.filter((f) => f.id !== saved.id)])
          setCurrentFileName(name)
          setSaveModalOpen(false)
        }
      } catch (_) {
        setError('Failed to sync file.')
      }
    } else {
      const newFile = {
        id: Date.now(),
        name,
        language,
        code,
        updated_at: new Date().toISOString(),
      }
      const updated = [newFile, ...workspaceFiles.filter((f) => f.name !== name)]
      setWorkspaceFiles(updated)
      localStorage.setItem('codelens_guest_files', JSON.stringify(updated))
      setCurrentFileName(name)
      setSaveModalOpen(false)
    }
  }

  const handleLoadFile = (f) => {
    setLanguage(f.language)
    setCode(f.code)
    setCurrentFileName(f.name)
    setShowWorkspace(false)
    setAnalysisResult(null)
    setRunResult(null)
  }

  const handleDeleteFile = async (fId) => {
    if (token) {
      try {
        await fetch(`${API_URL}/files/${fId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (_) {}
    }
    const filtered = workspaceFiles.filter((f) => f.id !== fId)
    setWorkspaceFiles(filtered)
    if (!token) {
      localStorage.setItem('codelens_guest_files', JSON.stringify(filtered))
    }
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
    } catch (_) {
      setError('Could not reach execution backend.')
    } finally {
      setRunning(false)
    }
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
  }, [code, language, stdin])

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

  return (
    <div className={`min-h-screen ${themeConfig.bg} ${themeConfig.text} flex flex-col font-sans transition-colors duration-200 select-none`}>
      {/* Top Navbar — Professional VS Code / Linear Aesthetic */}
      <header className={`border-b ${themeConfig.border} ${themeConfig.headerBg} px-4 py-2 sticky top-0 z-30 flex items-center justify-between gap-3 text-xs`}>
        {/* Left: Clean, Minimalist Typography Logo & Workspace */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWorkspace(true)}
            className={`p-1.5 px-2.5 rounded border ${themeConfig.border} hover:bg-black/10 dark:hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer text-xs`}
            title="Open Files Explorer"
          >
            <span>📁</span>
            <span className="font-medium hidden sm:inline">Files</span>
            {workspaceFiles.length > 0 && (
              <span className="font-mono text-[10px] opacity-60">({workspaceFiles.length})</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
              <span className="font-mono text-zinc-400 font-normal">λ</span>
              <span className={isLight ? 'text-slate-900 font-bold' : 'text-zinc-100 font-bold'}>CodeLens</span>
              <span className="text-zinc-500 font-normal text-xs">studio</span>
            </span>
          </div>
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
              className={`flex items-center gap-2 px-3 py-1.5 rounded border ${themeConfig.border} ${isLight ? 'bg-white hover:bg-slate-50 text-slate-800' : 'bg-[#1e1e1e] hover:bg-[#2d2d2d] text-zinc-200'} transition cursor-pointer text-xs font-medium`}
            >
              <span>{currentLangConfig.badge}</span>
              <span>{currentLangConfig.label}</span>
              <span className="text-[10px] opacity-60">▾</span>
            </button>

            {showLangDropdown && (
              <div className={`absolute top-full mt-1 left-0 w-44 rounded-md shadow-xl border ${themeConfig.border} ${isLight ? 'bg-white' : 'bg-[#252526]'} py-1 z-50 animate-fade-in`}>
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border ${themeConfig.border} ${isLight ? 'bg-white hover:bg-slate-50 text-slate-700' : 'bg-[#1e1e1e] hover:bg-[#2d2d2d] text-zinc-300'} transition cursor-pointer text-xs`}
              title="Change Editor Theme & Background"
            >
              <span>🎨</span>
              <span className="hidden md:inline">{themeConfig.label}</span>
              <span className="text-[10px] opacity-60">▾</span>
            </button>

            {showThemeDropdown && (
              <div className={`absolute top-full mt-1 right-0 w-40 rounded-md shadow-xl border ${themeConfig.border} ${isLight ? 'bg-white' : 'bg-[#252526]'} py-1 z-50 animate-fade-in`}>
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

        {/* Right: Restrained, Professional Action Buttons & Sign In */}
        <div className="flex items-center gap-2">
          {/* Professional Run Button (No loud clown colors) */}
          <button
            onClick={handleRun}
            disabled={running || analyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-medium text-xs transition cursor-pointer ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                : 'bg-[#2d2d2d] hover:bg-[#383838] text-emerald-400 border-[#3c3c3c] hover:border-emerald-500/40'
            } disabled:opacity-40`}
          >
            {running ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-[11px]">▶</span>
            )}
            <span>Run</span>
            <kbd className="hidden md:inline-block px-1 text-[9px] font-mono opacity-60">⌘↵</kbd>
          </button>

          {/* Professional Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={running || analyzing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded border font-medium text-xs transition cursor-pointer ${
              isLight
                ? 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900'
                : 'bg-[#2d2d2d] hover:bg-[#383838] text-zinc-100 border-[#3c3c3c] hover:border-zinc-500'
            } disabled:opacity-40`}
          >
            {analyzing ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-amber-400 text-xs">⚡</span>
            )}
            <span>Analyze</span>
          </button>

          {/* Clean VS Code style Sign In / Account button (No bulky box) */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-700/40">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-zinc-600 shadow"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center uppercase shadow"
                  title={`Logged in as ${user.username || user.phone || 'User'}`}
                >
                  {(user.username || user.phone || 'U').charAt(0)}
                </div>
              )}
              <span className="text-[11px] text-zinc-300 font-medium hidden sm:inline max-w-[120px] truncate" title={user.username || user.phone}>
                {user.username || user.phone}
              </span>
              <button
                onClick={handleLogout}
                className="text-[11px] text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                title="Sign Out"
              >
                Exit
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthError('')
                setShowAuthModal(true)
              }}
              className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer hover:bg-white/5 rounded"
              title="Sign In with Account"
            >
              <span>👤</span>
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* History Icon */}
          <button
            onClick={handleToggleHistory}
            disabled={historyLoading}
            className={`p-1.5 rounded border ${themeConfig.border} hover:bg-black/10 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition cursor-pointer text-xs`}
            title="Analysis History"
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
              <div className={`flex items-center gap-2 px-2.5 py-0.5 rounded ${themeConfig.bg} border ${themeConfig.border} font-mono text-xs shadow-xs`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{currentFileName}</span>
              </div>

              <button
                onClick={handleOpenSaveModal}
                className="px-2 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition text-[11px] flex items-center gap-1 cursor-pointer"
                title="Save file to workspace"
              >
                <span>💾</span>
                <span>Save</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="px-2 py-0.5 rounded hover:bg-white/5 border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition text-[11px] flex items-center gap-1 cursor-pointer"
                title="Download file to computer"
              >
                <span>📥</span>
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowStdin(!showStdin)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition flex items-center gap-1 border ${
                  showStdin
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <span>STDIN</span>
                {stdin.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>

              <button
                onClick={handleCopyCode}
                className="px-2 py-0.5 rounded border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition text-[11px]"
                title="Copy Code"
              >
                {copied ? <span className="text-emerald-400">✓ Copied</span> : <span>Copy</span>}
              </button>

              <button
                onClick={() => setCode(DEFAULT_CODE[language])}
                className="px-2 py-0.5 rounded border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition text-[11px]"
                title="Reset to boilerplate"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Optional Stdin Drawer */}
          {showStdin && (
            <div className={`p-2.5 border-b ${themeConfig.border} ${themeConfig.bg}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                  Standard Input (stdin stream)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">{stdin.length} bytes</span>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Pass standard input parameters here (e.g. for input() or scanf)..."
                rows={2}
                className={`w-full ${themeConfig.surface} border ${themeConfig.border} rounded p-2 font-mono text-xs focus:outline-none focus:border-blue-500 resize-y`}
              />
            </div>
          )}

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
          <div className={`px-3 py-1 border-t ${themeConfig.border} ${themeConfig.headerBg} flex items-center justify-between text-[11px] font-mono text-zinc-400`}>
            <div className="flex items-center gap-3">
              <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span>•</span>
              <span>UTF-8</span>
              <span>•</span>
              <span>{user ? `Account: ${user.username}` : 'Local Draft'}</span>
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
                className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'console'
                    ? `${themeConfig.bg} font-semibold shadow-xs border ${themeConfig.border}`
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Terminal Output</span>
                {runResult && (
                  <span className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${runResult.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                )}
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                  activeTab === 'diagnostics'
                    ? `${themeConfig.bg} font-semibold shadow-xs border ${themeConfig.border}`
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Complexity Diagnostics</span>
                {analysisResult && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </button>
            </div>

            <button
              onClick={() => {
                setRunResult(null)
                setAnalysisResult(null)
                setError('')
              }}
              className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded hover:bg-white/5 transition"
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
                <div className={`flex items-center justify-between text-zinc-400 mb-2 pb-1.5 border-b ${themeConfig.border}`}>
                  <span className="text-[11px] text-zinc-500 font-mono">Terminal Output</span>

                  {runResult && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        runResult.success ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        Exit {runResult.exit_code || (runResult.success ? 0 : 1)}
                      </span>
                      <span>{runResult.execution_time_ms} ms</span>
                    </div>
                  )}
                </div>

                <div className={`flex-1 ${isLight ? 'bg-slate-50' : 'bg-[#181818]'} rounded p-3 border ${themeConfig.border} overflow-auto min-h-[400px] font-mono text-xs`}>
                  {running ? (
                    <div className="flex items-center justify-center h-full text-zinc-400 gap-2 py-16">
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-200 animate-spin" />
                      <span>Executing in sandbox...</span>
                    </div>
                  ) : runResult ? (
                    <div className="space-y-1">
                      {runResult.stdout && (
                        <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                          {runResult.stdout}
                        </pre>
                      )}
                      {runResult.stderr && (
                        <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed mt-2 p-2 rounded bg-rose-950/20 border border-rose-900/40">
                          {runResult.stderr}
                        </pre>
                      )}
                      {!runResult.stdout && !runResult.stderr && (
                        <p className="text-zinc-500 italic">Program finished with no output.</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-zinc-500 flex flex-col items-center justify-center h-full py-20 gap-1 text-center">
                      <p className="font-mono text-xs">Terminal ready</p>
                      <p className="text-[11px] text-zinc-500">
                        Press Run or ⌘+Enter to execute code.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnostics HUD Tab */}
            {activeTab === 'diagnostics' && (
              <div className="space-y-3">
                {analyzing ? (
                  <div className="flex items-center justify-center min-h-[380px] text-zinc-400 gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-200 animate-spin" />
                    <span>Analyzing code structure...</span>
                  </div>
                ) : analysisResult ? (
                  <>
                    {/* Big-O Spectrum Radar */}
                    <div className={`p-2.5 rounded border ${themeConfig.border} ${isLight ? 'bg-slate-50' : 'bg-[#181818]'}`}>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5 font-mono">
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
                                  ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
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
                      <div className={`p-3 rounded border ${themeConfig.border} ${isLight ? 'bg-slate-50' : 'bg-[#181818]'}`}>
                        <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">
                          Time Complexity
                        </span>
                        <p className="mt-1 text-xl font-bold font-mono text-emerald-400">
                          {analysisResult.estimated_time_complexity}
                        </p>
                      </div>

                      <div className={`p-3 rounded border ${themeConfig.border} ${isLight ? 'bg-slate-50' : 'bg-[#181818]'}`}>
                        <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">
                          Auxiliary Space
                        </span>
                        <p className="mt-1 text-xl font-bold font-mono text-indigo-400">
                          {analysisResult.estimated_space_complexity}
                        </p>
                      </div>
                    </div>

                    {/* Reasoning Breakdown */}
                    {analysisResult.explanation && (
                      <div className={`p-3 rounded border ${themeConfig.border} ${isLight ? 'bg-slate-50' : 'bg-[#181818]'}`}>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-zinc-300">
                          <span>💡</span> Diagnostic Breakdown
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                          {analysisResult.explanation}
                        </p>
                      </div>
                    )}

                    {/* Bottlenecks List */}
                    {analysisResult.bottlenecks && analysisResult.bottlenecks.length > 0 && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                          Detected Loop & Recursion Lines
                        </p>
                        <div className="space-y-1.5">
                          {analysisResult.bottlenecks.map((b, idx) => (
                            <div
                              key={idx}
                              onClick={() => jumpToLine(b.line)}
                              className={`p-2.5 rounded border ${themeConfig.border} hover:border-zinc-500 cursor-pointer transition flex items-start gap-2.5 group ${isLight ? 'bg-slate-50 hover:bg-slate-100' : 'bg-[#181818] hover:bg-[#202020]'}`}
                              title="Click to jump to line in editor"
                            >
                              <span className="px-1.5 py-0.5 rounded font-mono text-xs font-semibold bg-white/10 group-hover:bg-blue-600 group-hover:text-white transition">
                                L{b.line}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-zinc-300">{b.type}</span>
                                  <span className="text-xs font-mono font-bold text-amber-400">{b.complexity}</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 mt-0.5 font-sans leading-normal">
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
                <h3 className="text-sm font-semibold">Workspace Files</h3>
              </div>
              <button
                onClick={() => setShowWorkspace(false)}
                className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
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
                    : 'text-zinc-400 hover:text-zinc-200'
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
                        : 'text-zinc-400 hover:text-zinc-200'
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
                <div className="text-center py-12 text-zinc-500">
                  <p className="text-xl mb-1">📂</p>
                  <p className="text-xs">No files saved in this section yet.</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Click &quot;Save&quot; in the editor to store snippets.
                  </p>
                </div>
              ) : (
                filteredWorkspaceFiles.map((f) => (
                  <div
                    key={f.id}
                    className={`p-2.5 rounded border ${themeConfig.border} ${themeConfig.bg} hover:border-zinc-500 transition flex items-center justify-between group`}
                  >
                    <div
                      onClick={() => handleLoadFile(f)}
                      className="flex-1 cursor-pointer pr-2"
                    >
                      <div className="flex items-center gap-2">
                        <span>{LANGUAGES.find((l) => l.value === f.language)?.badge || '📄'}</span>
                        <span className="text-xs font-medium text-zinc-200 font-mono group-hover:text-blue-400 transition">
                          {f.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {f.language.toUpperCase()} • {f.code.length} chars
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLoadFile(f)}
                        className="px-2 py-0.5 rounded text-[11px] bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition cursor-pointer"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteFile(f.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition text-xs cursor-pointer"
                        title="Delete File"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`pt-2.5 border-t ${themeConfig.border} text-[11px] text-zinc-500 flex items-center justify-between`}>
              <span>{user ? `Cloud synced: @${user.username}` : 'Local browser storage'}</span>
              {!user && (
                <button
                  onClick={() => {
                    setShowWorkspace(false)
                    setShowAuthModal(true)
                  }}
                  className="text-blue-400 hover:underline cursor-pointer"
                >
                  Sign In to sync
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save File Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`w-full max-w-sm ${themeConfig.surface} border ${themeConfig.border} rounded-lg p-4 shadow-2xl`}>
            <h3 className="text-xs font-semibold mb-1 flex items-center gap-1.5 text-zinc-200">
              <span>💾</span> Save to {language.toUpperCase()} Section
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              Enter file name:
            </p>

            <input
              type="text"
              value={saveFileName}
              onChange={(e) => setSaveFileName(e.target.value)}
              placeholder="e.g. solution.py"
              className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500 mb-3`}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 transition"
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

      {/* Auth Modal (Google, Mobile Number OTP, and Email / Password) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className={`w-full max-w-sm ${themeConfig.surface} border ${themeConfig.border} rounded-lg p-5 shadow-2xl`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <span>Sign In to CodeLens</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Save your code files and access your workspace anytime
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false)
                  setPhoneStep('phone')
                  setAuthError('')
                  setPhoneInfo('')
                  setShowGoogleInput(false)
                }}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/5 transition"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="mb-3 p-2 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            {phoneInfo && (
              <div className="mb-3 p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-1.5">
                <span>✓</span>
                <span>{phoneInfo}</span>
              </div>
            )}

            {/* Google Authentication Option */}
            {!showGoogleConfig ? (
              <button
                onClick={handleGoogleOAuthRedirect}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2 px-3 rounded border border-zinc-700 hover:border-zinc-500 bg-[#1e1e1e] hover:bg-[#252525] text-zinc-200 text-xs font-medium transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSaveGoogleClientId(googleClientId)
                }}
                className="p-3 rounded border border-blue-600/40 bg-blue-950/20 space-y-2 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-blue-300">
                    Google OAuth Client ID
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGoogleConfig(false)}
                    className="text-[10px] text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Enter your Google Cloud OAuth Client ID to redirect to your device&apos;s Gmail accounts:
                </p>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12345678-xxx.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={(e) => setGoogleClientId(e.target.value)}
                  className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500`}
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer"
                >
                  Save & Redirect to Google
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center my-3.5">
              <div className={`flex-1 border-t ${themeConfig.border}`} />
              <span className="px-2 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                or sign in with
              </span>
              <div className={`flex-1 border-t ${themeConfig.border}`} />
            </div>

            {/* Tab Switcher: Mobile OTP vs Password */}
            <div className={`grid grid-cols-2 p-0.5 rounded ${themeConfig.bg} border ${themeConfig.border} mb-3.5`}>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('phone')
                  setAuthError('')
                }}
                className={`py-1 text-xs font-medium rounded transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authTab === 'phone'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>📱</span>
                <span>Mobile OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('password')
                  setAuthError('')
                }}
                className={`py-1 text-xs font-medium rounded transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authTab === 'password'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>🔑</span>
                <span>Password</span>
              </button>
            </div>

            {/* Option A: Mobile Phone OTP */}
            {authTab === 'phone' && (
              <div>
                {phoneStep === 'phone' ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-2.5">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono`}
                      />
                      <span className="text-[10px] text-zinc-500 block mt-1">
                        Include country code (e.g. +91 for India, +1 for US)
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full mt-2 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? 'Sending OTP...' : 'Send Verification Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                          Enter 6-Digit OTP
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneStep('phone')
                            setPhoneOtp('')
                            setPhonePassword('')
                            setPhoneInfo('')
                          }}
                          className="text-[10px] text-blue-400 hover:underline"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        placeholder="••••••"
                        className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-2.5 py-1.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-blue-500`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Set Password (to secure account)
                      </label>
                      <input
                        type="password"
                        value={phonePassword}
                        onChange={(e) => setPhonePassword(e.target.value)}
                        placeholder="Choose a password (min 6 chars)"
                        className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500`}
                      />
                      <span className="text-[10px] text-zinc-500 block mt-1">
                        Secures your account so you can log in with phone & password anytime.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full mt-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? 'Verifying...' : 'Verify OTP & Secure Account'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Option B: Standard Username & Password */}
            {authTab === 'password' && (
              <div>
                <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                      Username, Email, or Mobile Phone
                    </label>
                    <input
                      type="text"
                      required
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="e.g. +919876543210 or username"
                      className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500`}
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="user@example.com"
                        className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500`}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full ${themeConfig.bg} border ${themeConfig.border} rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create Account' : 'Sign In'}
                  </button>
                </form>

                <div className={`mt-3 pt-2.5 border-t ${themeConfig.border} text-center text-xs text-zinc-400`}>
                  {authMode === 'register' ? (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login')
                          setAuthError('')
                        }}
                        className="text-blue-400 font-medium hover:underline cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  ) : (
                    <p>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register')
                          setAuthError('')
                        }}
                        className="text-blue-400 font-medium hover:underline cursor-pointer"
                      >
                        Sign Up
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}
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
                <h3 className="text-sm font-semibold">Analysis History</h3>
              </div>

              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                    title="Delete all history"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-zinc-500 text-xs italic text-center py-12 font-mono">
                  No previous records found.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded border ${themeConfig.border} ${themeConfig.bg} hover:border-zinc-500 transition group`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-zinc-500">Record #{item.id}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                          <span className="text-emerald-400">{item.time_complexity}</span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-indigo-400">{item.space_complexity}</span>
                        </div>
                        {/* Delete Single History Record Button */}
                        <button
                          onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                          className="text-zinc-500 hover:text-rose-400 p-0.5 transition cursor-pointer text-xs"
                          title="Delete this record"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <pre className={`text-[11px] text-zinc-400 font-mono line-clamp-3 p-2 rounded border ${themeConfig.border} overflow-hidden ${isLight ? 'bg-white' : 'bg-[#181818]'}`}>
                      {item.code}
                    </pre>
                    <button
                      onClick={() => {
                        setCode(item.code)
                        setShowHistory(false)
                      }}
                      className="mt-1.5 text-xs font-medium text-blue-400 hover:underline transition flex items-center gap-1 cursor-pointer"
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
