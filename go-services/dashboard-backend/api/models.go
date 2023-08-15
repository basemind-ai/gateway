package api

import "github.com/basemind-ai/monorepo/go-shared/db"

type HandleDashboardUserPostLoginDTO struct {
	User     db.User                      `json:"user"`
	Projects []db.FindProjectsByUserIdRow `json:"projects"`
}
