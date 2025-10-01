// LogsPage.tsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, LogItem, ExportFilters } from '../api/client'

export function LogsPage(): JSX.Element {
  const [items, setItems] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')
  
  // Добавляем состояния для фильтров
  const [q, setQ] = useState('')
  const [tfReqId, setTfReqId] = useState('')
  const [resType, setResType] = useState('')
  const [level, setLevel] = useState('')
  const [section, setSection] = useState('')
  const [onlyAnomalies, setOnlyAnomalies] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set<string>(JSON.parse(localStorage.getItem('readIds') || '[]')))
  const [chatId, setChatId] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    setDebugInfo('Начало загрузки...')
    
    try {
      console.log('=== START LOAD LOGS ===')
      const page = await api.listLogs({ 
        q, 
        tf_req_id: tfReqId, 
        tf_resource_type: resType, 
        level, 
        section 
      })
      console.log('=== LOAD RESULT ===', page)
      
      setDebugInfo(`Загружено: ${page.items.length} записей, всего: ${page.total}`)
      
      // Применяем фильтр аномалий если включен
      const filteredItems = onlyAnomalies ? page.items.filter(isAnomaly) : page.items
      setItems(filteredItems)
      
      // Отладочная информация о первых нескольких элементах
      if (filteredItems.length > 0) {
        console.log('First 3 items details:', filteredItems.slice(0, 3))
      }
      
    } catch (err: any) {
      console.error('Load error:', err)
      setError(`Ошибка: ${err.message}`)
      setDebugInfo(`Ошибка загрузки: ${err.message}`)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load()
  }, [onlyAnomalies]) // Загружаем при изменении onlyAnomalies

  function toggleRead(id: string) {
    setReadIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      localStorage.setItem('readIds', JSON.stringify(Array.from(next)))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Дебаг информация */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Информация отладки:</h3>
          <p className="text-yellow-700 text-sm">{debugInfo}</p>
          <button 
            onClick={load}
            className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Перезагрузить
          </button>
        </div>

        {/* Фильтры */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <i className="fa-solid fa-magnifying-glass text-blue-500"></i>
              Поиск по логам
            </h1>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={onlyAnomalies} 
                    onChange={e => setOnlyAnomalies(e.target.checked)} 
                    className="sr-only" 
                  />
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    onlyAnomalies ? 'bg-amber-500' : 'bg-slate-300'
                  }`}></div>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    onlyAnomalies ? 'transform translate-x-7' : 'transform translate-x-1'
                  }`}></div>
                </div>
                <span className="text-slate-700 font-medium">
                  <i className="fa-solid fa-triangle-exclamation mr-2 text-amber-500"/>
                  Только аномалии
                </span>
              </label>
              <button 
                onClick={load}
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-md"
              >
                {loading ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2"/>Загрузка...</>
                ) : (
                  <><i className="fa-solid fa-refresh mr-2"/>Обновить</>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Полнотекстовый поиск
              </label>
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Введите текст для поиска..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Тип ресурса
              </label>
              <input 
                value={resType} 
                onChange={e => setResType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="tf_resource_type"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ID запроса
              </label>
              <input 
                value={tfReqId} 
                onChange={e => setTfReqId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="tf_req_id"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Уровень
              </label>
              <select 
                value={level} 
                onChange={e => setLevel(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">Все уровни</option>
                <option value="trace">Trace</option>
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Секция
              </label>
              <select 
                value={section} 
                onChange={e => setSection(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">Все секции</option>
                <option value="plan">Plan</option>
                <option value="apply">Apply</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button 
              onClick={load}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 disabled:opacity-50 transition-all shadow-md font-medium"
            >
              <i className="fa-solid fa-magnifying-glass mr-2"/>Применить фильтры
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation text-red-500 text-xl"></i>
              <div>
                <h3 className="font-semibold text-red-800">Ошибка загрузки</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Панель экспорта */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-800">
              <i className="fa-solid fa-download mr-2 text-emerald-500"></i>
              Экспорт данных
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 transition-all shadow-md font-medium flex items-center justify-center"
                disabled={downloading || items.length === 0}
                onClick={async () => {
                  setDownloading(true)
                  try {
                    const filters: ExportFilters = {
                      TFResourceType: resType || undefined,
                      Level: level || undefined,
                      Search: q || undefined,
                    }
                    const blob = await api.exportDownload(filters)
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `logs_export_${new Date().toISOString().split('T')[0]}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch (err) {
                    alert('Ошибка при экспорте данных')
                  } finally { 
                    setDownloading(false) 
                  }
                }}
              >
                {downloading ? (
                  <><i className="fa-solid fa-spinner fa-spin mr-2"/>Экспорт...</>
                ) : (
                  <><i className="fa-solid fa-file-arrow-down mr-2"/>Скачать JSON</>
                )}
              </button>

              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  value={chatId} 
                  onChange={e => setChatId(e.target.value)}
                  placeholder="ID чата Telegram"
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all flex-1 min-w-0"
                />
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl hover:from-sky-600 hover:to-sky-700 disabled:opacity-60 transition-all shadow-md font-medium flex items-center justify-center whitespace-nowrap"
                  disabled={!chatId || sending || items.length === 0}
                  onClick={async () => {
                    setSending(true)
                    try {
                      const filters: ExportFilters = {
                        TFResourceType: resType || undefined,
                        Level: level || undefined,
                        Search: q || undefined,
                      }
                      await api.shareToTelegramWithFilters(chatId, filters)
                      alert('Данные успешно отправлены в Telegram')
                    } catch (err) {
                      alert('Ошибка при отправке в Telegram')
                    } finally { 
                      setSending(false) 
                    }
                  }}
                >
                  {sending ? (
                    <><i className="fa-solid fa-spinner fa-spin mr-2"/>Отправка...</>
                  ) : (
                    <><i className="fa-brands fa-telegram mr-2"/>Отправить в Telegram</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Таблица с логами */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
              <p className="text-slate-600 text-lg">Загрузка логов...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <i className="fa-regular fa-folder-open text-5xl text-slate-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Данные не найдены</h3>
              <p className="text-slate-500 mb-4">
                {q || tfReqId || resType || level || section 
                  ? 'Попробуйте изменить параметры фильтрации' 
                  : 'Загрузите JSON файл с логами на главной странице'
                }
              </p>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <i className="fa-solid fa-upload"></i>
                Перейти к загрузке
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-100/80 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Время</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Уровень</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Секция</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">ID запроса</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Ресурс</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Сообщение</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {items.map((it, idx) => (
                    <tr 
                      key={it.id || idx} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isAnomaly(it) ? 'bg-amber-50/50 border-l-4 border-l-amber-400' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(it.timestamp).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {badge(it.level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          it.section === 'plan' ? 'bg-blue-100 text-blue-800' :
                          it.section === 'apply' ? 'bg-green-100 text-green-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {it.section || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {it.tf_req_id ? (
                          <Link 
                            to={`/groups/${it.tf_req_id}`}
                            className="text-blue-600 hover:text-blue-800 underline font-mono text-xs"
                          >
                            {it.tf_req_id.slice(0, 8)}...
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                        {it.tf_resource_type || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-md truncate">
                        {it.message ? (
                          <Link 
                            to={`/logs/${it.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {it.message}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => toggleRead(it.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            readIds.has(it.id) 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {readIds.has(it.id) ? (
                            <><i className="fa-solid fa-check mr-1"/>Прочитано</>
                          ) : (
                            <><i className="fa-regular fa-eye mr-1"/>Отметить</>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function badge(level?: string): JSX.Element {
  const levelMap: Record<string, { color: string; icon: string }> = {
    error: { color: 'bg-red-100 text-red-800 border-red-200', icon: 'fa-exclamation-circle' },
    warn: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: 'fa-triangle-exclamation' },
    info: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: 'fa-info-circle' },
    debug: { color: 'bg-slate-100 text-slate-800 border-slate-200', icon: 'fa-bug' },
    trace: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: 'fa-stream' },
  }
  
  const config = levelMap[level?.toLowerCase() || ''] || { 
    color: 'bg-gray-100 text-gray-800 border-gray-200', 
    icon: 'fa-question' 
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <i className={`fa-solid ${config.icon}`}></i>
      {level || 'unknown'}
    </span>
  )
}

function isAnomaly(it: LogItem): boolean {
  return it.level === 'warn' || it.level === 'error'
}