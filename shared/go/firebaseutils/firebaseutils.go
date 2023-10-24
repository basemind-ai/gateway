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

func GetFirebaseAuth(ctx context.Context) FirebaseAuth {
	once.Do(func() {
		app, appInitErr := firebase.NewApp(ctx, nil)
		if appInitErr != nil {
			log.Fatal().
				Err(fmt.Errorf("error initializing firebase app: %w", appInitErr)).
				Msg("error initializing firebase app")
		}

		authInstance, authInitErr := app.Auth(ctx)
		if authInitErr != nil {
			log.Fatal().
				Err(fmt.Errorf("error initializing firebase auth: %w", authInitErr)).
				Msg("error initializing firebase auth")
		}
		SetFirebaseAuth(authInstance)
	})
	return firebaseAuth
}

func SetFirebaseAuth(a FirebaseAuth) {
	firebaseAuth = a
}
