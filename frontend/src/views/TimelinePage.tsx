// TimelinePage.tsx
import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { api } from '../api/client'

export function TimelinePage(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const items = await api.statsTimeline()
        setHasData(items.length > 0)
        
        if (items.length > 0 && ref.current) {
          const chart = echarts.init(ref.current)
          
        }
      } catch (error) {
        console.error('Error loading timeline data:', error)
        setHasData(false)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-slate-200">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mr-3"></i>
        <span className="text-slate-600">Загрузка хронологии...</span>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border border-slate-200 p-8">
        <i className="fa-regular fa-clock text-5xl text-slate-300 mb-4"></i>
        <h3 className="text-lg font-semibold text-slate-600 mb-2">Нет данных для хронологии</h3>
        <p className="text-slate-500 text-center">
          JSON файл пока не загружен, данных нет
        </p>
        <p className="text-sm text-slate-400 mt-2 text-center">
          Загрузите файл логов на странице "Загрузка" для построения временной шкалы
        </p>
      </div>
    )
  }

  return <div ref={ref} style={{ height: '400px' }} className="bg-white rounded-xl" />
}