import React, { useState, useEffect } from 'react'

export default function LandingPage({ onLaunchStudio }) {
  // Interactive Tour / Video Simulation State
  const [activeTourStep, setActiveTourStep] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(true)
  const [simulatedProgress, setSimulatedProgress] = useState(42)

  // Auto-progress simulated tour video if playing
  useEffect(() => {
    if (!isVideoPlaying) return
    const interval = setInterval(() => {
      setSimulatedProgress((p) => (p >= 100 ? 0 : p + 2))
    }, 450)
    return () => clearInterval(interval)
  }, [isVideoPlaying])

  useEffect(() => {
    if (simulatedProgress < 33) setActiveTourStep(0)
    else if (simulatedProgress < 66) setActiveTourStep(1)
    else setActiveTourStep(2)
  }, [simulatedProgress])

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
      title: '3. Local Workspace & Persistent Files',
      desc: 'Save your projects in local browser storage, export snippets, and organize multi-language code.',
      badge: 'Local Workspace',
      codeSample: `# Workspace: algorithms / graph_bfs.py
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
      output: `File saved to local workspace: graph_bfs.py
Browser storage persistent cache active.
Zero login required.`,
      complexity: 'O(V + E) • O(V) Space',
    },
  ]

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      {/* Top Navigation Bar */}
      <nav className="w-full border-b border-zinc-800/80 bg-[#0c0d14]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
            title="CodeLens Studio Home"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-md group-hover:scale-105 transition-transform">
              CL
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors">
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
              href="#compilers"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition hidden sm:inline-block"
            >
              Compilers
            </a>

            <button
              onClick={onLaunchStudio}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-blue-600/20"
            >
              <span>Launch Studio</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 md:py-14 space-y-16">
        {/* Hero Section with Live IDE Preview Card */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline & Value Prop (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-300 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Free • Zero Login Required • Python, C, C++, Java</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Write clean code. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
                Understand complexity instantly.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed">
              CodeLens Studio is a high-performance online IDE for Python, C, C++, and Java with sub-second cloud execution and real-time algorithmic complexity diagnostics.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 max-w-lg">
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-[#10121a] flex items-center gap-2 text-xs">
                <span className="text-emerald-400">⚡</span>
                <span className="text-zinc-300 font-medium">Sub-second Runs</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-[#10121a] flex items-center gap-2 text-xs">
                <span className="text-blue-400">📊</span>
                <span className="text-zinc-300 font-medium">Big-O Diagnostics</span>
              </div>
              <div className="p-2.5 rounded-lg border border-zinc-800 bg-[#10121a] flex items-center gap-2 text-xs">
                <span className="text-purple-400">📁</span>
                <span className="text-zinc-300 font-medium">Instant File Saving</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={onLaunchStudio}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:scale-[1.02]"
              >
                <span>Open CodeLens Compiler</span>
                <span>→</span>
              </button>
              <a
                href="#guide"
                className="px-4 py-3 rounded-lg border border-zinc-800 hover:border-zinc-600 bg-zinc-900/60 text-zinc-300 hover:text-white font-medium text-sm transition flex items-center gap-1.5"
              >
                <span>Interactive Tour</span>
                <span>📹</span>
              </a>
            </div>
          </div>

          {/* Right Column: Sleek Interactive Code Card (5 cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-zinc-800 bg-[#0f1118] overflow-hidden shadow-2xl relative">
              {/* Window Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800 bg-[#0a0b12] text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-zinc-400 font-mono text-[11px] pl-1.5">
                    binary_search.py
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 font-semibold">
                    O(log n)
                  </span>
                </div>
              </div>

              {/* Code Preview */}
              <div className="p-4 font-mono text-xs text-blue-200 leading-relaxed bg-[#0b0c14] overflow-x-auto">
                <pre>{`def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1`}</pre>
              </div>

              {/* Terminal Execution Snippet */}
              <div className="px-4 py-3 border-t border-zinc-800 bg-[#08090f] text-xs font-mono">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Cloud Output</span>
                  <span className="text-emerald-400">● Exit 0 (0.02s)</span>
                </div>
                <div className="text-zinc-300 text-[11px]">
                  Target located at index 42 • Memory: 12.4 MB
                </div>
              </div>

              {/* Direct Open Button */}
              <div className="p-3 bg-[#0c0e17] border-t border-zinc-800/80 text-center">
                <button
                  onClick={onLaunchStudio}
                  className="w-full py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Launch this code in Studio</span>
                  <span>→</span>
                </button>
              </div>
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
        <section id="compilers" className="pt-4 border-t border-zinc-800/80 space-y-4">
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
          CodeLens Studio • Built by <a href="https://www.parikshit07.tech" target="_blank" rel="noreferrer" className="text-zinc-300 hover:text-white font-medium underline">Parikshit Thakur</a>
        </p>
        <p className="text-[11px] text-zinc-600 font-mono">
          Online Multi-Language Compiler & Algorithmic Complexity Diagnostics
        </p>
      </footer>
    </div>
  )
}
