// file: app/router.go
package app

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"gitlab.com/paradaise1/t1-hackaton-terraform/domain/log"
)

func WriteJson(w http.ResponseWriter, data any) error {
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(data)
}

func NewRouter(repo log.Repo) http.Handler {
	r := chi.NewRouter()

	// CORS middleware
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Post("/upload", func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		err := r.ParseMultipartForm(10 << 20) // 10MB max
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "file required", http.StatusBadRequest)
			return
		}
		defer file.Close()
		data, err := io.ReadAll(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		res, err := repo.UploadFile(ctx, data, uuid.NewString())
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		WriteJson(w, res)
	})

	r.Get("/logs", func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		q := r.URL.Query()
		page, _ := strconv.Atoi(q.Get("page"))
		limit, _ := strconv.Atoi(q.Get("limit"))
		filters := log.ExportFilters{
			TFResourceType: q.Get("tf_resource_type"),
			TimestampFrom:  q.Get("timestamp_from"),
			TimestampTo:    q.Get("timestamp_to"),
			Level:          q.Get("level"),
			Search:         q.Get("search"),
			Page:           page,
			Limit:          limit,
		}
		logs, err := repo.GetLogs(ctx, filters)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if logs == nil {
			logs = []log.Log{}
		}
		WriteJson(w, logs)
	})

	r.Get("/logs/{id}", func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		id := chi.URLParam(r, "id")
		logEntry, err := repo.GetLogByID(ctx, id)
		if err != nil {
			http.Error(w, "log not found", http.StatusNotFound)
			return
		}
		WriteJson(w, logEntry)
	})

	r.Post("/logs/mark-read", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			IDs []string `json:"ids"`
		}
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil || len(req.IDs) == 0 {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		err = repo.MarkLogsRead(r.Context(), req.IDs)
		if err != nil {
			http.Error(w, "failed to mark read", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	r.Get("/groups/{tf_req_id}", func(w http.ResponseWriter, r *http.Request) {
		tfReqID := chi.URLParam(r, "tf_req_id")
		group, err := repo.GetGroupByReqID(r.Context(), tfReqID)
		if err != nil {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		WriteJson(w, group)
	})

	r.Get("/timeline", func(w http.ResponseWriter, r *http.Request) {
		timeline, err := repo.GetTimelineEntries(r.Context())
		if err != nil {
			http.Error(w, "failed to get timeline", http.StatusInternalServerError)
			return
		}
		WriteJson(w, timeline)
	})

	r.Get("/metrics", func(w http.ResponseWriter, r *http.Request) {
		metrics, err := repo.GetMetrics(r.Context())
		if err != nil {
			http.Error(w, "failed to get metrics", http.StatusInternalServerError)
			return
		}
		WriteJson(w, metrics)
	})

	r.Post("/export/download", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Filters log.ExportFilters `json:"filters"`
		}
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		data, err := repo.ExportLogs(r.Context(), req.Filters)
		if err != nil {
			http.Error(w, "export failed", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Disposition", "attachment; filename=logs_export.json")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
	})

	r.Post("/export/telegram", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ChatID  string            `json:"chat_id"`
			Filters log.ExportFilters `json:"filters"`
		}
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil || strings.TrimSpace(req.ChatID) == "" {
			http.Error(w, "invalid request", http.StatusBadRequest)
			return
		}
		err = repo.SendExportToTelegram(r.Context(), req.ChatID, req.Filters)
		if err != nil {
			http.Error(w, "failed to send telegram message", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	r.Get("/corrupted-logs", func(w http.ResponseWriter, r *http.Request) {
		logs, _ := repo.GetCorruptedLogs(r.Context())
		WriteJson(w, logs)
	})
	return r
}
