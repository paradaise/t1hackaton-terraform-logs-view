FROM golang:1.25-alpine3.22 AS builder

WORKDIR /app
COPY . .
RUN apk add --no-cache make
RUN make

FROM alpine:3.22

WORKDIR /app
COPY --from=builder /app/bin/ /app/
RUN apk add --no-cache curl
EXPOSE 8080
ENTRYPOINT [ "/app/server" ]
