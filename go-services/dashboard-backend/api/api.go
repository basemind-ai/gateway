package api

import (
	"github.com/basemind-ai/monorepo/go-services/dashboard-backend/config"
	"github.com/basemind-ai/monorepo/go-services/dashboard-backend/constants"
	"github.com/basemind-ai/monorepo/go-shared/apierror"
	"github.com/basemind-ai/monorepo/go-shared/db"
	"github.com/basemind-ai/monorepo/go-shared/serialization"
	"github.com/rs/zerolog/log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func HandleDashboardUserPostLogin(w http.ResponseWriter, r *http.Request) {
	firebaseId := r.Context().Value(constants.FireBaseIdContextKey).(string)

	if userExists, queryErr := db.GetQueries().CheckUserExists(r.Context(), firebaseId); queryErr != nil {
		log.Error().Err(queryErr).Msg("failed to retrieve user")
		_ = apierror.InternalServerError().Render(w, r)
	} else if !userExists {
		user, queryErr := db.GetQueries().CreateUser(r.Context(), firebaseId)
		if queryErr != nil {
			log.Error().Err(queryErr).Msg("failed to create user")
			_ = apierror.InternalServerError().Render(w, r)
			return
		}

		project, queryErr := db.GetQueries().CreateProject(r.Context(), db.CreateProjectParams{Name: "Default Project", Description: "Default Project"})
		if queryErr != nil {
			log.Error().Err(queryErr).Msg("failed to create project")
			_ = apierror.InternalServerError().Render(w, r)
			return
		}

		userProject, queryErr := db.GetQueries().CreateUserProject(r.Context(), db.CreateUserProjectParams{
			UserID:               user.ID,
			ProjectID:            project.ID,
			Permission:           db.AccessPermissionTypeADMIN,
			IsUserDefaultProject: true,
		})
		if queryErr != nil {
			log.Error().Err(queryErr).Msg("failed to create user project mapping")
			_ = apierror.InternalServerError().Render(w, r)
			return
		}

		var userProjects = []db.FindProjectsByUserIdRow{{
			ID:                   project.ID,
			CreatedAt:            project.CreatedAt,
			Name:                 project.Name,
			Description:          project.Description,
			Permission:           userProject.Permission,
			IsUserDefaultProject: userProject.IsUserDefaultProject,
		}}

		responseDTO := HandleDashboardUserPostLoginDTO{User: user, Projects: userProjects}

		_ = serialization.RenderJsonResponse(w, http.StatusCreated, responseDTO)
	} else {
		user, queryErr := db.GetQueries().FindUserByFirebaseId(r.Context(), firebaseId)
		if queryErr != nil {
			log.Error().Err(queryErr).Msg("failed to find user")
			_ = apierror.InternalServerError().Render(w, r)
			return
		}

		userProjects, queryErr := db.GetQueries().FindProjectsByUserId(r.Context(), user.ID)
		if queryErr != nil {
			log.Error().Err(queryErr).Msg("failed to find user projects")
			_ = apierror.InternalServerError().Render(w, r)
			return
		}

		responseDTO := HandleDashboardUserPostLoginDTO{User: user, Projects: userProjects}

		_ = serialization.RenderJsonResponse(w, http.StatusOK, responseDTO)
	}
}

func RegisterHandlers(mux *chi.Mux, _ config.Config) {
	mux.Route("/v1", func(r chi.Router) {
		r.Get(constants.DashboardLoginEndpoint, HandleDashboardUserPostLogin)
	})
}
