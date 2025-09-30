package config

import "testing"

func TestPostgresConnectionStringFormat(t *testing.T) {
	s := getDefaultConfig().Postgres.Format()
	if s != "postgres://postgres:@localhost:5432/logs_db?ssl_mode=disable" {
		t.Errorf("%s doesn't match expected string", s)
	}
}
