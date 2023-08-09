package firebaseutils_test

import (
	"context"
	"github.com/basemind-ai/backend-services/lib/firebaseutils"
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestGetFirebaseAuth(t *testing.T) {
	assert.NotNil(t, firebaseutils.GetFirebaseAuth(context.TODO()))
}

func TestSetFirebaseAuth(t *testing.T) {
	assert.NotNil(t, firebaseutils.GetFirebaseAuth(context.TODO()))
	firebaseutils.SetFirebaseAuth(nil)
	assert.Nil(t, firebaseutils.GetFirebaseAuth(context.Background()))
}
