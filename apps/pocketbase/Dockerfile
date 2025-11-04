FROM golang:alpine as builder

RUN mkdir -p /bptimer
WORKDIR /bptimer

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .

WORKDIR /bptimer/apps/pocketbase
RUN go build -o /bptimer/pocketbase .

FROM alpine:3
RUN apk update && apk add ca-certificates && rm -rf /var/cache/apk/*

COPY ./apps/pocketbase/pb_migrations /pb_migrations

EXPOSE 8090

COPY --from=builder /bptimer/pocketbase /usr/local/bin/pocketbase
ENTRYPOINT ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data", "--migrationsDir=/pb_migrations", "--publicDir=/pb_public", "--hooksDir=/pb_hooks"]
