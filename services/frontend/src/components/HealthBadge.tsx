import { useEffect, useState } from 'react'
import { api, type HealthResponse } from '../api/client'

type State = 'loading' | 'ok' | 'error'

export function HealthBadge() {
  const [state, setState] = useState<State>('loading')
  const [info, setInfo] = useState<HealthResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const data = await api.health()
        if (!cancelled) {
          setInfo(data)
          setState('ok')
        }
      } catch {
        if (!cancelled) setState('error')
      }
    }

    check()
    const id = setInterval(check, 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const colours: Record<State, string> = {
    loading: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    ok: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    error: 'bg-red-500/20 text-red-300 border-red-500/30',
  }

  const dot: Record<State, string> = {
    loading: 'bg-yellow-400 animate-pulse',
    ok: 'bg-emerald-400',
    error: 'bg-red-400',
  }

  const label: Record<State, string> = {
    loading: 'connecting',
    ok: 'healthy',
    error: 'unreachable',
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${colours[state]}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot[state]}`} />
      API {label[state]}
      {info && state === 'ok' && (
        <span className="opacity-60">v{info.version}</span>
      )}
    </span>
  )
}
