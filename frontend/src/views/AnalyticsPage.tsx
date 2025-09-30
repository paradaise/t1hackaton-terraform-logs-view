import React from 'react'
import { TimelinePage } from './TimelinePage'
import { DashboardPage } from './DashboardPage'

export function AnalyticsPage(): JSX.Element {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h3 className="font-semibold mb-2"><i className="fa-solid fa-timeline mr-2"/>Хронология</h3>
        <TimelinePage />
      </div>
      <div>
        <h3 className="font-semibold mb-2"><i className="fa-solid fa-chart-pie mr-2"/>Дашборд</h3>
        <DashboardPage />
      </div>
    </div>
  )
}


