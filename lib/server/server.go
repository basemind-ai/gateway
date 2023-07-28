package server

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

type Options struct {
	Environment      string
	RegisterHandlers func(app *fiber.App)
}

func CreateServer(opts Options) *fiber.App {
	app := fiber.New(fiber.Config{
		Prefork: opts.Environment == "production",
	})

	if opts.Environment != "test" {
		app.Use(recover.New())
		app.Use(logger.New())
	}

	opts.RegisterHandlers(app)

	return app
}
