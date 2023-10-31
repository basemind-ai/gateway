package firebaseutils

import (
	"context"
	"fmt"
	"sync"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/rs/zerolog/log"
)

type FirebaseAuth interface {
	VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error)
	GetUser(ctx context.Context, uid string) (*auth.UserRecord, error)
	DeleteUser(ctx context.Context, uid string) error
}

var (
	once         sync.Once
	firebaseAuth FirebaseAuth
)

// GetFirebaseAuth - returns the firebase auth instance.
// If the instance is not initialized, it will initialize it.
// If the initialization fails, it will log the error and exit.
// This function is thread-safe.
func GetFirebaseAuth(ctx context.Context) FirebaseAuth {
	once.Do(func() {
		app, appInitErr := firebase.NewApp(ctx, nil)
		if appInitErr != nil { // skipcq: TCV-001
			log.Fatal().
				Err(fmt.Errorf("error initializing firebase app: %w", appInitErr)).
				Msg("error initializing firebase app")
		}

		authInstance, authInitErr := app.Auth(ctx)
		if authInitErr != nil { // skipcq: TCV-001
			log.Fatal().
				Err(fmt.Errorf("error initializing firebase auth: %w", authInitErr)).
				Msg("error initializing firebase auth")
		}
		SetFirebaseAuth(authInstance)
	})
	return firebaseAuth
}

// SetFirebaseAuth - sets the firebase auth instance.
func SetFirebaseAuth(a FirebaseAuth) {
	firebaseAuth = a
}
