import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, LogItem } from '../api/client'

export function LogsPage(): JSX.Element {
  const [items, setItems] = useState<LogItem[]>([])
  const [q, setQ] = useState('')
  const [tfReqId, setTfReqId] = useState('')
  const [resType, setResType] = useState('')
  const [level, setLevel] = useState('')
  const [section, setSection] = useState('')
  const [onlyAnomalies, setOnlyAnomalies] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(()=> new Set<string>(JSON.parse(localStorage.getItem('readIds')||'[]')))

  async function load() {
    const page = await api.listLogs({ q, tf_req_id: tfReqId, tf_resource_type: resType, level, section })
    const data = page.items
    setItems(onlyAnomalies ? data.filter(isAnomaly) : data)
  }

  useEffect(() => { load() }, [q, tfReqId, resType, level, section, onlyAnomalies])

  function toggleRead(id: string) {
    setReadIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      localStorage.setItem('readIds', JSON.stringify(Array.from(next)))
      return next
    })
  }

  return (
    <div>
      <div className="p-4 mb-3 flex flex-wrap gap-3 bg-white rounded border">
        <input value={q} onChange={e=>setQ(e.target.value)} className="px-3 py-2 border rounded w-64" placeholder="Full-text q"/>
        <input value={resType} onChange={e=>setResType(e.target.value)} className="px-3 py-2 border rounded w-56" placeholder="tf_resource_type"/>
        <input value={tfReqId} onChange={e=>setTfReqId(e.target.value)} className="px-3 py-2 border rounded w-56" placeholder="tf_req_id"/>
        <select value={level} onChange={e=>setLevel(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">level</option><option>debug</option><option>info</option><option>warn</option><option>error</option>
        </select>
        <select value={section} onChange={e=>setSection(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">section</option><option>plan</option><option>apply</option>
        </select>
        <label className="inline-flex items-center gap-2 px-2">
          <input type="checkbox" checked={onlyAnomalies} onChange={e=>{ setOnlyAnomalies(e.target.checked); }} />
          <span className="text-slate-700"><i className="fa-solid fa-triangle-exclamation mr-1 text-amber-600"/>Аномалии</span>
        </label>
        <button className="px-4 py-2 bg-slate-800 text-white rounded" onClick={load}><i className="fa-solid fa-magnifying-glass mr-2"/>Найти</button>
        <a className="px-4 py-2 bg-teal-500 text-white rounded" href={api.exportFiltered({ q })}>Экспорт</a>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead className="bg-slate-100 text-left text-sm">
            <tr><th className="p-3">Time</th><th className="p-3">Level</th><th className="p-3">Section</th><th className="p-3">tf_req_id</th><th className="p-3">Resource</th><th className="p-3">Message</th><th className="p-3">Read</th></tr>
          </thead>
          <tbody className="text-sm">
            {items.map(it => (
              <tr key={it.id} className={`border-t hover:bg-slate-50 ${isAnomaly(it) ? 'bg-amber-50' : ''}`}>
                <td className="p-3 whitespace-nowrap">{new Date(it.timestamp).toLocaleString()}</td>
                <td className="p-3">{badge(it.level)}</td>
                <td className="p-3">{it.section || '-'}</td>
                <td className="p-3"><Link className="text-sky-700 underline" to={`/groups/${it.tf_req_id}`}>{it.tf_req_id || '-'}</Link></td>
                <td className="p-3">{it.tf_resource_type || '-'}</td>
                <td className="p-3"><Link className="text-slate-800" to={`/logs/${it.id}`}>{it.message || ''}</Link></td>
                <td className="p-3">
                  <button onClick={()=>toggleRead(it.id)} className={`px-2 py-1 text-xs rounded ${readIds.has(it.id) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200'}`}>
                    {readIds.has(it.id) ? 'Прочитано' : 'Отметить'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function badge(level?: string): JSX.Element {
  const cls = level === 'error' ? 'badge badge-error' : level === 'warn' ? 'badge badge-warn' : 'badge badge-info'
  return <span className={cls}>{level || '-'}</span>
}

function isAnomaly(it: LogItem): boolean {
  // Базовая эвристика: warn/error считаем аномалией
  return it.level === 'warn' || it.level === 'error'
}

function toggleReadFactory(setReadIds: React.Dispatch<React.SetStateAction<Set<string>>>) {
  return (id: string) => setReadIds(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    localStorage.setItem('readIds', JSON.stringify(Array.from(next)))
    return next
  })
}

function useReadToggle(setReadIds: React.Dispatch<React.SetStateAction<Set<string>>>) {
  return toggleReadFactory(setReadIds)
}

function toggleRead(id: string) { /* placeholder replaced during render */ }


