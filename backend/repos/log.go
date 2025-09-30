package repos

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
	"gitlab.com/paradaise1/t1-hackaton-terraform/domain/log"
)

type LogRepo struct {
	db *sqlx.DB
}

func (r *LogRepo) UploadFile(
	ctx context.Context,
	fileData []byte,
	fileName string,
) (log.FileUploadResult, error) {
	logs, err := log.LoadLogs(bytes.NewReader(fileData))
	if err != nil {
		return log.FileUploadResult{}, err
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return log.FileUploadResult{}, err
	}
	defer tx.Rollback()

	for _, l := range logs {
		_, err := tx.NamedExecContext(ctx, `
			INSERT INTO logs (id, Accept, Accept_Encoding, Access_Control_Expose_Headers, Address, Args, Cache_Control,
				At_caller, Channel, Connection, Content_Length, Content_Security_Policy, Content_Type, Date, Description,
				Diagnostic_attribute, Diagnostic_detail, Diagnostic_error_count, Diagnostic_severity, Diagnostic_summary,
				Diagnostic_warning_count, Err, Etag, Expires, EXTRA_VALUE_AT_END, Host, Keep_Alive, Len, At_level, Level,
				At_message, At_module, Network, Path, Permissions_Policy, Pid, Plugin, Pragma, Referrer_Policy, Server,
				Set_Cookie, Strict_Transport_Security, Tf_attribute_path, Tf_client_capability_deferral_allowed,
				Tf_client_capability_write_only_attributes_allowed, Tf_data_source_type, Tf_http_op_type, Tf_http_req_body,
				Tf_http_req_method, Tf_http_req_uri, Tf_http_req_version, Tf_http_res_body, Tf_http_res_status_code,
				Tf_http_res_status_reason, Tf_http_res_version, Tf_http_trans_id, Tf_proto_version, Tf_provider_addr, Stdout,
				Tf_req_duration_ms, Tf_req_id, Tf_resource_type, Tf_rpc, Tf_server_capability_get_provider_schema_optional,
				Tf_server_capability_move_resource_state, Tf_server_capability_plan_destroy, At_timestamp, Timestamp,
				User_Agent, Vary, Version, Via, X_Content_Type_Options, X_Frame_Options, X_Kong_Proxy_Latency,
				X_Kong_Upstream_Latency, X_Request_Id, X_Runtime)
			VALUES (:id, :Accept, :Accept_Encoding, :Access_Control_Expose_Headers, :Address, :Args, :Cache_Control,
				:At_caller, :Channel, :Connection, :Content_Length, :Content_Security_Policy, :Content_Type, :Date, :Description,
				:Diagnostic_attribute, :Diagnostic_detail, :Diagnostic_error_count, :Diagnostic_severity, :Diagnostic_summary,
				:Diagnostic_warning_count, :Err, :Etag, :Expires, :EXTRA_VALUE_AT_END, :Host, :Keep_Alive, :Len, :At_level, :Level,
				:At_message, :At_module, :Network, :Path, :Permissions_Policy, :Pid, :Plugin, :Pragma, :Referrer_Policy, :Server,
				:Set_Cookie, :Strict_Transport_Security, :Tf_attribute_path, :Tf_client_capability_deferral_allowed,
				:Tf_client_capability_write_only_attributes_allowed, :Tf_data_source_type, :Tf_http_op_type, :Tf_http_req_body,
				:Tf_http_req_method, :Tf_http_req_uri, :Tf_http_req_version, :Tf_http_res_body, :Tf_http_res_status_code,
				:Tf_http_res_status_reason, :Tf_http_res_version, :Tf_http_trans_id, :Tf_proto_version, :Tf_provider_addr, :Stdout,
				:Tf_req_duration_ms, :Tf_req_id, :Tf_resource_type, :Tf_rpc, :Tf_server_capability_get_provider_schema_optional,
				:Tf_server_capability_move_resource_state, :Tf_server_capability_plan_destroy, :At_timestamp, :Timestamp,
				:User_Agent, :Vary, :Version, :Via, :X_Content_Type_Options, :X_Frame_Options, :X_Kong_Proxy_Latency,
				:X_Kong_Upstream_Latency, :X_Request_Id, :X_Runtime)
			ON CONFLICT (id) DO UPDATE SET Accept = EXCLUDED.Accept
		`, l)
		if err != nil {
			return log.FileUploadResult{}, fmt.Errorf("failed to insert log %s: %w", l.Id, err)
		}
	}

	err = tx.Commit()
	if err != nil {
		return log.FileUploadResult{}, err
	}

	return log.FileUploadResult{ID: "file_uuid", Status: "parsed"}, nil
}

