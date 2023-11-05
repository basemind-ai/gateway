package api

import (
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"net/http"
	"time"

	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/basemind-ai/monorepo/shared/go/timeutils"
	"github.com/jackc/pgx/v5/pgtype"
)

// handleCreateProject - creates a new project and sets the user as an ADMIN.
func handleCreateProject(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)

	body := &dto.ProjectDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, body); deserializationErr != nil {
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if validationErr := validate.Struct(body); validationErr != nil {
		apierror.BadRequest(validationErr.Error()).Render(w)
		return
	}

	projectDto := exc.MustResult(repositories.CreateProject(
		r.Context(),
		userAccount,
		body.Name,
		body.Description,
	))

	serialization.RenderJSONResponse(w, http.StatusCreated, projectDto)
}

// handleRetrieveProjects - retrieves all projects for the user.
func handleRetrieveProjects(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)
	projects := exc.MustResult(
		db.GetQueries().RetrieveProjects(r.Context(), userAccount.FirebaseID),
	)

	data := make([]dto.ProjectDTO, len(projects))
	for i, project := range projects {
		id := project.ID
		data[i] = dto.ProjectDTO{
			ID:          db.UUIDToString(&id),
			Name:        project.Name.String,
			Description: project.Description.String,
			CreatedAt:   project.CreatedAt.Time,
			UpdatedAt:   project.UpdatedAt.Time,
			Permission:  string(project.Permission),
		}
	}
	serialization.RenderJSONResponse(w, http.StatusOK, data)
}

// handleUpdateProject - allows updating the name and description of a project.
func handleUpdateProject(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)
	userProject := r.Context().Value(middleware.UserProjectContextKey).(models.UserProject)

	body := &dto.ProjectDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, body); deserializationErr != nil {
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	existingProject := exc.MustResult(db.
		GetQueries().
		RetrieveProjectForUser(r.Context(), models.RetrieveProjectForUserParams{
			ID:         projectID,
			FirebaseID: userAccount.FirebaseID,
		}))

	updateParams := models.UpdateProjectParams{
		ID:          projectID,
		Name:        existingProject.Name,
		Description: existingProject.Description,
	}

	if body.Name != "" {
		updateParams.Name = body.Name
	}

	if body.Description != "" {
		updateParams.Description = body.Description
	}

	updatedProject := exc.MustResult(db.GetQueries().UpdateProject(r.Context(), updateParams))

	data := &dto.ProjectDTO{
		ID:          db.UUIDToString(&updatedProject.ID),
		Name:        updatedProject.Name,
		Description: updatedProject.Description,
		CreatedAt:   updatedProject.CreatedAt.Time,
		UpdatedAt:   updatedProject.UpdatedAt.Time,
		Permission:  string(userProject.Permission),
	}

	serialization.RenderJSONResponse(w, http.StatusOK, data)
}

// handleDeleteProject - deletes a project and all associated applications by setting the deleted_at timestamp on these.
func handleDeleteProject(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	_ = exc.MustResult(
		db.GetQueries().RetrieveProjectForUser(r.Context(), models.RetrieveProjectForUserParams{
			ID:         projectID,
			FirebaseID: userAccount.FirebaseID,
		}),
	)

	exc.Must(repositories.DeleteProject(r.Context(), projectID))
	w.WriteHeader(http.StatusNoContent)
}

// handleRetrieveProjectAnalytics - retrieves the analytics for a project.
// The analytics includes the total API calls and model costs for all the applications in the project.
func handleRetrieveProjectAnalytics(w http.ResponseWriter, r *http.Request) {
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	toDate := timeutils.ParseDate(r.URL.Query().Get("toDate"), time.Now())
	fromDate := timeutils.ParseDate(r.URL.Query().Get("fromDate"), timeutils.GetFirstDayOfMonth())

	projectAnalytics := repositories.GetProjectAnalyticsByDateRange(
		r.Context(),
		projectID,
		fromDate,
		toDate,
	)

	w.WriteHeader(http.StatusOK)
	serialization.RenderJSONResponse(w, http.StatusOK, projectAnalytics)
}
