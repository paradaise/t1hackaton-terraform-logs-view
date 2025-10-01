// AppLayout.tsx
import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

export function AppLayout(): JSX.Element {
  const loc = useLocation()
  const nav = [
    { to: '/', label: 'Загрузка', icon: 'fa-file-arrow-up' },
    { to: '/logs', label: 'Логи', icon: 'fa-table-list' },
    { to: '/analytics', label: 'Аналитика', icon: 'fa-chart-line' },
  ]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <i className="fa-solid fa-mountain text-blue-200"></i>
              Terraform Logs Analyzer
            </h1>
            <nav className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-2xl p-1">
              {nav.map(n => (
                <Link 
                  key={n.to} 
                  to={n.to}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    loc.pathname === n.to 
                      ? 'bg-white text-blue-700 shadow-md' 
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${n.icon}`} aria-hidden/> 
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}