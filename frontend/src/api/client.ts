

export type LogItem = {
  id: string
  timestamp: string
  level?: string
  section?: 'plan' | 'apply' | 'other'
  tf_req_id?: string
  tf_resource_type?: string
  message?: string
  tf_http_req_body?: string | null
  tf_http_res_body?: string | null
}

export type Paginated<T> = { total: number; items: T[] }
export type ExportFilters = {
  TFResourceType?: string
  TimestampFrom?: string
  TimestampTo?: string
  Level?: string
  Search?: string
  Page?: number
  Limit?: number
}

export type TimelineItem = {
  id: string;
  tf_req_id: string;
  label: string;
  start: string;
  end: string;
  status?: string; 
}




const BASE = ''

// Функция для определения секции по содержимому
function detectSection(item: any): 'plan' | 'apply' | 'other' {
  const message = (item['@message'] || item.message || '').toLowerCase()
  if (message.includes('plan') || message.includes('планирован')) {
    return 'plan'
  }
  if (message.includes('apply') || message.includes('применен')) {
    return 'apply'
  }
  return 'other'
}

// Функция для извлечения tf_req_id из сообщения (эвристика)
function extractTfReqId(item: any): string {
  const message = item['@message'] || item.message || ''
  // Пытаемся найти tf_req_id в сообщении
  const tfReqIdMatch = message.match(/tf_req_id[=:]\s*([^\s,\]}]+)/i)
  if (tfReqIdMatch) {
    return tfReqIdMatch[1]
  }
  return ''
}

// Функция для извлечения типа ресурса
function extractResourceType(item: any): string {
  const message = item['@message'] || item.message || ''
  // Ищем упоминания ресурсов в сообщении
  const resourceMatch = message.match(/(t1_[a-z_]+|data\.[a-z_]+)/i)
  if (resourceMatch) {
    return resourceMatch[1]
  }
  return ''
}


async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  console.log('Making request to:', input, init)
  
  try {
    const res = await fetch(input, init)
    console.log('Response status:', res.status, 'for URL:', input)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`HTTP ${res.status}:`, errorText)
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }
    
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      console.log('Response data received, type:', typeof data, 'isArray:', Array.isArray(data))
      return data as T
    }
    
    return await res.text() as unknown as T
  } catch (error) {
    console.error('Fetch error for URL:', input, error)
    throw error
  }
}

export const api = {
  async importLogs(file: File): Promise<{ importId: string }> {
    const fd = new FormData()
    fd.append('file', file)
    console.log('Uploading file:', file.name)
    const result = await http<{ importId: string }>(`${BASE}/upload`, { 
      method: 'POST', 
      body: fd 
    })
    console.log('Upload result:', result)
    return result
  },


async listLogs(params: Record<string, string | number | undefined> = {}): Promise<Paginated<LogItem>> {
  const url = new URL(`${BASE}/logs`, window.location.origin)
  
  if (params.q) url.searchParams.set('search', String(params.q))
  if (params.tf_resource_type) url.searchParams.set('tf_resource_type', String(params.tf_resource_type))
  if (params.level) url.searchParams.set('level', String(params.level))

  console.log('🌐 Fetching logs from:', url.toString())
  
  try {
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }
    
    const data = await response.json()
    console.log('📊 Response received, type:', typeof data)
    console.log('📊 Is array:', Array.isArray(data))
    console.log('📊 Data length:', data?.length)
    
    // ВАЖНО: data уже является массивом объектов логов
    if (!Array.isArray(data)) {
      console.error('❌ Expected array but got:', typeof data, data)
      return { total: 0, items: [] }
    }
    
    console.log(`🔄 Processing ${data.length} log entries...`)
    
    const items: LogItem[] = data.map((logEntry, index) => {
      // Каждый logEntry - это объект с полями id, @level, @message, @timestamp и т.д.
      const entry = logEntry || {}
      
      return {
        id: entry.id || `entry-${index}-${Date.now()}`,
        timestamp: entry['@timestamp'] || entry.timestamp || new Date().toISOString(),
        level: (entry['@level'] || entry.level || 'info').toLowerCase(),
        section: detectSection(entry),
        tf_req_id: entry.tf_req_id || '',
        tf_resource_type: entry.tf_resource_type || '',
        message: entry['@message'] || entry.message || '',
        tf_http_req_body: entry.tf_http_req_body,
        tf_http_res_body: entry.tf_http_res_body
      }
    }).filter(item => item.message) // Фильтруем пустые сообщения
    
    console.log(`✅ Processed ${items.length} valid log items`)
    
    // Показываем примеры для отладки
    if (items.length > 0) {
      console.log('📋 Sample items:')
      items.slice(0, 3).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.timestamp} [${item.level}] ${item.message.substring(0, 50)}...`)
      })
    }
    
    return { total: items.length, items }
    
  } catch (error) {
    console.error('💥 Error fetching logs:', error)
    return { total: 0, items: [] }
  }
},

  async getLog(id: string): Promise<LogItem> {
    const item = await http<any>(`${BASE}/logs/${encodeURIComponent(id)}`)
    return {
      id: item.id || id,
      timestamp: item['@timestamp'] || item.timestamp || new Date().toISOString(),
      level: (item['@level'] || item.level || 'info').toLowerCase(),
      section: detectSection(item),
      tf_req_id: item.tf_req_id || extractTfReqId(item),
      tf_resource_type: item.tf_resource_type || extractResourceType(item),
      message: item['@message'] || item.message || 'No message',
      tf_http_req_body: item.tf_http_req_body,
      tf_http_res_body: item.tf_http_res_body
    }
  },

  async getGroup(tf_req_id: string): Promise<{ tf_req_id: string; items: LogItem[] }> {
    const response = await http<any>(`${BASE}/groups/${encodeURIComponent(tf_req_id)}`)
    return {
      tf_req_id: response.tf_req_id || tf_req_id,
      items: Array.isArray(response.items) ? response.items.map((item: any) => ({
        id: item.id || `group-${Date.now()}`,
        timestamp: item['@timestamp'] || item.timestamp || new Date().toISOString(),
        level: (item['@level'] || item.level || 'info').toLowerCase(),
        section: detectSection(item),
        tf_req_id: item.tf_req_id || tf_req_id,
        tf_resource_type: item.tf_resource_type || extractResourceType(item),
        message: item['@message'] || item.message || 'No message',
        tf_http_req_body: item.tf_http_req_body,
        tf_http_res_body: item.tf_http_res_body
      })) : []
    }
  },

  async statsOverview(): Promise<{ total: number; byLevel: Record<string, number>; bySection: Record<string, number> }> {
    try {
      return await http(`${BASE}/metrics`)
    } catch (error) {
      console.error('Error loading stats:', error)
      return {
        total: 0,
        byLevel: {},
        bySection: {}
      }
    }
  },

// И обновите функцию statsTimeline
async statsTimeline(): Promise<TimelineItem[]> {
  try {
    return await http(`${BASE}/timeline`)
  } catch (error) {
    console.error('Error loading timeline:', error)
    return []
  }
},

  async exportDownload(filters: ExportFilters): Promise<Blob> {
    const res = await fetch(`${BASE}/export/download`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filters }),
    })
    if (!res.ok) throw new Error(`Export failed: ${res.status}`)
    return await res.blob()
  },

  async shareToTelegramWithFilters(chatId: string, filters: ExportFilters): Promise<void> {
    await fetch(`${BASE}/export/telegram`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, filters }),
    })
  },
}