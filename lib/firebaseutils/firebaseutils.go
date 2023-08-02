package firebaseutils

import (
	"context"
	"fmt"
	"sync"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/rs/zerolog/log"
)

var (
	once         sync.Once
	firebaseAuth *auth.Client
)

func GetFirebaseAuth(ctx context.Context) *auth.Client {
	once.Do(func() {
		app, appInitErr := firebase.NewApp(ctx, nil)
		if appInitErr != nil {
			log.Fatal().Err(fmt.Errorf("error initializing firebase app: %w", appInitErr)).Msg("error initializing firebase app")
		}

		authInstance, authInitErr := app.Auth(ctx)
		if authInitErr != nil {
			log.Fatal().Err(fmt.Errorf("error initializing firebase auth: %w", authInitErr)).Msg("error initializing firebase auth")
		}
		firebaseAuth = authInstance
	})
	return firebaseAuth
}
