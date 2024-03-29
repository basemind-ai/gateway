package middleware

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
)

type PathURLContextKeyType int

const (
	APIKeyIDContextKey            PathURLContextKeyType = iota
	ApplicationIDContextKey       PathURLContextKeyType = iota
	ProjectIDContextKey           PathURLContextKeyType = iota
	ProjectInvitationIDContextKey PathURLContextKeyType = iota
	PromptConfigIDContextKey      PathURLContextKeyType = iota
	PromptTestRecordIDKey         PathURLContextKeyType = iota
	ProviderKeyIDContextKey       PathURLContextKeyType = iota
	UserIDContextKey              PathURLContextKeyType = iota
)

var pathParameterNameToContextKeyMap = map[string]PathURLContextKeyType{
	"apiKeyId":            APIKeyIDContextKey,
	"applicationId":       ApplicationIDContextKey,
	"projectId":           ProjectIDContextKey,
	"projectInvitationId": ProjectInvitationIDContextKey,
	"promptConfigId":      PromptConfigIDContextKey,
	"promptTestRecordId":  PromptTestRecordIDKey,
	"providerKeyId":       ProviderKeyIDContextKey,
	"userId":              UserIDContextKey,
}

// PathParameterMiddleware - middleware that parses path parameters and adds them to the request context.
func PathParameterMiddleware(parameterNames ...string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			parsedParameters := map[PathURLContextKeyType]pgtype.UUID{}

			for _, parameterName := range parameterNames {
				contextKey, ok := pathParameterNameToContextKeyMap[parameterName]
				if !ok {
					panic("unknown parameter key supplied to middleware: " + parameterName)
				}

				param := chi.URLParam(r, parameterName)
				if param == "" {
					apierror.BadRequest("missing required parameter: " + parameterName).Render(w)
					return
				}

				uuidValue, parseErr := db.StringToUUID(param)
				if parseErr != nil {
					apierror.BadRequest("invalid path parameter: " + parameterName).Render(w)
					return
				}

				parsedParameters[contextKey] = *uuidValue
			}

			ctx := r.Context()

			for contextKey, uuidValue := range parsedParameters {
				ctx = context.WithValue(ctx, contextKey, uuidValue)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
