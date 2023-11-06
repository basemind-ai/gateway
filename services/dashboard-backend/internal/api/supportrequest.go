package api

import (
	"cloud.google.com/go/pubsub"
	"context"
	"encoding/json"
	"github.com/basemind-ai/monorepo/cloud-functions/emailsender"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/pubsubutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
	"time"
)

func handleSupportEmailRequest(w http.ResponseWriter, r *http.Request) {
	userAccount := r.Context().Value(middleware.UserAccountContextKey).(*models.UserAccount)

	data := &dto.SupportRequestDTO{}
	if deserializationErr := serialization.DeserializeJSON(r.Body, data); deserializationErr != nil {
		apierror.BadRequest(invalidRequestBodyError).Render(w)
		return
	}

	if validationErr := validate.Struct(data); validationErr != nil {
		apierror.BadRequest(validationErr.Error()).Render(w)
		return
	}

	pubsubMessageData := exc.MustResult(json.Marshal(emailsender.SendEmailRequestDTO{
		FromName:    userAccount.DisplayName,
		FromAddress: userAccount.Email,
		ToName:      "Basemind Support",
		ToAddress:   SupportEmailAddress,
		TemplateID:  SupportEmailTemplateID,
		TemplateVariables: map[string]string{
			"body":      data.EmailBody,
			"email":     userAccount.Email,
			"fullName":  userAccount.DisplayName,
			"projectId": data.ProjectID,
			"subject":   data.EmailSubject,
			"topic":     data.RequestTopic,
			"userId":    db.UUIDToString(&userAccount.ID),
		},
	}))

	topic := pubsubutils.GetTopic(r.Context(), pubsubutils.EmailSenderPubSubTopicID)

	publishContext, cancel := context.WithTimeout(
		context.Background(),
		1*time.Minute,
	)

	defer cancel()

	exc.Must(
		pubsubutils.PublishWithRetry(
			publishContext,
			topic,
			&pubsub.Message{Data: pubsubMessageData},
		),
	)

	serialization.RenderJSONResponse(w, http.StatusCreated, nil)
}
