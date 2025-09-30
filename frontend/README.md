# Frontend mock (static)

Откройте `frontend/index.html` в браузере. Это статические макеты страниц:

- `index.html` — загрузка с drag-and-drop и валидацией .json/.jsonl
- `logs.html` — список + фильтры + ссылки
- `detail.html` — карточка записи с разворачиванием JSON
- `group.html` — цепочка по `tf_req_id`
- `timeline.html` — диаграмма хронологии (ECharts)
- `dashboard.html` — метрики (ECharts)

Переезд на React:

- Создайте проект Vite + React + TypeScript.
- Разбейте макеты на компоненты, перенесите стили Tailwind.
- Замените демо-данные вызовами REST API:
  - POST `/logs/import`
  - GET `/logs`, `/logs/{id}`, `/groups/{tf_req_id}`
  - GET `/stats/overview`, `/stats/timeline`
  - GET `/export`, POST `/share/telegram`
