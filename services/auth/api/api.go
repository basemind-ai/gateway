package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/basemind-ai/backend-services/lib/cache"
	"github.com/basemind-ai/backend-services/services/auth/providers"
	"github.com/basemind-ai/backend-services/services/auth/utils"
	"github.com/rs/zerolog/log"
)

type OAuthInitRequestBody struct {
	Provider string `json:"provider"`
}

type OAuthInitResponseBody struct {
	RedirectUrl string `json:"redirectUrl"`
}

const (
	InitAuthPath      = "/oauth/:provider/init/"
	OAuthCallbackPath = "/oauth/:provider/callback/"
)

func InitOAuth(ctx *fiber.Ctx) error {
	provider := ctx.Params("provider")

	conf, providerErr := providers.GetProvider(ctx.UserContext(), provider)
	if providerErr != nil {
		log.Error().Err(providerErr).Str("provider", provider).Msg("unrecognized provider requested")
		return ctx.Status(http.StatusBadRequest).SendString(fmt.Sprintf("unsupported provider %v", provider))
	}
	log.Info().Str("redirect-url", conf.RedirectURL).Msg("using redirect-url")
	state := utils.CreateStateString()

	cacheErr := cache.Get().Set(ctx.UserContext(), state, state, 10*time.Second).Err()

	if cacheErr != nil {
		log.Error().Err(cacheErr).Msg("failed to cache data in redis")
		return ctx.Status(http.StatusInternalServerError).SendString("failed to cache state")
	}

	return ctx.Redirect(conf.AuthCodeURL(state), http.StatusTemporaryRedirect)
}

func OAuthCallback(ctx *fiber.Ctx) error {
	provider := ctx.Params("provider")
	conf, providerErr := providers.GetProvider(ctx.UserContext(), provider)
	if providerErr != nil {
		log.Error().Err(providerErr).Str("provider", provider).Msg("unrecognized provider requested")
		return ctx.Status(http.StatusBadRequest).SendString(fmt.Sprintf("unsupported provider %v", provider))
	}

	state, code := ctx.FormValue("state"), ctx.FormValue("code")

	log.Debug().Str("state", state).Str("code", code).Str("provider", provider).Msg("received oauth callback")

	defer func() {
		_ = cache.Get().Del(ctx.UserContext(), state)
	}()

	cacheErr := cache.Get().Get(ctx.UserContext(), state).Err()
	if cacheErr != nil {
		log.Error().Err(cacheErr).Str("state", state).Msg("failed to retrieve cached data")
		return ctx.Status(http.StatusUnauthorized).SendString("state validation failed")
	}

	token, err := conf.Exchange(ctx.UserContext(), code)
	if err != nil {
		log.Error().Err(err).Msg("failed to retrieve auth token from provider")
		return ctx.Status(http.StatusUnauthorized).SendString("token retrieval failed")
	}

	if !token.Valid() {
		log.Error().Str("token", token.AccessToken).Msg("invalid token")
		return ctx.Status(http.StatusUnauthorized).SendString("token is invalid")
	}

	userData, getUserErr := providers.GetUserData(ctx.UserContext(), token, provider)
	if getUserErr != nil {
		log.Error().Err(getUserErr).Msg("failed to retrieve user from provider")
		return ctx.Status(http.StatusUnauthorized).SendString("user retrieval failed")
	}

	return ctx.Status(http.StatusOK).JSON(userData)
}

func RegisterHandlers(app *fiber.App) {
	router := app.Group("/v1")

	router.Get(InitAuthPath, InitOAuth)
	router.Get(OAuthCallbackPath, OAuthCallback)
}
