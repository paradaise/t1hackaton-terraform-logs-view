package repos

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"gitlab.com/paradaise1/t1-hackaton-terraform/domain/log"
)

const timeFormat = "2006-01-02T15:04:05.000000-07:00"

type LogRepo struct {
	mu            sync.RWMutex
	store         map[string]*log.Log  // id -> Log
	files         map[string][]log.Log // ID файла -> логи
	corruptedLogs []string
}

func NewLogRepo() log.Repo {
	return &LogRepo{
		store:         make(map[string]*log.Log),
		files:         make(map[string][]log.Log),
		corruptedLogs: []string{},
	}
}

func (r *LogRepo) UploadFile(
	ctx context.Context,
	fileData []byte,
	fileName string,
) (log.FileUploadResult, error) {
	logs, corruptedLogs, err := log.LoadLogs(bytes.NewReader(fileData))
	if err != nil {
		return log.FileUploadResult{}, err
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	fileID := uuid.NewString()
	for i := range logs {
		if logs[i].Id == "" {
			logs[i].Id = uuid.NewString()
		}
		r.store[logs[i].Id] = &logs[i]
	}
	r.files[fileID] = logs
	r.corruptedLogs = append(r.corruptedLogs, corruptedLogs...)
	return log.FileUploadResult{
		ID:     fileID,
		Status: "parsed",
	}, nil
}

func (r *LogRepo) GetLogs(ctx context.Context, filters log.ExportFilters) ([]log.Log, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var filtered []log.Log
	// Фильтрация
	for _, l := range r.store {
		if filters.TFResourceType != "" && l.Tf_resource_type != filters.TFResourceType {
			continue
		}
		if filters.Level != "" {
			levelStr := strings.ToLower(l.At_level)
			if levelStr == "" {
				levelStr = levelToStr(l.Level)
			}
			if strings.ToLower(filters.Level) != levelStr {
				continue
			}
		}
		if filters.TimestampFrom != "" && l.Timestamp < filters.TimestampFrom {
			continue
		}
		if filters.TimestampTo != "" && l.Timestamp > filters.TimestampTo {
			continue
		}
		if filters.Search != "" {
			b, _ := json.Marshal(l)
			if !bytes.Contains(bytes.ToLower(b), []byte(strings.ToLower(filters.Search))) {
				continue
			}
		}
		filtered = append(filtered, *l)
	}
	// Сортировка по @timestamp
	sort.Slice(filtered, func(i, j int) bool {
		iDate, err := time.Parse(timeFormat, filtered[i].At_timestamp)
		if err != nil {
			fmt.Println(err.Error())
		}
		jDate, err := time.Parse(timeFormat, filtered[j].At_timestamp)
		if err != nil {
			fmt.Println(err.Error())
		}
		return iDate.After(jDate)
	})
	// Пагинация
	page := 1
	limit := 50
	if filters.Page > 0 {
		page = filters.Page
	}
	if filters.Limit > 0 {
		limit = filters.Limit
	}
	start := (page - 1) * limit
	if start > len(filtered) {
		return []log.Log{}, nil
	}
	end := min(start+limit, len(filtered))
	return filtered[start:end], nil
}

func levelToStr(level int) string {
	switch level {
	case 0:
		return "info"
	case 1:
		return "warn"
	case 2:
		return "error"
	default:
		return "info"
	}
}

func (r *LogRepo) GetLogByID(ctx context.Context, id string) (log.Log, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	l, ok := r.store[id]
	if !ok {
		return log.Log{}, errors.New("log not found")
	}
	return *l, nil
}

func (r *LogRepo) MarkLogsRead(ctx context.Context, ids []string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, id := range ids {
		if _, ok := r.store[id]; ok {
			r.store[id].Read = !r.store[id].Read
		}
	}
	return nil
}

func (r *LogRepo) GetGroupByReqID(ctx context.Context, tfReqID string) ([]log.Log, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var group []log.Log
	for _, l := range r.store {
		if l.Tf_req_id == tfReqID {
			group = append(group, *l)
		}
	}
	return group, nil
}

func (r *LogRepo) GetTimelineEntries(ctx context.Context) ([]log.TimelineEntry, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	entriesMap := make(map[string]log.TimelineEntry)
	for _, l := range r.store {
		if l.Tf_req_id == "" || l.At_timestamp == "" {
			continue
		}
		// Для примера берем первый и последний таймштамп и статус по severity
		e, ok := entriesMap[l.Tf_req_id]
		if !ok {
			e = log.TimelineEntry{
				TFReqID: l.Tf_req_id,
				Start:   l.At_timestamp,
				End:     l.At_timestamp,
				Status:  l.Diagnostic_severity,
			}
		} else {
			if l.At_timestamp < e.Start {
				e.Start = l.At_timestamp
			}
			if l.At_timestamp > e.End {
				e.End = l.At_timestamp
			}
			// Перезаписываем статус если severity более критический (error > warning > info)
			e.Status = maxSeverity(e.Status, l.Diagnostic_severity)
		}
		entriesMap[l.Tf_req_id] = e
	}

	var entries []log.TimelineEntry
	for _, e := range entriesMap {
		entries = append(entries, e)
	}
	return entries, nil
}

func maxSeverity(a, b string) string {
	severityRank := map[string]int{"info": 0, "warning": 1, "error": 2}
	rA, okA := severityRank[strings.ToLower(a)]
	rB, okB := severityRank[strings.ToLower(b)]
	if !okA {
		rA = 0
	}
	if !okB {
		rB = 0
	}
	if rA > rB {
		return a
	}
	return b
}

func (r *LogRepo) GetMetrics(ctx context.Context) (log.Metrics, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var metrics log.Metrics
	metrics.Levels = make(map[string]int)
	for _, l := range r.store {
		sev := strings.ToLower(l.Diagnostic_severity)
		switch sev {
		case "error":
			metrics.Errors++
		case "warning":
			metrics.Warnings++
		}
		if sev != "" {
			metrics.Levels[sev]++
		} else {
			metrics.Levels["info"]++
		}
	}
	return metrics, nil
}

func (r *LogRepo) ExportLogs(ctx context.Context, filters log.ExportFilters) ([]byte, error) {
	logs, err := r.GetLogs(ctx, filters)
	if err != nil {
		return nil, err
	}
	return json.MarshalIndent(logs, "", "  ")
}

func (r *LogRepo) SendExportToTelegram(
	ctx context.Context,
	chatID string,
	filters log.ExportFilters,
) error {
	return errors.New("unimplemented")
}

func (r *LogRepo) GetCorruptedLogs(ctx context.Context) ([]string, error) {
	return r.corruptedLogs, nil
}
