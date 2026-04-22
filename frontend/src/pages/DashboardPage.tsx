import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../lib/api'

type MonitoredApi = {
  id: number
  name: string
  url: string
  method?: string
  status: string
  createdAt?: string
  updatedAt?: string
}

type ApiCheck = {
  id: number
  apiId: number
  status: string
  responseTime: number | null
  createdAt: string
}

function StatusPill({ status }: { status: string }) {
  const normalized = status?.toLowerCase?.() ?? 'unknown'
  const theme =
    normalized === 'up'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : normalized === 'down'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${theme}`}>
      {normalized.toUpperCase()}
    </span>
  )
}

export function DashboardPage() {
  const [apis, setApis] = useState<MonitoredApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newMethod, setNewMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET')
  const [newBody, setNewBody] = useState('')

  const [selected, setSelected] = useState<MonitoredApi | null>(null)
  const [history, setHistory] = useState<ApiCheck[]>([])
  const [uptime, setUptime] = useState<number | null>(null)
  const [sideLoading, setSideLoading] = useState(false)

  const canCreate = useMemo(() => newName.trim() && newUrl.trim(), [newName, newUrl])

  async function loadApis() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<MonitoredApi[]>('/api/monitored-apis')
      setApis(data)
      setLastUpdatedAt(new Date())
    } catch (e) {
      setError('Failed to load monitored APIs. Is the backend running and are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadApis()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const id = window.setInterval(() => {
      void loadApis()
    }, 10_000)
    return () => window.clearInterval(id)
  }, [autoRefresh])

  async function openDetails(api: MonitoredApi) {
    setSelected(api)
    setSideLoading(true)
    setHistory([])
    setUptime(null)
    try {
      const [h, u] = await Promise.all([
        apiFetch<ApiCheck[]>(`/api/monitored-apis/${api.id}/history`),
        apiFetch<{ apiId: number; uptime: number }>(`/api/monitored-apis/${api.id}/uptime`),
      ])
      setHistory(h)
      setUptime(u.uptime)
    } catch (e) {
      // ignore; shown in UI
    } finally {
      setSideLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xl font-semibold text-white">Monitored APIs</div>
              <div className="text-sm text-white/70">
                Create monitors, then the worker records status + response time.
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">
                <button
                  className={`rounded-full border px-2 py-1 ${
                    autoRefresh
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border-white/10 bg-white/5 text-white/70'
                  }`}
                  onClick={() => setAutoRefresh((v) => !v)}
                >
                  {autoRefresh ? 'Auto-refresh: ON' : 'Auto-refresh: OFF'}
                </button>
                <div>
                  Last updated:{' '}
                  <span className="font-semibold text-white">
                    {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : '—'}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/10"
              onClick={() => loadApis()}
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-6">
            <label className="block sm:col-span-1">
              <div className="mb-1 text-sm font-medium text-white/90">Name</div>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-violet-300/30 placeholder:text-white/40 focus:ring-4"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My API"
              />
            </label>
            <label className="block sm:col-span-1">
              <div className="mb-1 text-sm font-medium text-white/90">Method</div>
              <select
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-violet-300/30 focus:ring-4"
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value as any)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </label>
            <label className="block sm:col-span-4">
              <div className="mb-1 text-sm font-medium text-white/90">URL</div>
              <input
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-violet-300/30 placeholder:text-white/40 focus:ring-4"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/health"
              />
            </label>
          </div>

          {newMethod === 'GET' ? null : (
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium text-white/90">JSON body (optional)</div>
              <textarea
                className="h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none ring-violet-300/30 placeholder:text-white/40 focus:ring-4"
                placeholder='Example: {"ping":"hello"}'
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
              />
              <div className="mt-1 text-xs text-white/60">
                Only used for POST/PUT/PATCH/DELETE. Must be valid JSON if provided.
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-white/60">
              Tip: for best results, monitor a stable health endpoint.
            </div>
            <button
              disabled={!canCreate || creating}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/10 hover:from-violet-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={async () => {
                if (!canCreate) return
                setCreating(true)
                try {
                  let parsedBody: unknown = undefined
                  if (newMethod !== 'GET' && newBody.trim()) {
                    parsedBody = JSON.parse(newBody)
                  }
                  await apiFetch<MonitoredApi>('/api/monitored-apis', {
                    method: 'POST',
                    json: { name: newName, url: newUrl, method: newMethod, body: parsedBody },
                  })
                  setNewName('')
                  setNewUrl('')
                  setNewMethod('GET')
                  setNewBody('')
                  await loadApis()
                } catch (e) {
                  setError(
                    newBody.trim()
                      ? 'Failed to create monitor. Check URL/body JSON and backend logs.'
                      : 'Failed to create monitor. Check URL and backend logs.',
                  )
                } finally {
                  setCreating(false)
                }
              }}
            >
              {creating ? 'Creating…' : 'Add monitor'}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 px-5 py-3">
            <div className="text-sm font-semibold text-white">Your monitors</div>
          </div>

          {error ? (
            <div className="px-5 py-4 text-sm text-rose-200">{error}</div>
          ) : null}

          {loading ? (
            <div className="px-5 py-8 text-sm text-white/70">Loading…</div>
          ) : apis.length === 0 ? (
            <div className="px-5 py-8 text-sm text-white/70">No monitors yet.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {apis.map((api) => (
                <li key={api.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      className="text-left"
                      onClick={() => openDetails(api)}
                      title="View details"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-white">{api.name}</div>
                        <StatusPill status={api.status} />
                      </div>
                      <div className="mt-0.5 text-xs text-white/60">{api.url}</div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/10"
                        onClick={() => openDetails(api)}
                      >
                        History
                      </button>
                      <button
                        className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/15"
                        onClick={async () => {
                          await apiFetch(`/api/monitored-apis/${api.id}`, { method: 'DELETE' })
                          if (selected?.id === api.id) setSelected(null)
                          await loadApis()
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-white">Details</div>
            <div className="text-xs text-white/60">History & uptime</div>
          </div>
          {selected ? (
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-white/10"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          ) : null}
        </div>

        {!selected ? (
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/70">
            Select a monitor to view its history and uptime.
          </div>
        ) : sideLoading ? (
          <div className="mt-6 text-sm text-white/70">Loading details…</div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm font-semibold text-white">{selected.name}</div>
              <div className="mt-0.5 text-xs text-white/60">{selected.url}</div>
              <div className="mt-2 flex items-center gap-2">
                <StatusPill status={selected.status} />
                <div className="text-xs text-white/70">
                  Uptime:{' '}
                  <span className="font-semibold text-white">
                    {uptime === null ? '—' : `${uptime}%`}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                Last 10 checks
              </div>
              {history.length === 0 ? (
                <div className="text-sm text-white/70">No checks yet. Wait for the worker to run.</div>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => (
                    <li key={h.id} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                      <div className="flex items-center justify-between">
                        <StatusPill status={h.status} />
                        <div className="text-xs text-white/60">
                          {new Date(h.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-white/70">
                        Response time:{' '}
                        <span className="font-medium text-white">
                          {h.responseTime === null ? '—' : `${h.responseTime}ms`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

