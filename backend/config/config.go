package config

import (
	"os"

	"github.com/goccy/go-yaml"
)

var config Config

type Config struct {
	Addr string `yaml:"addr"`
}

func getDefaultConfig() Config {
	return Config{
		Addr: "0.0.0.0:80",
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
