package testingutils

import (
	"context"

	"github.com/basemind-ai/backend-services/lib/firebaseutils"

	"firebase.google.com/go/v4/auth"
	"github.com/stretchr/testify/mock"
)

type FirebaseAuthMock struct {
	mock.Mock
}

func (m *FirebaseAuthMock) VerifyIDToken(ctx context.Context, idToken string) (*auth.Token, error) {
	args := m.Called(ctx, idToken)

	return args.Get(0).(*auth.Token), args.Error(1)
}

func MockFirebaseAuth() *FirebaseAuthMock {
	// we have to exhaust the sync.Once
	firebaseutils.GetFirebaseAuth(context.TODO())

	authMock := &FirebaseAuthMock{}
	firebaseutils.SetFirebaseAuth(authMock)
	return authMock
}
