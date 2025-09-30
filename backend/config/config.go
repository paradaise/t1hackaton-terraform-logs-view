package config

import (
	"fmt"
	"os"

	"github.com/goccy/go-yaml"
)

var config Config

type PostgresConfig struct {
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	Addr     string `yaml:"addr"`
	Database string `yaml:"database"`
	SSLMode  string `yaml:"sslmode"`
}

func (c PostgresConfig) Format() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s/%s?sslmode=%s",
		c.User,
		c.Password,
		c.Addr,
		c.Database,
		c.SSLMode,
	)
}

type Config struct {
	Addr     string         `yaml:"addr"`
	Postgres PostgresConfig `yaml:"postgres"`
}

func getDefaultConfig() Config {
	return Config{
		Addr: "0.0.0.0:80",
		Postgres: PostgresConfig{
			User:     "postgres",
			Password: "",
			Addr:     "localhost:5432",
			Database: "logs_db",
			SSLMode:  "disable",
		},
	}
}

func ReadConfig(path string) (Config, error) {
	conf := getDefaultConfig()
	config = conf
	file, err := os.Open(path)
	if err != nil {
		return conf, err
	}
	if err = yaml.NewDecoder(file).Decode(&conf); err != nil {
		return conf, err
	}
	config = conf
	return conf, nil
}

func Get() Config {
	return config
}
