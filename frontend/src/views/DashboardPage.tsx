import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { api } from '../api/client'

export function DashboardPage(): JSX.Element {
  const pieRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pie = echarts.init(pieRef.current!)
    const bar = echarts.init(barRef.current!)
    async function load(){
      // const s = await api.statsOverview()
      const s = { byLevel: { info: 120, warn: 5, error: 2 }, bySection: { plan: 80, apply: 47 } }
      pie.setOption({ series: [{ type:'pie', data: Object.entries(s.byLevel).map(([k,v])=>({ name:k, value:v })) }] })
      bar.setOption({ xAxis:{ type:'category', data: Object.keys(s.bySection) }, yAxis:{ type:'value' }, series:[{ type:'bar', data:Object.values(s.bySection) }] })
    }
  
    load()
    const onResize = () => { pie.resize(); bar.resize() }
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); pie.dispose(); bar.dispose() }
  }, [])

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded shadow p-4"><h3 className="font-semibold mb-2">Уровни логов</h3><div ref={pieRef} style={{height:320}}/></div>
      <div className="bg-white rounded shadow p-4"><h3 className="font-semibold mb-2">Plan vs Apply</h3><div ref={barRef} style={{height:320}}/></div>
    </div>
  )
}


