package db

import (
	"github.com/jackc/pgx/v5/pgtype"
)

func CreateUUIDFromString(value string) (*pgtype.UUID, error) {
	uuid := &pgtype.UUID{}
	if scanErr := uuid.Scan(value); scanErr != nil {
		return nil, scanErr
	}
	return uuid, nil
}
