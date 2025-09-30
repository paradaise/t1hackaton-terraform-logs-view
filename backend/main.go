package main

import (
	"gitlab.com/paradaise1/t1-hackaton-terraform/app"
)

func main() {
	if err := app.Run(); err != nil {
		panic(err)
	}
}
