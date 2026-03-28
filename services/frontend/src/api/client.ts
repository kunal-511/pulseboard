const BASE = import.meta.env.VITE_API_URL ?? ''

export type Status = 'pending' | 'in_progress' | 'done'

export interface Item {
  id: string
  title: string
  status: Status
  created_at: string
  updated_at: string
}

export interface HealthResponse {
  status: string
  timestamp: string
  service: string
  version: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(body.error ?? res.statusText)
  }
  // 204 No Content has no body
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  health: (): Promise<HealthResponse> =>
    request('/health'),

  listItems: (): Promise<Item[]> =>
    request('/api/v1/items'),

  createItem: (title: string, status: Status = 'pending'): Promise<Item> =>
    request('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify({ title, status }),
    }),

  updateStatus: (id: string, status: Status): Promise<Item> =>
    request(`/api/v1/items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteItem: (id: string): Promise<void> =>
    request(`/api/v1/items/${id}`, { method: 'DELETE' }),
}
