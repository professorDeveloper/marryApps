package model

import (
	"log"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

func GlobalErrorHandler(err error, c echo.Context) {
	lang := c.Request().Header.Get("Accept-Language")
	if lang == "" {
		lang = "uz"
	}

	code := http.StatusInternalServerError
	var message interface{}

	switch e := err.(type) {
	case *echo.HTTPError:
		code = e.Code
		message = e.Message
	case validator.ValidationErrors:
		code = http.StatusUnprocessableEntity
		errs := make(map[string]string)
		for _, fe := range e {
			errs[fe.Field()] = GetLocalizedMessage(lang, fe.Tag())
		}
		message = errs
	default:
		log.Printf("INTERNAL ERROR: %v", err)
		code = http.StatusInternalServerError
		message = GetLocalizedMessage(lang, "internal_server_error")
	}

	if !c.Response().Committed {
		c.JSON(code, ErrorResponses{
			Status: "error",
			Error:  message,
		})
	}
}
