// Admin dashboard page

'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [programId, setProgramId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!programId || !startDate || !endDate) {
      alert('Please fill in all fields')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          startDate,
          endDate,
          async: false,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate schedule')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Schedule Generation</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Schedule</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Program ID</label>
            <input
              type="text"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter program ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Platform Features</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Multi-tenant scheduling with organizations, programs, sites, and services</li>
          <li>Flexible constraint system with plugin architecture</li>
          <li>Fairness scoring and reporting</li>
          <li>Swap workflow with approval chains</li>
          <li>Background job processing for schedule generation</li>
          <li>Export to PDF, CSV, and iCal</li>
          <li>Comprehensive audit logging</li>
        </ul>
      </div>
    </div>
  )
}
