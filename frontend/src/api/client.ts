// Простая обертка над fetch с подсказками типов через JSDoc

export type LogItem = {
  id: string
  timestamp: string
  level?: string
  section?: 'plan' | 'apply' | 'other'
  tf_req_id?: string
  tf_resource_type?: string
  message?: string
  tf_http_req_body?: string | null
  tf_http_res_body?: string | null
}

export type Paginated<T> = { total: number; items: T[] }

const BASE = '' // при необходимости задайте префикс, например '/api'

// Временное локальное хранилище для работы без backend
type LocalDb = { logs: LogItem[] }
const local: LocalDb = { logs: [] }

export function loadLocalLogsFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const lines = text.split(/\r?\n/).filter(Boolean)
        // Поддержка JSONL и массива JSON
        let count = 0
        if (lines.length > 1) {
          for (const ln of lines) {
            try { local.logs.push(JSON.parse(ln)); count++ } catch {}
          }
        } else {
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed)) { local.logs.push(...parsed); count = parsed.length }
          else { local.logs.push(parsed); count = 1 }
        }
        resolve(count)
      } catch (e) { reject(e) }
    }
    reader.readAsText(file)
  })
}

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return (await res.json()) as T
  return (await res.text()) as unknown as T
}

export const api = {
  // Пример импорта файла
  async importLogs(file: File): Promise<{ importId: string }>{
    // оффлайн режим: кладем в local.logs
    const n = await loadLocalLogsFromFile(file)
    return { importId: `local-${Date.now()}-${n}` }
  },

  // Пример поиска
  async listLogs(params: Record<string,string|number|undefined> = {}): Promise<Paginated<LogItem>>{
    if (local.logs.length) {
      let items = [...local.logs]
      const { q, tf_req_id, tf_resource_type, level, section } = params as any
      if (q) items = items.filter(i => JSON.stringify(i).toLowerCase().includes(String(q).toLowerCase()))
      if (tf_req_id) items = items.filter(i => i.tf_req_id === tf_req_id)
      if (tf_resource_type) items = items.filter(i => i.tf_resource_type === tf_resource_type)
      if (level) items = items.filter(i => i.level === level)
      if (section) items = items.filter(i => i.section === section)
      return { total: items.length, items }
    }
    const url = new URL(`${BASE}/logs`, location.origin)
    Object.entries(params).forEach(([k,v])=>{ if(v!==undefined && v!=='') url.searchParams.set(k, String(v)) })
    return http(url.toString())
  },

  async getLog(id: string): Promise<LogItem>{
    if (local.logs.length) {
      const found = local.logs.find(l => l.id === id) ?? local.logs[0]
      if (!found) throw new Error('Log not found')
      return found
    }
    return http(`${BASE}/logs/${encodeURIComponent(id)}`)
  },

  async getGroup(tf_req_id: string): Promise<{ tf_req_id: string; items: LogItem[] }>{
    if (local.logs.length) {
      const items = local.logs.filter(l => l.tf_req_id === tf_req_id)
      return { tf_req_id, items }
    }
    return http(`${BASE}/groups/${encodeURIComponent(tf_req_id)}`)
  },

  async statsOverview(params: Record<string,string|number|undefined> = {}): Promise<{ total: number; byLevel: Record<string,number>; bySection: Record<string,number> }>{
    if (local.logs.length) {
      const byLevel: Record<string,number> = {}
      const bySection: Record<string,number> = {}
      for (const l of local.logs) {
        if (l.level) byLevel[l.level] = (byLevel[l.level]||0)+1
        if (l.section) bySection[l.section] = (bySection[l.section]||0)+1
      }
      return { total: local.logs.length, byLevel, bySection }
    }
    const url = new URL(`${BASE}/stats/overview`, location.origin)
    Object.entries(params).forEach(([k,v])=>{ if(v!==undefined && v!=='') url.searchParams.set(k, String(v)) })
    return http(url.toString())
  },

  async statsTimeline(): Promise<Array<{ id:string; tf_req_id:string; label:string; start:string; end:string }>>{
    if (local.logs.length) {
      // примитивная агрегация: группируем по tf_req_id
      const groups: Record<string, LogItem[]> = {}
      for (const l of local.logs) {
        const rid = l.tf_req_id
        if (!rid) continue
        groups[rid] ||= []
        groups[rid].push(l)
      }
      const items: Array<{ id:string; tf_req_id:string; label:string; start:string; end:string }> = []
      for (const [rid, arr] of Object.entries(groups)) {
        arr.sort((a,b)=>+(new Date(a.timestamp)) - +(new Date(b.timestamp)))
        const start = arr[0]?.timestamp || new Date().toISOString()
        const end = arr[arr.length-1]?.timestamp || start
        const label = arr[0]?.tf_resource_type || rid
        items.push({ id: `tl-${rid}`, tf_req_id: rid, label, start, end })
      }
      return items
    }
    return http(`${BASE}/stats/timeline`)
  },

  // Экспорт и отправка в Telegram (пример)
  exportFiltered(params: Record<string,string|number|undefined> = {}): string {
    const url = new URL(`${BASE}/export`, location.origin)
    Object.entries(params).forEach(([k,v])=>{ if(v!==undefined && v!=='') url.searchParams.set(k, String(v)) })
    return url.toString()
  },

  async shareToTelegram(exportUrl: string, chatId: string): Promise<{ status: 'queued' }>{
    return http(`${BASE}/share/telegram`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ exportUrl, chatId }) })
  },
}


