package validate

import (
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var AppValidator *validator.Validate

func Init() {
	AppValidator = validator.New()

	AppValidator.RegisterValidation("uzb_phone", validateUzPhone)

	AppValidator.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
}
