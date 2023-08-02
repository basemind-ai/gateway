package api

import (
	"github.com/basemind-ai/backend-services/services/api-gateway/utils"
	"github.com/gofiber/fiber/v2"
	"net/http"
)

type OAuthInitRequestBody struct {
	Provider string `json:"provider"`
}

type OAuthInitResponseBody struct {
	RedirectUrl string `json:"redirectUrl"`
}

const (
	GetTokenEndpoint = "/token"
)

func GetToken(ctx *fiber.Ctx) error {
	headers := ctx.GetReqHeaders()
	value, isSet := headers["Authentication"]

	if !isSet {
		return ctx.Status(http.StatusUnauthorized).SendString("missing firebase auth header")
	}

	firebaseAuth := utils.GetFirebaseAuth(ctx.UserContext())
	token, tokenErr := firebaseAuth.VerifyIDToken(ctx.UserContext(), value)

	if tokenErr != nil {
		return ctx.Status(http.StatusUnauthorized).SendString("invalid firebase auth header")
	}

}

func RegisterHandlers(app *fiber.App) {
	router := app.Group("/v1")

	router.Get(GetTokenEndpoint, GetToken)
}
