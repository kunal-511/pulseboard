import { type Item, type Status } from '../api/client'

interface Props {
  items: Item[]
  onStatusChange: (id: string, status: Status) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-gray-700 text-gray-300',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-500/20 text-blue-300',
  },
  done: {
    label: 'Done',
    className: 'bg-emerald-500/20 text-emerald-300',
  },
}

const nextStatus: Record<Status, Status> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function TaskList({ items, onStatusChange, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 py-16 text-gray-500">
        <span className="text-4xl mb-3">📋</span>
        <p className="text-sm">No tasks yet. Add one above.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const cfg = statusConfig[item.status]
        return (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-gray-800
                       bg-gray-900 px-5 py-4 hover:border-gray-700 transition-colors"
          >
            {/* Status badge — click to cycle */}
            <button
              onClick={() => onStatusChange(item.id, nextStatus[item.status])}
              title="Cycle status"
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium
                          cursor-pointer hover:opacity-80 transition-opacity ${cfg.className}`}
            >
              {cfg.label}
            </button>

            {/* Title */}
            <span
              className={`flex-1 text-sm ${item.status === 'done' ? 'line-through text-gray-500' : 'text-gray-100'}`}
            >
              {item.title}
            </span>

            {/* Date */}
            <span className="hidden sm:block shrink-0 text-xs text-gray-600">
              {formatDate(item.created_at)}
            </span>

            {/* Delete */}
            <button
              onClick={() => onDelete(item.id)}
              title="Delete task"
              className="shrink-0 rounded-lg p-1.5 text-gray-600 hover:bg-red-500/10
                         hover:text-red-400 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
