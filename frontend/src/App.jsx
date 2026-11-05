import { useState } from 'react'
import Editor from '@monaco-editor/react'

const LANGUAGES = [
  { value: 'python', label: 'Python', monaco: 'python' },
  { value: 'java', label: 'Java', monaco: 'java' },
  { value: 'cpp', label: 'C++', monaco: 'cpp' },
]

const DEFAULT_CODE = {
  python: 'def example(nums):\n    # paste your Python function here\n    pass',
  java: 'public int example(int[] nums) {\n    // paste your Java function here\n    return 0;\n}',
  cpp: 'int example(vector<int> nums) {\n    // paste your C++ function here\n    return 0;\n}',
}

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(DEFAULT_CODE.python)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  const handleLanguageChange = (e) => {
    const newLang = e.target.value
    setLanguage(newLang)
    setCode(DEFAULT_CODE[newLang])
    setResult(null)
    setError('')
  }

  const handleAnalyze = async () => {
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Something went wrong')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Could not reach the backend. Is it running?')
    } finally {
      setLoading(false)
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
      setError('Could not load history. Is the backend running?')
    } finally {
      setHistoryLoading(false)
    }
  }

  const currentMonacoLang = LANGUAGES.find((l) => l.value === language)?.monaco

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold tracking-tight">
          Code<span className="text-emerald-400">Lens</span>
        </h1>
        <p className="mt-2 text-slate-400">
          Paste a function below to estimate its time and space complexity.
        </p>

        <div className="mt-6">
          <label className="text-sm text-slate-400 mr-3">Language:</label>
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 rounded-xl overflow-hidden border border-slate-800 shadow-lg">
          <Editor
            height="300px"
            language={currentMonacoLang}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold transition"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            onClick={handleToggleHistory}
            disabled={historyLoading}
            className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-semibold transition"
          >
            {historyLoading ? 'Loading...' : showHistory ? 'Hide History' : 'View History'}
          </button>
        </div>

        {error && (
          <p className="mt-6 text-red-400">{error}</p>
        )}

        {result && (
          <div className="mt-6 p-5 rounded-xl border border-slate-800 bg-slate-900">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Time</p>
                <p className="mt-1 text-xl font-bold text-emerald-400">{result.estimated_time_complexity}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Space</p>
                <p className="mt-1 text-xl font-bold text-emerald-400">{result.estimated_space_complexity}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Length</p>
                <p className="mt-1 text-xl font-bold text-slate-200">{result.length} chars</p>
              </div>
            </div>
          </div>
        )}

        {showHistory && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Past Analyses</h2>
            {history.length === 0 && <p className="text-slate-500">No history yet.</p>}
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-800 bg-slate-900">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300">{item.code}</pre>
                  <p className="mt-3 text-sm text-slate-400">
                    <span className="text-emerald-400 font-semibold">Time:</span> {item.time_complexity}
                    <span className="mx-2">|</span>
                    <span className="text-emerald-400 font-semibold">Space:</span> {item.space_complexity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App