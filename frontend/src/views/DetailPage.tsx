import React, { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import JSONFormatter from 'json-formatter-js'
import { api, LogItem } from '../api/client'

export function DetailPage(): JSX.Element {
  const { id = '' } = useParams()
  const [item, setItem] = useState<LogItem | null>(null)
  const reqRef = useRef<HTMLDivElement>(null)
  const resRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load(){
      // const it = await api.getLog(id)
      const it: LogItem = { id, timestamp:'2025-01-01T10:00:00Z', level:'info', section:'apply', tf_req_id:'abc', tf_resource_type:'t1_compute_instance', message:'created', tf_http_req_body:'{"name":"vm"}', tf_http_res_body:'{"id":"123","status":"ok"}' }
      setItem(it)
      if (it.tf_http_req_body && reqRef.current) {
        const jf = new JSONFormatter(JSON.parse(it.tf_http_req_body), 1)
        reqRef.current.innerHTML = ''
        reqRef.current.appendChild(jf.render())
      }
      if (it.tf_http_res_body && resRef.current) {
        const jf2 = new JSONFormatter(JSON.parse(it.tf_http_res_body), 1)
        resRef.current.innerHTML = ''
        resRef.current.appendChild(jf2.render())
      }
    }
    load()
  }, [id])

  if (!item) return <div>Загрузка…</div>

  return (
    <div>
      <h2 className="text-2xl mb-4">Запись</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <Meta label="Time" value={new Date(item.timestamp).toLocaleString()} />
          <Meta label="Level" value={item.level || '-'} />
          <Meta label="Section" value={item.section || '-'} />
          <Meta label="tf_req_id" value={item.tf_req_id || '-'} />
        </div>
        <div className="bg-white p-4 rounded shadow">
          <Meta label="Resource" value={item.tf_resource_type || '-'} />
          <Meta label="Message" value={item.message || ''} />
        </div>
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div><h3 className="font-semibold mb-2">Request JSON</h3><div ref={reqRef} className="bg-white rounded shadow p-3"/></div>
        <div><h3 className="font-semibold mb-2">Response JSON</h3><div ref={resRef} className="bg-white rounded shadow p-3"/></div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="mb-2">
      <div className="text-sm text-slate-500">{label}</div>
      <div>{value}</div>
    </div>
  )
}


