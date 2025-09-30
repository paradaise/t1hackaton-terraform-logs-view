FROM golang:1.25-alpine3.22

WORKDIR /app

RUN apk --update --no-cache add make curl
RUN go install github.com/air-verse/air@latest
COPY go.mod go.sum ./
RUN go mod download

CMD ["air", "-c", ".air.toml"]
