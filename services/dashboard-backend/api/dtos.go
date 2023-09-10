package api

import "github.com/basemind-ai/monorepo/shared/go/db"

type HandleDashboardUserPostLoginDTO struct {
	User     db.User                      `json:"user"`
	Projects []db.FindProjectsByUserIdRow `json:"projects"`
}
