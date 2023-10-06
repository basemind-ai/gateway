package middleware_test

import (
	"github.com/stretchr/testify/mock"
	"net/http"
)

type nextMock struct {
	mock.Mock
}

func (m *nextMock) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	m.Called(w, r)
}
