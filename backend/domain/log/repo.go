package log

import "context"

type FileUploadResult struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type TimelineEntry struct {
	TFReqID string `json:"tf_req_id"`
	Start   string `json:"start"`
	End     string `json:"end"`
	Status  string `json:"status"`
}

type Metrics struct {
	Errors   int            `json:"errors"`
	Warnings int            `json:"warnings"`
	Levels   map[string]int `json:"levels"`
}

type ExportFilters struct {
	TFResourceType string `json:"tf_resource_type,omitempty"`
	TimestampFrom  string `json:"timestamp_from,omitempty"`
	TimestampTo    string `json:"timestamp_to,omitempty"`
	Level          string `json:"level,omitempty"`
	Search         string `json:"search,omitempty"`
	Page           int    `json:"page,omitempty"`
	Limit          int    `json:"limit,omitempty"`
}

type Repo interface {
	UploadFile(ctx context.Context, fileData []byte, fileName string) (FileUploadResult, error)
	GetLogs(ctx context.Context, filters ExportFilters) ([]Log, error)
	GetLogByID(ctx context.Context, id string) (Log, error)
	MarkLogsRead(ctx context.Context, ids []string) error
	GetGroupByReqID(ctx context.Context, tfReqID string) ([]Log, error)
	GetTimelineEntries(ctx context.Context) ([]TimelineEntry, error)
	GetMetrics(ctx context.Context) (Metrics, error)
	ExportLogs(ctx context.Context, filters ExportFilters) ([]byte, error)
	SendExportToTelegram(ctx context.Context, chatID string, filters ExportFilters) error
}
