package repos

import (
	"context"
	"encoding/json"
	"errors"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
	"gitlab.com/paradaise1/t1-hackaton-terraform/domain/log"
)

func setupMockDB(t *testing.T) (*LogRepo, sqlmock.Sqlmock, func()) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to open sqlmock database: %v", err)
	}

	sqlxDB := sqlx.NewDb(db, "sqlmock")
	repo := &LogRepo{db: sqlxDB}

	return repo, mock, func() {
		sqlxDB.Close()
	}
}

func TestGetLogByID_Success(t *testing.T) {
	repo, mock, close := setupMockDB(t)
	defer close()

	expectedLog := log.Log{Id: "1234", Accept: "application/json"}

	columns := []string{"id", "Accept"}
	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM logs WHERE id=$1")).
		WithArgs(expectedLog.Id).
		WillReturnRows(sqlmock.NewRows(columns).AddRow(expectedLog.Id, expectedLog.Accept))

	log, err := repo.GetLogByID(context.Background(), expectedLog.Id)

	assert.NoError(t, err)
	assert.Equal(t, expectedLog.Id, log.Id)
	assert.Equal(t, expectedLog.Accept, log.Accept)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetLogByID_NotFound(t *testing.T) {
	repo, mock, close := setupMockDB(t)
	defer close()

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM logs WHERE id=$1")).
		WithArgs("nonexistent").
		WillReturnError(errors.New("sql: no rows in result set"))

	_, err := repo.GetLogByID(context.Background(), "nonexistent")

	assert.Error(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestMarkLogsRead_Success(t *testing.T) {
	repo, mock, close := setupMockDB(t)
	defer close()

	ids := []string{"1", "2"}
	mock.ExpectExec(regexp.QuoteMeta("UPDATE logs SET read = TRUE WHERE id = ANY($1)")).
		WithArgs(ids).
		WillReturnResult(sqlmock.NewResult(2, 2))

	err := repo.MarkLogsRead(context.Background(), ids)

	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestGetLogs_Success(t *testing.T) {
	repo, mock, close := setupMockDB(t)
	defer close()

	filters := log.ExportFilters{
		TFResourceType: "val",
		Level:          "error",
		Search:         "query",
		Page:           1,
		Limit:          2,
	}

	columns := []string{"id", "tf_resource_type", "@level", "description", "err", "timestamp"}
	rows := sqlmock.NewRows(columns).
		AddRow("id1", "val", "error", "desc1", "err1", "2025-09-10T10:00:00Z").
		AddRow("id2", "val", "error", "desc2", "err2", "2025-09-11T10:00:00Z")

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM logs WHERE 1=1 AND tf_resource_type = $1 AND at_level = $2 AND (description ILIKE $3 OR err ILIKE $4) ORDER BY timestamp DESC LIMIT $5 OFFSET $6")).
		WithArgs(filters.TFResourceType, filters.Level, "%query%", "%query%", 2, 0).
		WillReturnRows(rows)

	logs, err := repo.GetLogs(context.Background(), filters)

	assert.NoError(t, err)
	assert.Len(t, logs, 2)
	assert.Equal(t, "id1", logs[0].Id)
	assert.Equal(t, "id2", logs[1].Id)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestExportLogs_Success(t *testing.T) {
	repo, mock, close := setupMockDB(t)
	defer close()

	filters := log.ExportFilters{}

	columns := []string{"id"}
	rows := sqlmock.NewRows(columns).AddRow("id1")

	mock.ExpectQuery(regexp.QuoteMeta("SELECT * FROM logs WHERE 1=1 ORDER BY timestamp DESC LIMIT $1 OFFSET $2")).
		WithArgs(50, 0).
		WillReturnRows(rows)

	bytes, err := repo.ExportLogs(context.Background(), filters)

	assert.NoError(t, err)
	assert.JSONEq(t, `[{"id":"id1"}]`, string(bytes))
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUploadFile_Success(t *testing.T) {
	repo, mock, close := setupMockDB(t)
	defer close()

	logs := []log.Log{
		{Id: "id1", Accept: "text/html"},
		{Id: "id2", Accept: "application/json"},
	}
	fileData, _ := json.Marshal(logs)

	mock.ExpectBegin()
	for range logs {
		mock.ExpectExec(regexp.QuoteMeta("INSERT INTO logs")).
			WithArgs(
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(),
				sqlmock.AnyArg(), sqlmock.AnyArg(),
			).
			WillReturnResult(sqlmock.NewResult(1, 1))
	}
	mock.ExpectCommit()

	result, err := repo.UploadFile(context.Background(), fileData, "file.json")

	assert.NoError(t, err)
	assert.Equal(t, "file_uuid", result.ID)
	assert.Equal(t, "parsed", result.Status)
	assert.NoError(t, mock.ExpectationsWereMet())
}
