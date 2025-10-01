import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './styles.css'
import { AppLayout } from './ui/AppLayout'
import { UploadPage } from './views/UploadPage'
import { LogsPage } from './views/LogsPage'
import { DetailPage } from './views/DetailPage'
import { GroupPage } from './views/GroupPage'
import { TimelinePage } from './views/TimelinePage'
import { DashboardPage } from './views/DashboardPage'
import { AnalyticsPage } from './views/AnalyticsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <UploadPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'logs/:id', element: <DetailPage /> },
      { path: 'groups/:tf_req_id', element: <GroupPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
    ],
  },
])

const root = createRoot(document.getElementById('root')!)
root.render(<RouterProvider router={router} />)

