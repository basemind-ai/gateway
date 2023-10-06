package middleware

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
)

type PathUrlContextKeyType int

const (
	ProjectIdContextKey      PathUrlContextKeyType = iota
	ApplicationIdContextKey  PathUrlContextKeyType = iota
	UserIdContextKey         PathUrlContextKeyType = iota
	TokenIdContextKey        PathUrlContextKeyType = iota
	PromptConfigIdContextKey PathUrlContextKeyType = iota
)

var pathParameterNameToContextKeyMap = map[string]PathUrlContextKeyType{
	"projectId":      ProjectIdContextKey,
	"applicationId":  ApplicationIdContextKey,
	"userId":         UserIdContextKey,
	"tokenId":        TokenIdContextKey,
	"promptConfigId": PromptConfigIdContextKey,
}

func PathParameterMiddleware(parameterNames ...string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			parsedParameters := map[PathUrlContextKeyType]pgtype.UUID{}

			for _, parameterName := range parameterNames {
				contextKey, ok := pathParameterNameToContextKeyMap[parameterName]
				if !ok {
					panic("unknown parameter key supplied to middleware: " + parameterName)
				}

				param := chi.URLParam(r, parameterName)
				if param == "" {
					apierror.BadRequest("missing required parameter: "+parameterName).Render(w, r)
					return
				}

				uuidValue, parseErr := db.StringToUUID(param)
				if parseErr != nil {
					apierror.BadRequest("invalid path parameter: "+parameterName).Render(w, r)
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
