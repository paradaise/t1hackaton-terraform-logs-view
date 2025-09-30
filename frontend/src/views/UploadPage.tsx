import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export function UploadPage(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  function validate(file: File | null): file is File {
    if (!file) return false
    if (!/\.(json|jsonl)$/i.test(file.name)) { setError('Допустимы только .json/.jsonl'); return false }
    setError(''); return true
  }

  async function handleFiles(file: File | null) {
    if (!validate(file)) return
    setBusy(true)
    try {
      const res = await api.importLogs(file)
      console.log('importId', res.importId)
      navigate('/logs')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl p-10" style={{ background: 'linear-gradient(135deg, #e6f4f1, #f1f5f9)' }}>
      <div
        className="mx-auto max-w-xl rounded-2xl bg-white/80 p-14 text-center border-2 border-dashed border-teal-200 hover:border-teal-400 transition shadow-sm"
        onDragOver={e=>{e.preventDefault()}}
        onDrop={e=>{e.preventDefault(); handleFiles(e.dataTransfer.files?.[0] ?? null)}}
      >
        <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <i className="fa-solid fa-file-arrow-up text-5xl text-slate-600" aria-hidden/><span className="ml-2 text-4xl" role="img" aria-label="file">📄</span>
        </div>
        <p className="text-2xl text-slate-700 mb-2">Загрузить файл</p>
        <p className="text-sm text-slate-500 mb-4">Перетащите или выберите файл .json / .jsonl</p>
        <input ref={inputRef} type="file" accept=".json,.jsonl,application/json" className="hidden" onChange={e=>handleFiles(e.currentTarget.files?.[0] ?? null)} />
        <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-60" disabled={busy}
          onClick={()=>inputRef.current?.click()}>Выбрать файл</button>
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric title="Всего записей" value="-"/>
        <Metric title="Ошибок" value="-" className="text-rose-600"/>
        <Metric title="Средняя длит., мс" value="-"/>
      </div>
    </div>
  )
}

function Metric({ title, value, className }: { title: string; value: string; className?: string }): JSX.Element {
  return (
    <div className="rounded-xl bg-white p-5 shadow">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className={`text-3xl font-semibold ${className ?? ''}`}>{value}</p>
    </div>
  )
}


