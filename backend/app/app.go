package app

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"gitlab.com/paradaise1/t1-hackaton-terraform/config"
	"gitlab.com/paradaise1/t1-hackaton-terraform/data"
)

func Run() error {
	conf, err := config.ReadConfig("appconfig.yml")
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\nusing default config\n", err.Error())
	}

	if err := data.InitPostgres(); err != nil {
		panic(err)
	}

	server := http.Server{
		Addr:    conf.Addr,
		Handler: NewRouter(),
	}
	slog.Info("server started", "addr", conf.Addr)
	return server.ListenAndServe()
}
