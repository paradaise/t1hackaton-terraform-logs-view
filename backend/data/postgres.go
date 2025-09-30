package data

import (
	_ "embed"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
	"gitlab.com/paradaise1/t1-hackaton-terraform/config"
)

var database *sqlx.DB

//go:embed schema.sql
var schema []byte

func InitPostgres() error {
	conf := config.Get()
	db, err := sqlx.Open("postgres", conf.Postgres.Format())
	if err != nil {
		return err
	}
	if _, err := db.Exec(string(schema)); err != nil {
		return err
	}
	database = db
	return nil
}

func GetPostgres() *sqlx.DB {
	return database
}
