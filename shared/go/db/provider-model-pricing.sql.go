// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.23.0
// source: provider-model-pricing.sql

package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
)

const createProviderModelPricing = `-- name: CreateProviderModelPricing :one

INSERT INTO provider_model_pricing (
    model_type,
    model_vendor,
    input_token_price,
    output_token_price,
    token_unit_size,
    active_from_date,
    active_to_date
)
VALUES (
    $1,
    $2, $3, $4, $5, $6, $7
) RETURNING id, model_type, model_vendor, input_token_price, output_token_price, token_unit_size, created_at, active_from_date, active_to_date
`

type CreateProviderModelPricingParams struct {
	ModelType        ModelType      `json:"modelType"`
	ModelVendor      ModelVendor    `json:"modelVendor"`
	InputTokenPrice  pgtype.Numeric `json:"inputTokenPrice"`
	OutputTokenPrice pgtype.Numeric `json:"outputTokenPrice"`
	TokenUnitSize    int32          `json:"tokenUnitSize"`
	ActiveFromDate   pgtype.Date    `json:"activeFromDate"`
	ActiveToDate     pgtype.Date    `json:"activeToDate"`
}

// provider model pricing
func (q *Queries) CreateProviderModelPricing(ctx context.Context, arg CreateProviderModelPricingParams) (ProviderModelPricing, error) {
	row := q.db.QueryRow(ctx, createProviderModelPricing,
		arg.ModelType,
		arg.ModelVendor,
		arg.InputTokenPrice,
		arg.OutputTokenPrice,
		arg.TokenUnitSize,
		arg.ActiveFromDate,
		arg.ActiveToDate,
	)
	var i ProviderModelPricing
	err := row.Scan(
		&i.ID,
		&i.ModelType,
		&i.ModelVendor,
		&i.InputTokenPrice,
		&i.OutputTokenPrice,
		&i.TokenUnitSize,
		&i.CreatedAt,
		&i.ActiveFromDate,
		&i.ActiveToDate,
	)
	return i, err
}

const retrieveActiveProviderModelPricing = `-- name: RetrieveActiveProviderModelPricing :one
SELECT
    model_type,
    model_vendor,
    input_token_price,
    output_token_price,
    token_unit_size,
    active_from_date,
    active_to_date
FROM provider_model_pricing
WHERE
    model_type = $1
    AND model_vendor = $2
    AND active_from_date <= CURRENT_DATE
    AND active_to_date IS NULL OR active_to_date >= CURRENT_DATE
ORDER BY active_from_date DESC
LIMIT 1
`

type RetrieveActiveProviderModelPricingParams struct {
	ModelType   ModelType   `json:"modelType"`
	ModelVendor ModelVendor `json:"modelVendor"`
}

type RetrieveActiveProviderModelPricingRow struct {
	ModelType        ModelType      `json:"modelType"`
	ModelVendor      ModelVendor    `json:"modelVendor"`
	InputTokenPrice  pgtype.Numeric `json:"inputTokenPrice"`
	OutputTokenPrice pgtype.Numeric `json:"outputTokenPrice"`
	TokenUnitSize    int32          `json:"tokenUnitSize"`
	ActiveFromDate   pgtype.Date    `json:"activeFromDate"`
	ActiveToDate     pgtype.Date    `json:"activeToDate"`
}

func (q *Queries) RetrieveActiveProviderModelPricing(ctx context.Context, arg RetrieveActiveProviderModelPricingParams) (RetrieveActiveProviderModelPricingRow, error) {
	row := q.db.QueryRow(ctx, retrieveActiveProviderModelPricing, arg.ModelType, arg.ModelVendor)
	var i RetrieveActiveProviderModelPricingRow
	err := row.Scan(
		&i.ModelType,
		&i.ModelVendor,
		&i.InputTokenPrice,
		&i.OutputTokenPrice,
		&i.TokenUnitSize,
		&i.ActiveFromDate,
		&i.ActiveToDate,
	)
	return i, err
}
