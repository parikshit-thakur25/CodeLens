import { useState } from 'react'
import Editor from '@monaco-editor/react'
import './App.css'

function App() {
  const [code, setCode] = useState('def example(nums):\n    # paste your Python function here\n    pass')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    setError('')
    setResult(null)
    setLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
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

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>CodeLens</h1>
      <p>Paste a Python function below to estimate its time and space complexity.</p>

      <div style={{ border: '1px solid #444', borderRadius: '8px', overflow: 'hidden' }}>
        <Editor
          height="300px"
          defaultLanguage="python"
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

      <br />
      <button onClick={handleAnalyze} disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && (
        <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: '20px', padding: '16px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <p><strong>Time Complexity:</strong> {result.estimated_time_complexity}</p>
          <p><strong>Space Complexity:</strong> {result.estimated_space_complexity}</p>
          <p><strong>Code Length:</strong> {result.length} characters</p>
        </div>
      )}
    </div>
  )
}

export default App