func (r *LogRepo) GetLogs(ctx context.Context, filters log.ExportFilters) ([]log.Log, error) {
	queryBuilder := strings.Builder{}
	args := []any{}
	queryBuilder.WriteString("SELECT * FROM logs WHERE 1=1 ")

	argPos := 1
	if filters.TFResourceType != "" {
		queryBuilder.WriteString(fmt.Sprintf("AND tf_resource_type = $%d ", argPos))
		args = append(args, filters.TFResourceType)
		argPos++
	}
	if filters.Level != "" {
		queryBuilder.WriteString(fmt.Sprintf("AND at_level = $%d ", argPos))
		args = append(args, filters.Level)
		argPos++
	}
	if filters.TimestampFrom != "" {
		queryBuilder.WriteString(fmt.Sprintf("AND timestamp >= $%d ", argPos))
		args = append(args, filters.TimestampFrom)
		argPos++
	}
	if filters.TimestampTo != "" {
		queryBuilder.WriteString(fmt.Sprintf("AND timestamp <= $%d ", argPos))
		args = append(args, filters.TimestampTo)
		argPos++
	}
	if filters.Search != "" {
		queryBuilder.WriteString(
			fmt.Sprintf("AND (description ILIKE $%d OR err ILIKE $%d) ", argPos, argPos+1),
		)
		searchArg := "%" + filters.Search + "%"
		args = append(args, searchArg, searchArg)
		argPos += 2
	}
	limit := 50
	if filters.Limit > 0 {
		limit = filters.Limit
	}
	page := 1
	if filters.Page > 0 {
		page = filters.Page
	}
	offset := (page - 1) * limit

	queryBuilder.WriteString(
		fmt.Sprintf("ORDER BY timestamp DESC LIMIT $%d OFFSET $%d", argPos, argPos+1),
	)
	args = append(args, limit, offset)

	var logs []log.Log
	err := r.db.SelectContext(ctx, &logs, queryBuilder.String(), args...)
	if err != nil {
		return nil, err
	}
	return logs, nil
}

func (r *LogRepo) GetLogByID(ctx context.Context, id string) (log.Log, error) {
	var log log.Log
	err := r.db.GetContext(ctx, &log, "SELECT * FROM logs WHERE id=$1", id)
	return log, err
}

func (r *LogRepo) MarkLogsRead(ctx context.Context, ids []string) error {
	if len(ids) == 0 {
		return nil
	}
	query := "UPDATE logs SET read = TRUE WHERE id = ANY($1)"
	_, err := r.db.ExecContext(ctx, query, ids)
	return err
}

func (r *LogRepo) GetGroupByReqID(ctx context.Context, tfReqID string) ([]log.Log, error) {
	var logs []log.Log
	err := r.db.SelectContext(
		ctx,
		&logs,
		"SELECT * FROM logs WHERE tf_req_id=$1 ORDER BY timestamp",
		tfReqID,
	)
	return logs, err
}

func (r *LogRepo) GetTimelineEntries(ctx context.Context) ([]log.TimelineEntry, error) {
	var entries []log.TimelineEntry
	err := r.db.SelectContext(ctx, &entries, `
		SELECT tf_req_id, at_timestamp AS start, 
			   (at_timestamp + (tf_req_duration_ms || ' milliseconds')::interval) AS end, 
			   at_level AS status
		FROM logs
		WHERE tf_req_id IS NOT NULL
		ORDER BY at_timestamp
	`)
	return entries, err
}

func (r *LogRepo) GetMetrics(ctx context.Context) (log.Metrics, error) {
	var m log.Metrics
	m.Levels = make(map[string]int)

	// Count errors and warnings
	err := r.db.GetContext(ctx, &m.Errors, "SELECT COUNT(*) FROM logs WHERE at_level='error'")
	if err != nil {
		return m, err
	}
	err = r.db.GetContext(ctx, &m.Warnings, "SELECT COUNT(*) FROM logs WHERE at_level='warning'")
	if err != nil {
		return m, err
	}

	// Count logs grouped by level
	type LevelCount struct {
		Level string `db:"at_level"`
		Count int    `db:"count"`
	}
	var counts []LevelCount
	err = r.db.SelectContext(
		ctx,
		&counts,
		"SELECT at_level, COUNT(*) AS count FROM logs GROUP BY at_level",
	)
	if err != nil {
		return m, err
	}
	for _, c := range counts {
		m.Levels[c.Level] = c.Count
	}

	return m, nil
}

func (r *LogRepo) ExportLogs(ctx context.Context, filters log.ExportFilters) ([]byte, error) {
	logs, err := r.GetLogs(ctx, filters)
	if err != nil {
		return nil, err
	}
	return json.Marshal(logs)
}

func (r *LogRepo) SendExportToTelegram(
	ctx context.Context,
	chatID string,
	filters log.ExportFilters,
) error {
	return errors.New("unimplemented")
}
