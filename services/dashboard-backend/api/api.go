package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/constants"
	"github.com/go-chi/chi/v5"
)

func RegisterHandlers(mux *chi.Mux) {
	mux.Route("/v1", func(r chi.Router) {
		r.Get(constants.DashboardLoginEndpoint, HandleDashboardUserPostLogin)
	})
}
