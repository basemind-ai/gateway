package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
)

// handleRetrieveProjectInvitations - returns a slice of all project invitations.
func handleRetrieveProjectInvitations(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	projectInvitations := exc.MustResult(
		db.GetQueries().RetrieveProjectInvitations(r.Context(), projectID),
	)

	data := make([]dto.ProjectInvitationDTO, len(projectInvitations))
	for i, projectInvitation := range projectInvitations {
		invitationID := projectInvitation.ID
		data[i] = dto.ProjectInvitationDTO{
			ID:         db.UUIDToString(&invitationID),
			Email:      projectInvitation.Email,
			Permission: string(projectInvitation.Permission),
			CreatedAt:  projectInvitation.CreatedAt.Time,
			UpdatedAt:  projectInvitation.UpdatedAt.Time,
		}
	}

	serialization.RenderJSONResponse(w, http.StatusOK, data)
}

// handleDeleteProjectInvitation - deletes a project invitation by its ID.
func handleDeleteProjectInvitation(w http.ResponseWriter, r *http.Request) {
	invitationID := r.Context().Value(middleware.ProjectInvitationIDContextKey).(pgtype.UUID)

	exc.Must(db.GetQueries().DeleteProjectInvitation(r.Context(), invitationID))

	w.WriteHeader(http.StatusNoContent)
}
