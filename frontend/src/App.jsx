import { useState } from 'react'
import './App.css'

function App() {
  const [code, setCode] = useState('')
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

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="def example(nums):&#10;    ..."
        rows={10}
        style={{ width: '100%', fontFamily: 'monospace', fontSize: '14px' }}
      />

      <br />
      <button onClick={handleAnalyze} disabled={loading} style={{ marginTop: '10px', padding: '8px 16px' }}>
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