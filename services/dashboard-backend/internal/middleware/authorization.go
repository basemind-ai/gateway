package middleware

import (
	"context"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
	"slices"
)

type authorizationContextKeyType int

const (
	UserProjectContextKey authorizationContextKeyType = iota
)

type MethodPermissionMap map[string][]models.AccessPermissionType

// AuthorizationMiddleware - middleware that checks if the user has the required permissions to access an endpoint.
func AuthorizationMiddleware(
	methodPermissionMap MethodPermissionMap,
) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			method := r.Method
			if method == "" { // skipcq: TCV-001
				// r.Method may be an empty string for GET requests,
				// its an edge case we need to guard for but not reproduce in tests
				method = http.MethodGet
			}

			if permissions, ok := methodPermissionMap[method]; ok {
				userAccount := r.Context().Value(UserAccountContextKey).(*models.UserAccount)
				projectID := r.Context().Value(ProjectIDContextKey).(pgtype.UUID)

				userProject, retrievalErr := db.
					GetQueries().
					RetrieveUserProject(r.Context(), models.RetrieveUserProjectParams{
						ProjectID:  projectID,
						FirebaseID: userAccount.FirebaseID,
					})

				if retrievalErr != nil {
					apierror.Forbidden("user does not have access to this project").Render(w)
					return
				}

				if !slices.Contains(permissions, userProject.Permission) {
					apierror.Unauthorized("insufficient permissions").Render(w)
				}

				ctx = context.WithValue(r.Context(), UserProjectContextKey, userProject)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
