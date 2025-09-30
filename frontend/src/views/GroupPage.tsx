import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, LogItem } from '../api/client'

export function GroupPage(): JSX.Element {
  const { tf_req_id = '' } = useParams()
  const [items, setItems] = useState<LogItem[]>([])

  useEffect(() => {
    async function load(){
      // const data = await api.getGroup(tf_req_id)
      const data = { tf_req_id, items: [ { id:'1', timestamp:'2025-01-01T10:00:00Z', message:'HTTP request' }, { id:'2', timestamp:'2025-01-01T10:00:01Z', message:'HTTP response 200' } ] }
      setItems(data.items)
    }
    load()
  }, [tf_req_id])

  return (
    <div>
      <h2 className="text-2xl">Цепочка {tf_req_id}</h2>
      <div className="mt-4 space-y-3">
        {items.map(it => (
          <div key={it.id} className="bg-white p-4 rounded shadow flex items-center gap-4">
            <div className="text-sm text-slate-500 w-56">{new Date(it.timestamp!).toLocaleTimeString()}</div>
            <div className="flex-1">{it.message}</div>
            <Link className="px-3 py-1 bg-slate-800 text-white rounded" to={`/logs/${it.id}`}>Открыть</Link>
          </div>
        ))}
      </div>
    </div>
  )
}


