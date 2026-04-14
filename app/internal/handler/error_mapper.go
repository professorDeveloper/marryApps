package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"gitlab.yurtal.tech/company/maryai/back/internal/model"
)

func containsAny(s string, parts ...string) bool {
	for _, p := range parts {
		if strings.Contains(s, p) {
			return true
		}
	}
	return false
}

func domainErrorStatus(err error) int {
	if err == nil {
		return http.StatusOK
	}

	msg := strings.ToLower(strings.TrimSpace(err.Error()))

	switch {
	case containsAny(msg,
		"invalid ",
		"is required",
		"required",
		"missing ",
		"cannot be empty",
		"must be greater than 0",
		"provide only one",
		"either ",
		"use query parameter",
	):
		return http.StatusBadRequest

	case containsAny(msg,
		"not found",
	):
		return http.StatusNotFound

	case containsAny(msg,
		"already exists",
		"already attached",
		"inactive",
		"cannot be deleted",
		"conflict",
	):
		return http.StatusConflict

	default:
		return http.StatusInternalServerError
	}
}

func respondDomainError(c echo.Context, message string, err error) error {
	status := domainErrorStatus(err)
	return c.JSON(status, model.NewErrorResponse(
		message,
		err.Error(),
		status,
	))
}
