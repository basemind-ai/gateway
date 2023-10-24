package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/jwtutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"time"
)

// handleRetrieveProjectOTP - create a new project otp.
// The OTP can be used to access websocket connections.
func handleRetrieveProjectOTP(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*db.UserAccount)
	cfg := config.Get(r.Context())
	jwt := exc.MustResult(
		jwtutils.CreateJWT(time.Minute, []byte(cfg.JWTSecret), userAccount.FirebaseID),
	)
	serialization.RenderJSONResponse(w, http.StatusOK, dto.OtpDTO{OTP: jwt})
}
