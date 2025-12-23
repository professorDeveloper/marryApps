package validate

import (
	"net/http"
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

func BindAndValidate[T any](c echo.Context) (T, error) {
	var req T

	if err := c.Bind(&req); err != nil {
		return req, echo.NewHTTPError(http.StatusBadRequest, "Noto'g'ri JSON formati")
	}

	if err := AppValidator.Struct(req); err != nil {
		return req, err
	}

	return req, nil
}

var uzbPhoneRegex = regexp.MustCompile(`^\+998[0-9]{9}$`)

func validateUzPhone(fl validator.FieldLevel) bool {
	return uzbPhoneRegex.MatchString(fl.Field().String())
}
