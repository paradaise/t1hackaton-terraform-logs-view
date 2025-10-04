# Terraform Logs Viewer & Analyzer

<div align="center">

![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![Hackathon](https://img.shields.io/badge/Hackathon-Project-green?style=for-the-badge)

**Мощный инструмент для анализа и визуализации Terraform логов в реальном времени**

[Особенности](#особенности) • [Архитектура](#архитектура) • [Установка](#установка) • [Использование](#использование)

</div>

## 🚀 Обзор

Terraform Logs Viewer - это инновационное решение для мониторинга и анализа логов Terraform операций. Система предоставляет интуитивно понятный интерфейс для отслеживания развертывания инфраструктуры, выявления проблем и оптимизации процессов.

### 🎯 Ключевые возможности

- **📊 Визуализация в реальном времени** - отслеживание прогресса Terraform операций
- **🔍 Умный анализ логов** - автоматическое определение ошибок и предупреждений
- **📈 Аналитика производительности** - метрики времени выполнения операций
- **🚨 Система оповещений** - мгновенные уведомления о критических событиях
- **💾 История выполнений** - хранение и сравнение предыдущих запусков

## 🏗️ Архитектура системы

### Схема работы

```mermaid
graph TB
    A[Terraform CLI] --> B[Log Collector]
    B --> C[Log Parser]
    C --> D[Analysis Engine]
    D --> E[Real-time Dashboard]
    D --> F[Database]
    E --> G[Web Interface]
    D --> H[Alert System]
    
    subgraph "Backend Services"
        B
        C
        D
    end
    
    subgraph "Frontend"
        E
        G
    end
    
    subgraph "Storage"
        F[(Time-series DB)]
    end
```
