package repositories

import (
	"context"
	"fmt"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/config"
	"github.com/basemind-ai/monorepo/shared/go/cryptoutils"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/jackc/pgx/v5/pgtype"
)

// CreateProviderKey - creates a new provider key for the given combination of projectID and model vendor.
// The api key is encrypted before being saved in the DB.
// Note: the combination of projectID and modelVendor is unique and will raise an error on duplication.
func CreateProviderKey(
	ctx context.Context,
	projectID pgtype.UUID,
	data dto.ProviderKeyCreateDTO,
) (*dto.ProviderKeyDTO, error) {
	cfg := config.Get(ctx)

	encryptedKey := cryptoutils.Encrypt(data.Key, cfg.CryptoPassKey)

	result, err := db.GetQueries().CreateProviderKey(ctx, models.CreateProviderKeyParams{
		ProjectID:   projectID,
		ApiKey:      encryptedKey,
		ModelVendor: data.ModelVendor,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create provider key: %w", err)
	}

	return &dto.ProviderKeyDTO{
		ID:          db.UUIDToString(&result.ID),
		ModelVendor: result.ModelVendor,
		CreatedAt:   result.CreatedAt.Time,
	}, nil
}
