package db

import (
	"fmt"
	"github.com/jackc/pgx/v5/pgtype"
)

func StringToUUID(value string) (*pgtype.UUID, error) {
	uuid := &pgtype.UUID{}
	if scanErr := uuid.Scan(value); scanErr != nil {
		return nil, scanErr
	}
	return uuid, nil
}

func UUIDToString(value *pgtype.UUID) string {
	return fmt.Sprintf("%x-%x-%x-%x-%x", value.Bytes[0:4], value.Bytes[4:6], value.Bytes[6:8], value.Bytes[8:10], value.Bytes[10:16])
}
