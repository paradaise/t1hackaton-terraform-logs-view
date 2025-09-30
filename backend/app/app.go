package app

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"

	"gitlab.com/paradaise1/t1-hackaton-terraform/config"
)

func Run() error {
	conf, err := config.ReadConfig("appconfig.yml")
	if err != nil {
		fmt.Fprintf(os.Stderr, "%s\nusing default config\n", err.Error())
	}

	server := http.Server{
		Addr:    conf.Addr,
		Handler: NewRouter(),
	}
	slog.Info("server started", "addr", conf.Addr)
	return server.ListenAndServe()
}
