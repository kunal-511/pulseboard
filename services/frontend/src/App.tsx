import { useCallback, useEffect, useState } from 'react'
import { api, type Item, type Status } from './api/client'
import { AddTaskForm } from './components/AddTaskForm'
import { HealthBadge } from './components/HealthBadge'
import { TaskList } from './components/TaskList'

type Filter = 'all' | Status

export default function App() {
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadItems = useCallback(async () => {
    try {
      const data = await api.listItems()
      setItems(data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleAdd = async (title: string, status: Status) => {
    const item = await api.createItem(title, status)
    setItems((prev) => [item, ...prev])
  }

  const handleStatusChange = async (id: string, status: Status) => {
    const updated = await api.updateStatus(id, status)
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)))
  }

  const handleDelete = async (id: string) => {
    await api.deleteItem(id)
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  const counts = {
    all: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    done: items.filter((i) => i.status === 'done').length,
  }

  const visible = filter === 'all' ? items : items.filter((i) => i.status === filter)

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
    { key: 'done', label: 'Done', count: counts.done },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <span className="text-sm font-bold">P</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">PulseBoard</h1>
              <p className="text-xs text-gray-500">Task tracker</p>
            </div>
          </div>
          <HealthBadge />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Stats row */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {(['pending', 'in_progress', 'done'] as const).map((s) => (
            <div
              key={s}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center"
            >
              <p className="text-2xl font-bold text-white">{counts[s]}</p>
              <p className="mt-1 text-xs capitalize text-gray-500">
                {s.replace('_', ' ')}
              </p>
            </div>
          ))}
        </div>

        {/* Add form */}
        <div className="mb-6">
          <AddTaskForm onAdd={handleAdd} />
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
          {filterTabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === key
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}{' '}
              <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading…</div>
        ) : error ? (
          <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        ) : (
          <TaskList
            items={visible}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  )
}
