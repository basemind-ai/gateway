package api

import (
	"cloud.google.com/go/pubsub"
	"encoding/json"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/dto"
	"github.com/basemind-ai/monorepo/services/dashboard-backend/internal/middleware"
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"github.com/basemind-ai/monorepo/shared/go/datatypes"
	"github.com/basemind-ai/monorepo/shared/go/db"
	"github.com/basemind-ai/monorepo/shared/go/db/models"
	"github.com/basemind-ai/monorepo/shared/go/exc"
	"github.com/basemind-ai/monorepo/shared/go/pubsubutils"
	"github.com/basemind-ai/monorepo/shared/go/serialization"
	"net/http"
)

const (
	SupportEmailAddress    = "support@basemind.ai"
	SupportEmailTemplateID = "d-67b1f348e3f44518803d5cb03a8c1438"
	PubSubTopicID          = "send-email"
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

	pubsubMessageData, _ := json.Marshal(datatypes.SendEmailRequestDTO{
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
	})

	topic := exc.MustResult(pubsubutils.GetTopic(r.Context(), PubSubTopicID))
	go pubsubutils.PublishWithRetry(r.Context(), topic, &pubsub.Message{Data: pubsubMessageData})
}
