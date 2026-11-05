import React, { useState, useEffect, useRef } from 'react'

export default function LandingPage({
  user,
  token,
  onLaunchStudio,
  onLoginSuccess,
  onLogout,
  API_URL,
}) {
  // Auth Tab State ('google' | 'phone' | 'password')
  const [authTab, setAuthTab] = useState('phone')
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Phone Auth State
  const [phone, setPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phonePassword, setPhonePassword] = useState('')
  const [phoneStep, setPhoneStep] = useState('phone') // 'phone' | 'otp'
  const [phoneInfo, setPhoneInfo] = useState('')

  // Google OAuth Client ID config state
  const [googleClientId, setGoogleClientId] = useState(
    localStorage.getItem('codelens_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  )
  const [showGoogleConfig, setShowGoogleConfig] = useState(false)

  // Interactive Tour / Video Simulation State
  const [activeTourStep, setActiveTourStep] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [simulatedProgress, setSimulatedProgress] = useState(42)

  // Auto-progress simulated tour video if playing
  useEffect(() => {
    if (!isVideoPlaying) return
    const interval = setInterval(() => {
      setSimulatedProgress((p) => (p >= 100 ? 0 : p + 2))
    }, 400)
    return () => clearInterval(interval)
  }, [isVideoPlaying])

  useEffect(() => {
    if (simulatedProgress < 33) setActiveTourStep(0)
    else if (simulatedProgress < 66) setActiveTourStep(1)
    else setActiveTourStep(2)
  }, [simulatedProgress])

  // --- Auth Handlers ---
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
      setAuthError('Please enter a valid mobile number with country code')
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
        setPhoneInfo(data.message || `Verification code dispatched to ${phone}`)
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
      setAuthError('Please enter the 6-digit verification code')
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
        onLoginSuccess(data)
        setAuthSuccess('Account verified and logged in successfully!')
        setPhoneStep('phone')
        setPhoneOtp('')
        setPhonePassword('')
      }
    } catch (_) {
      setAuthError('Verification failed. Please retry.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login'
    const body =
      authMode === 'register'
        ? { username, email, password }
        : { username, password }

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
        onLoginSuccess(data)
        setAuthSuccess('Welcome to CodeLens Studio!')
        setPassword('')
      }
    } catch (_) {
      setAuthError('Could not reach auth service.')
    } finally {
      setAuthLoading(false)
    }
  }

  const TOUR_STEPS = [
    {
      title: '1. Multi-Language Compiler Sandbox',
      desc: 'Switch between Python 3.12, C (GCC 13), C++ 20, and Java 21 with standard I/O streams.',
      badge: 'Execution Engine',
      codeSample: `// C++ Binary Search (GCC 13.2.0)
int binarySearch(int arr[], int l, int r, int x) {
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x) return m;
        if (arr[m] < x) l = m + 1;
        else r = m - 1;
    }
    return -1;
}`,
      output: `[GCC 13.2.0]: Compilation successful (0.04s)
Target 42 found at index 7
Program exited with return code 0`,
      complexity: 'O(log n) • O(1) Space',
    },
    {
      title: '2. Real-Time AST & Tree-Sitter Diagnostics',
      desc: 'Automatic static analysis extracts loops, geometric step halving/doubling, and recursion depth.',
      badge: 'Algorithmic Diagnostics',
      codeSample: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)`,
      output: `AST Inspection: Divide-and-conquer recursion detected.
Recursive depth: O(log n) average, O(n) worst.
Time Complexity: O(n log n)
Space Complexity: O(n)`,
      complexity: 'O(n log n) • O(n) Space',
    },
    {
      title: '3. Cloud Workspace & Persistent Files',
      desc: 'Save your projects across sessions, export snippets, and organize your language workspaces.',
      badge: 'Cloud Sync',
      codeSample: `# Workspace: parikshit / algorithms / graph_bfs.py
from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    while queue:
        vertex = queue.popleft()
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,
      output: `File saved to cloud workspace: graph_bfs.py
Synced with PostgreSQL user datastore.
Session memory restored.`,
      complexity: 'O(V + E) • O(V) Space',
    },
  ]

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation Bar */}
      <nav className="w-full border-b border-zinc-800/80 bg-[#0c0d14]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
              CL
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">
                CodeLens <span className="text-blue-400 font-mono text-xs font-semibold">STUDIO</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#guide"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition hidden sm:inline-block"
            >
              Interactive Guide
            </a>
            <a
              href="#auth-section"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition hidden sm:inline-block"
            >
              Sign In
            </a>

            <button
              onClick={onLaunchStudio}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-blue-600/20"
            >
              <span>Launch Studio</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-16">
        {/* Hero & Authentication Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Headline & Value Prop (7 cols) */}
          <div className="lg:col-span-7 space-y-6 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>GCC 13 • Java 21 • Python 3.12 • AST Big-O Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Write clean code. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Understand complexity instantly.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
              CodeLens Studio is a high-performance web compiler for Python, C, C++, and Java paired with real-time Tree-Sitter algorithmic diagnostics. Catch $O(n^2)$ bottlenecks before deployment.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 max-w-lg">
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-[#10121a] flex items-center gap-2 text-xs">
                <span className="text-emerald-400">⚡</span>
                <span className="text-zinc-300 font-medium">Sub-second Runs</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-[#10121a] flex items-center gap-2 text-xs">
                <span className="text-blue-400">📊</span>
                <span className="text-zinc-300 font-medium">Big-O Diagnostics</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-[#10121a] flex items-center gap-2 text-xs">
                <span className="text-purple-400">💾</span>
                <span className="text-zinc-300 font-medium">Cloud Workspace</span>
              </div>
            </div>

            {/* Launch Studio Direct Action */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                onClick={onLaunchStudio}
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/25"
              >
                <span>Enter CodeLens Compiler</span>
                <span>→</span>
              </button>
              <a
                href="#guide"
                className="px-4 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-zinc-900/60 text-zinc-300 hover:text-white font-medium text-sm transition flex items-center gap-1.5"
              >
                <span>Watch Short Guide</span>
                <span>📹</span>
              </a>
            </div>
          </div>

          {/* Right Column: Sign In Card (5 cols) */}
          <div id="auth-section" className="lg:col-span-5">
            <div className="rounded-xl border border-zinc-800 bg-[#0f1118] p-6 shadow-2xl relative overflow-hidden">
              {/* Subtle accent glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Logged in state */}
              {user ? (
                <div className="space-y-4 text-center py-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xl flex items-center justify-center uppercase shadow-lg shadow-blue-600/30">
                    {user.avatar ? (
                      <img src={user.avatar} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      (user.username || user.phone || 'U').charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Welcome, {user.username || user.phone}!
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {user.email || 'Cloud workspace synchronized & ready'}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={onLaunchStudio}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer shadow-md"
                    >
                      Open Your Compiler Workspace →
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full py-1.5 text-xs text-zinc-500 hover:text-rose-400 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                /* Auth Form on Landing Page */
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Sign In to CodeLens
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Save files, restore history, and access multi-language workspace.
                    </p>
                  </div>

                  {authError && (
                    <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
                      {authSuccess}
                    </div>
                  )}

                  {phoneInfo && (
                    <div className="p-2.5 rounded bg-blue-950/40 border border-blue-800/40 text-blue-300 text-xs">
                      {phoneInfo}
                    </div>
                  )}

                  {/* Google Sign In Button */}
                  {!showGoogleConfig ? (
                    <button
                      onClick={handleGoogleOAuthRedirect}
                      disabled={authLoading}
                      className="w-full flex items-center justify-center gap-2.5 py-2 px-3 rounded-lg border border-zinc-700 hover:border-zinc-500 bg-[#181a24] hover:bg-[#1e202d] text-zinc-200 text-xs font-medium transition cursor-pointer shadow-sm disabled:opacity-50"
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
                      className="p-3 rounded-lg border border-blue-600/40 bg-blue-950/20 space-y-2 text-left"
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
                      <input
                        type="text"
                        required
                        placeholder="e.g. 12345678-xxx.apps.googleusercontent.com"
                        value={googleClientId}
                        onChange={(e) => setGoogleClientId(e.target.value)}
                        className="w-full bg-[#12141c] border border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer"
                      >
                        Save & Redirect to Google
                      </button>
                    </form>
                  )}

                  {/* Divider */}
                  <div className="flex items-center my-2">
                    <div className="flex-1 border-t border-zinc-800" />
                    <span className="px-2 text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                      or continue with
                    </span>
                    <div className="flex-1 border-t border-zinc-800" />
                  </div>

                  {/* Tabs: Mobile OTP vs Password */}
                  <div className="grid grid-cols-2 p-0.5 rounded-lg bg-[#141620] border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('phone')
                        setAuthError('')
                      }}
                      className={`py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
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
                      className={`py-1 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        authTab === 'password'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>🔑</span>
                      <span>Password</span>
                    </button>
                  </div>

                  {/* Option 1: Mobile Phone OTP */}
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
                              className="w-full bg-[#12141c] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-mono"
                            />
                            <span className="text-[10px] text-zinc-500 block mt-1">
                              Include country code (e.g. +91 for India)
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full mt-2 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {authLoading ? 'Sending OTP...' : 'Send Verification Code'}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleVerifyPhoneOtp} className="space-y-2.5">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                                6-Digit OTP
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setPhoneStep('phone')
                                  setPhoneOtp('')
                                  setPhonePassword('')
                                }}
                                className="text-[10px] text-blue-400 hover:underline"
                              >
                                Change
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
                              className="w-full bg-[#12141c] border border-zinc-700 rounded-md px-2.5 py-1.5 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-blue-500"
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
                              placeholder="Choose account password (min 6 chars)"
                              className="w-full bg-[#12141c] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full mt-2 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                          >
                            {authLoading ? 'Verifying...' : 'Verify OTP & Enter'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Option 2: Username & Password */}
                  {authTab === 'password' && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                          Username, Email, or Phone
                        </label>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. +919876543210 or username"
                          className="w-full bg-[#12141c] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
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
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full bg-[#12141c] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
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
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#12141c] border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full mt-2 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {authLoading ? 'Please wait...' : authMode === 'register' ? 'Create Account' : 'Sign In'}
                      </button>

                      <div className="pt-2 text-center text-xs text-zinc-500">
                        {authMode === 'register' ? (
                          <p>
                            Have an account?{' '}
                            <button
                              type="button"
                              onClick={() => setAuthMode('login')}
                              className="text-blue-400 hover:underline"
                            >
                              Sign In
                            </button>
                          </p>
                        ) : (
                          <p>
                            New user?{' '}
                            <button
                              type="button"
                              onClick={() => setAuthMode('register')}
                              className="text-blue-400 hover:underline"
                            >
                              Create Account
                            </button>
                          </p>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Guest Access Link */}
                  <div className="pt-2 text-center">
                    <button
                      onClick={onLaunchStudio}
                      className="text-xs text-zinc-400 hover:text-white transition underline cursor-pointer"
                    >
                      Or skip sign in and try compiler as Guest →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Interactive Guide Tour & Simulated Video Walkthrough */}
        <section id="guide" className="pt-8 border-t border-zinc-800/80 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 uppercase tracking-widest font-semibold mb-1">
                <span>✦ Product Walkthrough</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                How CodeLens Studio Works
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
                Take the 1-minute visual tour to see multi-language sandbox execution, Tree-Sitter AST inspection, and complexity diagnostics in action.
              </p>
            </div>

            {/* Video Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-xs text-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isVideoPlaying ? '⏸ Pause Tour' : '▶ Play Tour'}</span>
              </button>
              <div className="text-[11px] font-mono text-zinc-500">
                {simulatedProgress}%
              </div>
            </div>
          </div>

          {/* Tour Progress Bar */}
          <div className="w-full bg-zinc-800/60 rounded-full h-1 overflow-hidden">
            <div
              className="bg-blue-500 h-1 transition-all duration-300"
              style={{ width: `${simulatedProgress}%` }}
            />
          </div>

          {/* Interactive Player Simulation Frame */}
          <div className="rounded-xl border border-zinc-800 bg-[#0c0d14] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12">
            {/* Step Selection Navigation (4 cols) */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-zinc-800 p-4 space-y-2 bg-[#090a0f]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block px-2 pb-1">
                Tour Milestones
              </span>

              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTourStep(idx)
                    setSimulatedProgress(idx === 0 ? 15 : idx === 1 ? 50 : 85)
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition cursor-pointer flex flex-col gap-1 ${
                    activeTourStep === idx
                      ? 'bg-blue-600/10 border-blue-500/40 text-white'
                      : 'border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{step.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {step.desc}
                  </p>
                </button>
              ))}

              <div className="pt-4 px-2">
                <button
                  onClick={onLaunchStudio}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition cursor-pointer shadow"
                >
                  Launch Compiler Now →
                </button>
              </div>
            </div>

            {/* Simulated Live Studio View (8 cols) */}
            <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-[#0d0e17]">
              {/* Simulated Window Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-zinc-400 font-mono text-[11px] pl-2">
                    CodeLens Studio Sandbox • Step {activeTourStep + 1} of 3
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-800/40">
                    {TOUR_STEPS[activeTourStep].complexity}
                  </span>
                </div>
              </div>

              {/* Code Sandbox Preview */}
              <div className="rounded-lg border border-zinc-800 bg-[#08090f] p-3 font-mono text-xs overflow-x-auto text-blue-200">
                <pre className="leading-relaxed">
                  {TOUR_STEPS[activeTourStep].codeSample}
                </pre>
              </div>

              {/* Terminal Simulation */}
              <div className="rounded-lg border border-zinc-800 bg-[#05060a] p-3 font-mono text-xs text-zinc-300 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Terminal & Diagnostics Output</span>
                  <span className="text-emerald-400">● Sandbox Ready</span>
                </div>
                <pre className="text-zinc-400 text-[11px] leading-relaxed whitespace-pre-wrap">
                  {TOUR_STEPS[activeTourStep].output}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Languages Grid */}
        <section className="pt-4 border-t border-zinc-800/80 space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">Supported Compilers & Runtimes</h3>
            <p className="text-xs text-zinc-400">
              Zero client installation required. All code executes inside sandboxed cloud isolated containers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0f1118] text-center space-y-1">
              <span className="text-2xl">🐍</span>
              <h4 className="text-xs font-bold text-white">Python 3.12</h4>
              <p className="text-[10px] text-zinc-500 font-mono">AST Tree Inspector</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0f1118] text-center space-y-1">
              <span className="text-2xl">⚙️</span>
              <h4 className="text-xs font-bold text-white">C (GCC 13.2)</h4>
              <p className="text-[10px] text-zinc-500 font-mono">Tree-Sitter C Grammar</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0f1118] text-center space-y-1">
              <span className="text-2xl">⚡</span>
              <h4 className="text-xs font-bold text-white">C++ 20 (GCC 13.2)</h4>
              <p className="text-[10px] text-zinc-500 font-mono">STL & Recursion Trees</p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-800 bg-[#0f1118] text-center space-y-1">
              <span className="text-2xl">☕</span>
              <h4 className="text-xs font-bold text-white">Java 21</h4>
              <p className="text-[10px] text-zinc-500 font-mono">OpenJDK 21 Sandbox</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#08090f] py-6 text-center text-xs text-zinc-500 space-y-2">
        <p>
          CodeLens Studio • Built by <a href="https://parikshit07.tech" target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white font-medium underline">Parikshit Thakur</a>
        </p>
        <p className="text-[11px] text-zinc-600 font-mono">
          Online Multi-Language Compiler & Algorithmic Complexity Diagnostics
        </p>
      </footer>
    </div>
  )
}

