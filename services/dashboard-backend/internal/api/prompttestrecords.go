package api

import (
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/ptr"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"github.com/jackc/pgx/v5/pgtype"
	"net/http"
)

// handleRetrievePromptTestRecords - retrieves all prompt test records for the given application.
func handleRetrievePromptTestRecords(w http.ResponseWriter, r *http.Request) {
	applicationID := r.Context().Value(middleware.ApplicationIDContextKey).(pgtype.UUID)

	records := exc.MustResult(db.GetQueries().RetrievePromptTestRecords(r.Context(), applicationID))

	data := make([]*dto.PromptTestRecordDTO, len(records))

	for i, record := range records {
		var promptConfigID *string
		if !record.IsTestConfig.Bool {
			promptConfigID = ptr.To(db.UUIDToString(ptr.To(record.PromptConfigID)))
		}

		requestTokensCost := exc.MustResult(db.NumericToDecimal(record.RequestTokensCost))
		responseTokensCost := exc.MustResult(db.NumericToDecimal(record.ResponseTokensCost))
		totalTokensCost := requestTokensCost.Add(*responseTokensCost)

		data[i] = &dto.PromptTestRecordDTO{
			ID:                     db.UUIDToString(ptr.To(record.ID)),
			CreatedAt:              record.CreatedAt.Time,
			ErrorLog:               ptr.To(record.ErrorLog.String),
			FinishTime:             record.FinishTime.Time,
			ModelParameters:        record.ModelParameters,
			ModelType:              record.ModelType.ModelType,
			ModelVendor:            record.ModelVendor.ModelVendor,
			PromptConfigID:         promptConfigID,
			PromptResponse:         record.Response,
			ProviderPromptMessages: record.ProviderPromptMessages,
			RequestTokens:          record.RequestTokens.Int32,
			ResponseTokens:         record.ResponseTokens.Int32,
			StartTime:              record.StartTime.Time,
			DurationMs:             record.DurationMs.Int32,
			UserInput:              record.VariableValues,
			RequestTokensCost:      *requestTokensCost,
			ResponseTokensCost:     *responseTokensCost,
			TotalTokensCost:        totalTokensCost,
		}
	}

	serialization.RenderJSONResponse(w, http.StatusOK, data)
}

// handleRetrievePromptTestRecord - retrieves a single prompt test record by its ID.
func handleRetrievePromptTestRecord(w http.ResponseWriter, r *http.Request) {
	testRecordID := r.Context().Value(middleware.PromptTestRecordIDKey).(pgtype.UUID)

	record, retrievalErr := db.GetQueries().RetrievePromptTestRecord(r.Context(), testRecordID)
	if retrievalErr != nil {
		apierror.BadRequest("test record does not exist").Render(w)
		return
	}

	var promptConfigID *string
	if !record.IsTestConfig.Bool {
		promptConfigID = ptr.To(db.UUIDToString(&record.PromptConfigID))
	}

	requestTokensCost := exc.MustResult(db.NumericToDecimal(record.RequestTokensCost))
	responseTokensCost := exc.MustResult(db.NumericToDecimal(record.ResponseTokensCost))

	serialization.RenderJSONResponse(w, http.StatusOK, &dto.PromptTestRecordDTO{
		ID:                     db.UUIDToString(&record.ID),
		CreatedAt:              record.CreatedAt.Time,
		ErrorLog:               ptr.To(record.ErrorLog.String),
		FinishTime:             record.FinishTime.Time,
		ModelParameters:        record.ModelParameters,
		ModelType:              record.ModelType.ModelType,
		ModelVendor:            record.ModelVendor.ModelVendor,
		PromptConfigID:         promptConfigID,
		PromptResponse:         record.Response,
		ProviderPromptMessages: record.ProviderPromptMessages,
		RequestTokens:          record.RequestTokens.Int32,
		ResponseTokens:         record.ResponseTokens.Int32,
		StartTime:              record.StartTime.Time,
		DurationMs:             record.DurationMs.Int32,
		RequestTokensCost:      *requestTokensCost,
		ResponseTokensCost:     *responseTokensCost,
		UserInput:              record.VariableValues,
	})
}

// handleDeletePromptTestRecord - deletes a prompt test record by its ID.
func handleDeletePromptTestRecord(w http.ResponseWriter, r *http.Request) {
	testRecordID := r.Context().Value(middleware.PromptTestRecordIDKey).(pgtype.UUID)

	exc.Must(db.GetQueries().DeletePromptTestRecord(r.Context(), testRecordID))

	w.WriteHeader(http.StatusNoContent)
}
