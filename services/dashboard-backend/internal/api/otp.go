package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/rs/zerolog/log"
	"net/http"
	"time"
)

// handleRetrieveProjectOTP - create a new project otp.
// The OTP can be used to access websocket connections.
func handleRetrieveProjectOTP(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)

	cfg, configErr := config.Get(r.Context())
	if configErr != nil {
		log.Error().Err(configErr).Msg("failed to retrieve config")
		apierror.InternalServerError().Render(w, r)
		return
	}
	jwt, jwtErr := jwtutils.CreateJWT(time.Minute, []byte(cfg.JWTSecret), userAccount.FirebaseID)
	if jwtErr != nil {
		log.Error().Err(jwtErr).Msg("failed to create jwt")
		apierror.InternalServerError().Render(w, r)
		return
	}

	serialization.RenderJSONResponse(w, http.StatusCreated, dto.OtpDTO{OTP: jwt})
}
