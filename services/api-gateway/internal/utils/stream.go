package utils

import (
	"errors"
	"github.com/basemind-ai/monorepo/services/api-gateway/internal/dto"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
	"io"
	"strings"
	"time"
)

type Stream[T any] interface {
	Recv() (*T, error)
}

func StreamFromClient[T any]( //nolint: revive
	channel chan<- dto.PromptResultDTO,
	promptResult *dto.PromptResultDTO,
	recordParams *models.CreatePromptRequestRecordParams,
	startTime time.Time,
	stream Stream[T],
	parseMessage func(*T) string,
) string {
	var builder strings.Builder

	for {
		msg, receiveErr := stream.Recv()

		if receiveErr != nil {
			recordParams.FinishTime = pgtype.Timestamptz{Time: time.Now(), Valid: true}

			if !errors.Is(receiveErr, io.EOF) {
				log.Debug().Err(receiveErr).Msg("received stream error")
				promptResult.Error = receiveErr
			}

			break
		}

		if recordParams.DurationMs.Int32 == 0 {
			duration := int32(time.Until(startTime).Milliseconds())
			recordParams.DurationMs = pgtype.Int4{Int32: duration, Valid: true}
		}

		content := parseMessage(msg)

		exc.LogIfErr(exc.ReturnAnyErr(builder.WriteString(content)))
		channel <- dto.PromptResultDTO{Content: &content}
	}

	return builder.String()
}
