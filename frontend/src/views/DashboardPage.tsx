// DashboardPage.tsx
import React, { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { api } from '../api/client'

export function DashboardPage(): JSX.Element {
  const pieRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const stats = await api.statsOverview()
        console.log('Stats data:', stats) // Для отладки
        setHasData(stats.total > 0)
        
        if (stats.total > 0 && pieRef.current && barRef.current) {
          const pie = echarts.init(pieRef.current)
          const bar = echarts.init(barRef.current)
          
          // Данные для круговой диаграммы - используем levels
          const pieData = Object.entries(stats.levels).map(([name, value]) => ({
            name,
            value,
            itemStyle: {
              color: 
                name === 'error' ? '#ef4444' :
                name === 'warn' ? '#f59e0b' :
                name === 'info' ? '#3b82f6' :
                name === 'debug' ? '#6b7280' :
                name === 'trace' ? '#8b5cf6' : '#9ca3af'
            }
          }))

          pie.setOption({
            title: {
              text: 'Распределение по уровням',
              left: 'center',
              textStyle: { color: '#374151', fontSize: 14 }
            },
            tooltip: { trigger: 'item' },
            series: [{
              type: 'pie',
              radius: ['40%', '70%'],
              data: pieData,
              label: { show: true, formatter: '{b}: {c} ({d}%)' }
            }]
          })

          // Данные для столбчатой диаграммы - ошибки и предупреждения
          bar.setOption({
            title: {
              text: 'Ошибки и предупреждения',
              left: 'center',
              textStyle: { color: '#374151', fontSize: 14 }
            },
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: ['Ошибки', 'Предупреждения'],
              axisLabel: { color: '#6b7280' }
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#6b7280' }
            },
            series: [{
              type: 'bar',
              data: [stats.errors, stats.warnings],
              itemStyle: {
                color: function(params: any) {
                  return params.dataIndex === 0 ? '#ef4444' : '#f59e0b'
                }
              }
            }]
          })

          const onResize = () => { 
            pie.resize() 
            bar.resize() 
          }
          window.addEventListener('resize', onResize)
          
          return () => {
            window.removeEventListener('resize', onResize)
            pie.dispose()
            bar.dispose()
          }
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setHasData(false)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-blue-500 mr-3"></i>
        <span className="text-slate-600">Загрузка данных...</span>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="text-center py-12">
        <i className="fa-regular fa-chart-bar text-5xl text-slate-300 mb-4"></i>
        <h3 className="text-lg font-semibold text-slate-600 mb-2">Нет данных для отображения</h3>
        <p className="text-slate-500">
          JSON файл пока не загружен, данных нет
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Загрузите файл логов на странице "Загрузка"
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div ref={pieRef} style={{ height: 320 }} />
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div ref={barRef} style={{ height: 320 }} />
      </div>
    </div>
  )
}