FROM golang:1.21 AS build
WORKDIR /go/src/app
ARG BUILD_TARGET
COPY go.mod go.sum ./
RUN go mod download
COPY lib lib
COPY services/$BUILD_TARGET services/$BUILD_TARGET
RUN CGO_ENABLED=0 go build -o /go/bin/app github.com/basemind-ai/backend-services/services/$BUILD_TARGET
RUN chmod +x /go/bin/app

FROM gcr.io/distroless/static-debian11
COPY --from=build /go/bin/app /
CMD ["/app"]
