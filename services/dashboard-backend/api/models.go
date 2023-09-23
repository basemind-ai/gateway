package api

import (
	db2 "github.com/basemind-ai/monorepo/shared/go/db"
)

type HandleDashboardUserPostLoginDTO struct {
	User     db2.User                      `json:"user"`
	Projects []db2.FindProjectsByUserIdRow `json:"projects"`
}
