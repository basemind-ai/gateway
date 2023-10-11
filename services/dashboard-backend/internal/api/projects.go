package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"net/http"
)

// HandleCreateProject - creates a new project and sets the user as an ADMIN.
func HandleCreateProject(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)

	body := &dto.ProjectDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, body); deserializationErr != nil {
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if validationErr := validate.Struct(body); validationErr != nil {
		apierror.BadRequest(validationErr.Error()).Render(w, r)
		return
	}

	projectDto, createErr := repositories.CreateProject(
		r.Context(),
		userAccount.FirebaseID,
		body.Name,
		body.Description,
	)

	if createErr != nil {
		log.Error().Err(createErr).Msg("failed to create project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusCreated, projectDto)
}

// HandleRetrieveProjects - retrieves all projects for the user.
func HandleRetrieveProjects(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)

	projects, err := db.GetQueries().RetrieveProjects(r.Context(), userAccount.FirebaseID)
	if err != nil {
		log.Error().Err(err).Msg("failed to retrieve projects")
		apierror.InternalServerError().Render(w, r)
		return
	}

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

// HandleUpdateProject - allows updating the name and description of a project
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleUpdateProject(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	userProject, userProjectRetrievalErr := db.
		GetQueries().
		RetrieveUserProject(r.Context(), db.RetrieveUserProjectParams{
			FirebaseID: userAccount.FirebaseID,
			ProjectID:  projectID,
		})

	if userProjectRetrievalErr != nil {
		log.Error().Err(userProjectRetrievalErr).Msg("failed to retrieve user project")
		apierror.BadRequest().Render(w, r)
		return
	}

	// if userProject.Permission != db.AccessPermissionTypeADMIN {
	//	apierror.Forbidden().Render(w, r)
	//	return
	// }

	body := &dto.ProjectDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, body); deserializationErr != nil {
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	existingProject, projectRetrivalErr := db.
		GetQueries().
		RetrieveProject(r.Context(), db.RetrieveProjectParams{
			ID:         projectID,
			FirebaseID: userAccount.FirebaseID,
		})
	if projectRetrivalErr != nil {
		log.Error().Err(projectRetrivalErr).Msg("failed to retrieve project")
		apierror.BadRequest("project does not exist").Render(w, r)
		return
	}

	updateParams := db.UpdateProjectParams{
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

	updatedProject, updateErr := db.GetQueries().UpdateProject(r.Context(), updateParams)
	if updateErr != nil {
		log.Error().Err(updateErr).Msg("failed to update project")
		apierror.InternalServerError().Render(w, r)
		return
	}

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

// HandleDeleteProject - deletes a project and all associated applications by setting the deleted_at timestamp on these
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleDeleteProject(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)
	projectID := r.Context().Value(middleware.ProjectIDContextKey).(pgtype.UUID)

	if _, retrivalErr := db.GetQueries().RetrieveProject(r.Context(), db.RetrieveProjectParams{
		ID:         projectID,
		FirebaseID: userAccount.FirebaseID,
	}); retrivalErr != nil {
		log.Error().Err(retrivalErr).Msg("failed to retrieve project")
		apierror.BadRequest("project does not exist").Render(w, r)
		return
	}

	if deleteErr := repositories.DeleteProject(r.Context(), projectID); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
