package api

import (
	"github.com/basemind-ai/monorepo/shared/go/apierror"
	"net/http"
)

// HandleCreateApplicationToken - creates a new application token.
func HandleCreateApplicationToken(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleRetrieveApplicationTokens - retrieves a list of all applications tokens.
func HandleRetrieveApplicationTokens(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}

// HandleDeleteApplicationToken - deletes an application token.
func HandleDeleteApplicationToken(w http.ResponseWriter, r *http.Request) {
	apierror.InternalServerError().Render(w, r)
}
