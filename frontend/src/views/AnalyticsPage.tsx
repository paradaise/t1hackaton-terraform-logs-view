// AnalyticsPage.tsx
import React from 'react'
import { TimelinePage } from './TimelinePage'
import { DashboardPage } from './DashboardPage'

export function AnalyticsPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-lg text-slate-800 mb-4">
                <i className="fa-solid fa-timeline mr-2 text-blue-500"/>Хронология
              </h3>
              <TimelinePage />
            </div>
          </div>
          <div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="font-semibold text-lg text-slate-800 mb-4">
                <i className="fa-solid fa-chart-pie mr-2 text-green-500"/>Дашборд
              </h3>
              <DashboardPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}