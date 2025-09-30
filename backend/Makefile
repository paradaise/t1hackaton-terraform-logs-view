.DEFAULT_GOAL := build

build:
	go mod tidy
	go mod download
	go build -o ./bin/server .
	if [ -f "appconfig.yml" ]; then cp appconfig.yml ./bin; fi

run: build
	./bin/server
