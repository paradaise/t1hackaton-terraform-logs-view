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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-teal-200/80 py-4">
        <h1 className="text-center text-xl text-white">Terraform Logs View</h1>
      </header>
      <nav className="container mx-auto px-4 py-3 flex gap-3">
        {nav.map(n => (
          <Link key={n.to} to={n.to} className={`px-3 py-2 rounded ${loc.pathname === n.to ? 'bg-slate-800 text-white' : 'bg-white'}`}>
            <i className={`fa-solid ${n.icon} mr-2`} aria-hidden/> {n.label}
          </Link>
        ))}
      </nav>
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}


