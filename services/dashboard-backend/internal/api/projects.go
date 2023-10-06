package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/repositories"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
	"net/http"
)

// HandleCreateProject - creates a new project and sets the user as an ADMIN.
func HandleCreateProject(w http.ResponseWriter, r *http.Request) {
	firebaseId := r.Context().Value(middleware.FireBaseIdContextKey).(string)

	body := &dto.ProjectDTO{}
	if deserializationErr := serialization.DeserializeJson(r.Body, body); deserializationErr != nil {
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	if validationErr := validate.Struct(body); validationErr != nil {
		apierror.BadRequest(validationErr.Error()).Render(w, r)
		return
	}

	projectDto, createErr := repositories.CreateProject(
		r.Context(),
		firebaseId,
		body.Name,
		body.Description,
	)

	if createErr != nil {
		log.Error().Err(createErr).Msg("failed to create project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJsonResponse(w, http.StatusCreated, projectDto)
}

// HandleUpdateProject - allows updating the name and description of a project
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleUpdateProject(w http.ResponseWriter, r *http.Request) {
	projectId, uuidErr := db.StringToUUID(chi.URLParam(r, "projectId"))
	if uuidErr != nil {
		apierror.NotFound(InvalidProjectIdError).Render(w, r)
		return
	}

	body := &dto.ProjectDTO{}
	if deserializationErr := serialization.DeserializeJson(r.Body, body); deserializationErr != nil {
		apierror.BadRequest(InvalidRequestBodyError).Render(w, r)
		return
	}

	existingProject, retrivalErr := db.GetQueries().FindProjectById(r.Context(), *projectId)
	if retrivalErr != nil {
		log.Error().Err(retrivalErr).Msg("failed to retrieve project")
		apierror.BadRequest("project does not exist").Render(w, r)
		return
	}

	updateParams := db.UpdateProjectParams{
		ID:          *projectId,
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
		ID:                   db.UUIDToString(&updatedProject.ID),
		Name:                 updatedProject.Name,
		Description:          updatedProject.Description,
		CreatedAt:            updatedProject.CreatedAt.Time,
		UpdatedAt:            updatedProject.UpdatedAt.Time,
		IsUserDefaultProject: false,
		Permission:           "",
	}

	serialization.RenderJsonResponse(w, http.StatusOK, data)
}

// HandleDeleteProject - deletes a project and all associated applications by setting the deleted_at timestamp on these
// requires ADMIN permission, otherwise responds with status 403 FORBIDDEN.
func HandleDeleteProject(w http.ResponseWriter, r *http.Request) {
	projectId, uuidErr := db.StringToUUID(chi.URLParam(r, "projectId"))
	if uuidErr != nil {
		apierror.NotFound(InvalidProjectIdError).Render(w, r)
		return
	}

	if _, retrivalErr := db.GetQueries().FindProjectById(r.Context(), *projectId); retrivalErr != nil {
		log.Error().Err(retrivalErr).Msg("failed to retrieve project")
		apierror.BadRequest("project does not exist").Render(w, r)
		return
	}

	if deleteErr := repositories.DeleteProject(r.Context(), *projectId); deleteErr != nil {
		log.Error().Err(deleteErr).Msg("failed to delete project")
		apierror.InternalServerError().Render(w, r)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
