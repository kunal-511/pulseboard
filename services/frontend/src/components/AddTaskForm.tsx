import { type FormEvent, useState } from 'react'
import { type Status } from '../api/client'

interface Props {
  onAdd: (title: string, status: Status) => Promise<void>
}

export function AddTaskForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<Status>('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')
    try {
      await onAdd(trimmed, status)
      setTitle('')
      setStatus('pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title…"
        maxLength={200}
        disabled={loading}
        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm
                   placeholder-gray-500 outline-none focus:border-indigo-500 focus:ring-1
                   focus:ring-indigo-500 disabled:opacity-50"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as Status)}
        disabled={loading}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm
                   outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                   disabled:opacity-50"
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium
                   hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40
                   transition-colors"
      >
        {loading ? 'Adding…' : 'Add Task'}
      </button>
      {error && <p className="text-xs text-red-400 self-center">{error}</p>}
    </form>
  )
}
