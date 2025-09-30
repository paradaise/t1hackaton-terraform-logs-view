import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { api } from '../api/client'

export function TimelinePage(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current)
    async function load(){
      // const items = await api.statsTimeline()
      const items = [
        { id:'req-1', tf_req_id:'abc', label:'GET /instances', start:'2025-01-01T10:00:00Z', end:'2025-01-01T10:00:30Z' },
        { id:'req-2', tf_req_id:'def', label:'POST /instances', start:'2025-01-01T10:01:00Z', end:'2025-01-01T10:01:50Z' },
      ]
      const data = items.map((it,i)=>({ name: it.label, value: [ i, +new Date(it.start), +new Date(it.end), it.tf_req_id ] }))
      chart.setOption({
        tooltip:{formatter:(p:any)=>`${p.name}<br/>${new Date(p.value[1]).toLocaleTimeString()} - ${new Date(p.value[2]).toLocaleTimeString()}<br/>tf_req_id: ${p.value[3]}`},
        xAxis:{type:'time'}, yAxis:{type:'category', data: items.map(i=>i.label)},
        series:[{ type:'custom',
          renderItem: (_:any, api:any) => { const catIdx=api.value(0); const start=api.coord([api.value(1),catIdx]); const end=api.coord([api.value(2),catIdx]); const h=20; return { type:'rect', shape:{ x:start[0], y:start[1]-h/2, width:end[0]-start[0], height:h }, style:{ fill:'#34d399' } } },
          encode:{ x:[1,2], y:0, tooltip:[1,2,3] }, data }]
      })
    }
    load()
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.dispose() }
  }, [])

  return <div ref={ref} style={{ height: '70vh' }} className="bg-white rounded shadow" />
}


