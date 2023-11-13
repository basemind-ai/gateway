package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
)

func handleRetrievePromptTestRecords(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

}
