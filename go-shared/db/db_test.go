package db_test

import (
	"context"
	"testing"

	"github.com/basemind-ai/monorepo/go-shared/db"
	dbTestUtils "github.com/basemind-ai/monorepo/go-shared/db/testutils"
	"github.com/stretchr/testify/assert"
)

func TestUser(t *testing.T) {
	dbTestUtils.CreateTestDB(t, "file://../../sql/migrations")
	dbQueries := db.GetQueries()

	t.Run("Check User Exists tests", func(t *testing.T) {
		t.Run("returns false on when user does not exist", func(t *testing.T) {
			userExists, err := dbQueries.CheckUserExists(context.TODO(), "1")
			assert.Nil(t, err)
			assert.False(t, userExists)
		})

		t.Run("returns true when user does exist", func(t *testing.T) {
			_, err := dbQueries.CreateUser(context.TODO(), "1")
			assert.Nil(t, err)

			userExists, err := dbQueries.CheckUserExists(context.TODO(), "1")
			assert.Nil(t, err)
			assert.True(t, userExists)
		})
	})
}
