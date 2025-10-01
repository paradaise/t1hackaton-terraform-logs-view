package log

import (
	"bufio"
	"encoding/json"
	"io"

	"github.com/kaptinlin/jsonrepair"
)

type Log struct {
	Accept                                             string   `json:"Accept,omitempty"`
	Accept_Encoding                                    string   `json:"Accept-Encoding,omitempty"`
	Access_Control_Expose_Headers                      string   `json:"Access-Control-Expose-Headers,omitempty"`
	Address                                            string   `json:"address,omitempty"`
	Args                                               []string `json:"args,omitempty"`
	Cache_Control                                      any      `json:"Cache-Control,omitempty"`
	At_caller                                          string   `json:"@caller,omitempty"`
	Channel                                            string   `json:"channel,omitempty"`
	Connection                                         string   `json:"Connection,omitempty"`
	Content_Length                                     string   `json:"Content-Length,omitempty"`
	Content_Security_Policy                            string   `json:"Content-Security-Policy,omitempty"`
	Content_Type                                       string   `json:"Content-Type,omitempty"`
	Date                                               string   `json:"Date,omitempty"`
	Description                                        string   `json:"description,omitempty"`
	Diagnostic_attribute                               string   `json:"diagnostic_attribute,omitempty"`
	Diagnostic_detail                                  string   `json:"diagnostic_detail,omitempty"`
	Diagnostic_error_count                             int      `json:"diagnostic_error_count,omitempty"`
	Diagnostic_severity                                string   `json:"diagnostic_severity,omitempty"`
	Diagnostic_summary                                 string   `json:"diagnostic_summary,omitempty"`
	Diagnostic_warning_count                           int      `json:"diagnostic_warning_count,omitempty"`
	Err                                                string   `json:"err,omitempty"`
	Etag                                               string   `json:"Etag,omitempty"`
	Expires                                            string   `json:"Expires,omitempty"`
	EXTRA_VALUE_AT_END                                 string   `json:"EXTRA_VALUE_AT_END,omitempty"`
	Host                                               string   `json:"Host,omitempty"`
	Id                                                 string   `json:"id,omitempty"`
	Keep_Alive                                         string   `json:"Keep-Alive,omitempty"`
	Len                                                int      `json:"len,omitempty"`
	At_level                                           string   `json:"@level,omitempty"`
	Level                                              int      `json:"level,omitempty"`
	At_message                                         string   `json:"@message,omitempty"`
	At_module                                          string   `json:"@module,omitempty"`
	Network                                            string   `json:"network,omitempty"`
	Path                                               string   `json:"path,omitempty"`
	Permissions_Policy                                 string   `json:"Permissions-Policy,omitempty"`
	Pid                                                int      `json:"pid,omitempty"`
	Plugin                                             string   `json:"plugin,omitempty"`
	Pragma                                             string   `json:"Pragma,omitempty"`
	Referrer_Policy                                    string   `json:"Referrer-Policy,omitempty"`
	Server                                             string   `json:"Server,omitempty"`
	Set_Cookie                                         string   `json:"Set-Cookie,omitempty"`
	Strict_Transport_Security                          string   `json:"Strict-Transport-Security,omitempty"`
	Tf_attribute_path                                  string   `json:"tf_attribute_path,omitempty"`
	Tf_client_capability_deferral_allowed              bool     `json:"tf_client_capability_deferral_allowed,omitempty"`
	Tf_client_capability_write_only_attributes_allowed bool     `json:"tf_client_capability_write_only_attributes_allowed,omitempty"`
	Tf_data_source_type                                string   `json:"tf_data_source_type,omitempty"`
	Tf_http_op_type                                    string   `json:"tf_http_op_type,omitempty"`
	Tf_http_req_body                                   string   `json:"tf_http_req_body,omitempty"`
	Tf_http_req_method                                 string   `json:"tf_http_req_method,omitempty"`
	Tf_http_req_uri                                    string   `json:"tf_http_req_uri,omitempty"`
	Tf_http_req_version                                string   `json:"tf_http_req_version,omitempty"`
	Tf_http_res_body                                   string   `json:"tf_http_res_body,omitempty"`
	Tf_http_res_status_code                            int      `json:"tf_http_res_status_code,omitempty"`
	Tf_http_res_status_reason                          string   `json:"tf_http_res_status_reason,omitempty"`
	Tf_http_res_version                                string   `json:"tf_http_res_version,omitempty"`
	Tf_http_trans_id                                   string   `json:"tf_http_trans_id,omitempty"`
	Tf_proto_version                                   string   `json:"tf_proto_version,omitempty"`
	Tf_provider_addr                                   string   `json:"tf_provider_addr,omitempty"`
	Stdout                                             string   `json:"tf-registry.t1.cloud/t1cloud/t1cloud:stdout,omitempty"`
	Tf_req_duration_ms                                 int      `json:"tf_req_duration_ms,omitempty"`
	Tf_req_id                                          string   `json:"tf_req_id,omitempty"`
	Tf_resource_type                                   string   `json:"tf_resource_type,omitempty"`
	Tf_rpc                                             string   `json:"tf_rpc,omitempty"`
	Tf_server_capability_get_provider_schema_optional  bool     `json:"tf_server_capability_get_provider_schema_optional,omitempty"`
	Tf_server_capability_move_resource_state           bool     `json:"tf_server_capability_move_resource_state,omitempty"`
	Tf_server_capability_plan_destroy                  bool     `json:"tf_server_capability_plan_destroy,omitempty"`
	At_timestamp                                       string   `json:"@timestamp,omitempty"`
	Timestamp                                          string   `json:"timestamp,omitempty"`
	User_Agent                                         string   `json:"User-Agent,omitempty"`
	Vary                                               any      `json:"Vary,omitempty"`
	Version                                            int      `json:"version,omitempty"`
	Via                                                string   `json:"Via,omitempty"`
	X_Content_Type_Options                             string   `json:"X-Content-Type-Options,omitempty"`
	X_Frame_Options                                    string   `json:"X-Frame-Options,omitempty"`
	X_Kong_Proxy_Latency                               string   `json:"X-Kong-Proxy-Latency,omitempty"`
	X_Kong_Upstream_Latency                            string   `json:"X-Kong-Upstream-Latency,omitempty"`
	X_Request_Id                                       string   `json:"X-Request-Id,omitempty"`
	X_Runtime                                          string   `json:"X-Runtime,omitempty"`
	Read                                               bool     `json:"read"`
	Repaired                                           bool     `json:"repaired"`
}

func LoadLogs(r io.Reader) ([]Log, []string, error) {
	var corruptedLogs []string
	var logs []Log
	scan := bufio.NewScanner(r)
	for scan.Scan() {
		var log Log
		raw := scan.Bytes()
		if err := json.Unmarshal(raw, &log); err != nil {
			corruptedLogs = append(corruptedLogs, string(raw))
			fixed, err := jsonrepair.JSONRepair(string(raw))
			if err != nil {
				continue
			}
			json.Unmarshal([]byte(fixed), &log)
			log.Repaired = true
		}
		logs = append(logs, log)
	}
	return logs, corruptedLogs, nil
}
