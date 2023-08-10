package api

import (
	"net/http"

	"github.com/basemind-ai/backend-services/db"
	"github.com/basemind-ai/backend-services/services/dashboard-backend/config"
	"github.com/basemind-ai/backend-services/services/dashboard-backend/constants"
	"github.com/go-chi/chi/v5"
)

func HandleDashboardUserPostLogin(w http.ResponseWriter, r *http.Request) {
	firebaseId := r.Context().Value(constants.FireBaseIdContextKey).(string)

	if userExists, queryErr := db.GetQueries().CheckUserExists(r.Context(), firebaseId); queryErr != nil {
		// respond with internal server error
		panic("not implemented")
	} else if !userExists {
		// insert a new user here and create a default project for the user connected with an owner level permission
		// response with the user (DB id, project and project permission)
		panic("not implemented")
	} else {
		// retrieve the user and project from the db and return them as a response
		panic("not implemented")
	}
}

func RegisterHandlers(mux *chi.Mux, _ config.Config) {
	mux.Route("/v1", func(r chi.Router) {
		r.Get(constants.DashboardLoginEndpoint, HandleDashboardUserPostLogin)
	})
}
