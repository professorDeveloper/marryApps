package model

func GetLocalizedMessage(lang, key string) string {
	lang = NormalizeLanguage(lang)

	messages := map[string]map[string]string{
		"uz": {
			"too_many_attempts":           "Juda ko'p urinishlar",
			"not_logged_in":               "Siz tizimga kirmagansiz",
			"invalid_token":               "Noto'g'ri token",
			"invalid_request_body":        "Noto'g'ri so'rov tanasi",
			"invalid_app_type":            "Noto'g'ri app type",
			"invalid_request_format":      "Noto'g'ri so'rov formati",
			"invalid_phone_format":        "Noto'g'ri telefon raqam formati",
			"phone_password_required":     "Telefon raqam va parol talab qilinadi",
			"refresh_token_required":      "Refresh token talab qilinadi",
			"file_not_fount":              "Fayl topilmadi",
			"file_too_large":              "Fayl juda katta (kamida 50MB)",
			"error_while_getting_file":    "Fayl topishda xatolik",
			"bad_request":                 "Noto'g'ri formatda so'rov yuborilgan",
			"user_not_found":              "Foydalanuvchi topilmadi",
			"user_info_cannot_be_reached": "Foydalanuvchini ma'lumotlarini yangilab bo'lmadi",
			"invalid_date_of_birth":       "Noto'g'ri tug'ilgan sana",
			"internal_server_error":       "Ichki server xatosi",
			"required":                    "Majburiy maydon",
			"min":                         "Qiymat juda kichik",
			"max":                         "Qiymat juda katta",
			"email":                       "Noto'g'ri email format",
			"oneof":                       "Noto'g'ri qiymat",
			"uuid":                        "Noto'g'ri UUID format",
		},
		"ru": {
			"too_many_attempts":           "Слишком много попыток",
			"not_logged_in":               "Вы не вошли в систему",
			"invalid_token":               "Неверный токен",
			"invalid_request_body":        "Некорректное тело запроса",
			"invalid_app_type":            "Неверный тип приложения",
			"invalid_request_format":      "Некорректный формат запроса",
			"invalid_phone_format":        "Неверный формат номера телефона",
			"phone_password_required":     "Требуются номер телефона и пароль",
			"password_too_short":          "Пароль слишком короткий (минимум 8 символов)",
			"refresh_token_required":      "Требуется refresh token",
			"file_not_fount":              "Файл не найден",
			"file_too_large":              "Файл слишком большой (максимум 50МБ)",
			"error_while_getting_file":    "Ошибка при получении файла",
			"bad_request":                 "Запрос отправлен в неверном формате",
			"user_not_found":              "Пользователь не найден",
			"user_info_cannot_be_reached": "Не удалось обновить данные пользователя",
			"invalid_date_of_birth":       "Неверная дата рождения",
			"internal_server_error":       "Внутренняя ошибка сервера",
			"required":                    "Обязательное поле",
			"min":                         "Значение слишком маленькое",
			"max":                         "Значение слишком большое",
			"email":                       "Неверный формат email",
			"oneof":                       "Недопустимое значение",
			"uuid":                        "Неверный формат UUID",
		},
		"en": {
			"too_many_attempts":           "Too many attempts",
			"not_logged_in":               "You are not logged in",
			"invalid_token":               "Invalid token",
			"invalid_request_body":        "Invalid request body",
			"invalid_app_type":            "Invalid app type",
			"invalid_request_format":      "Invalid request format",
			"invalid_phone_format":        "Invalid phone number format",
			"phone_password_required":     "Phone number and password are required",
			"password_too_short":          "Password is too short (minimum 8 characters)",
			"refresh_token_required":      "Refresh token is required",
			"file_not_fount":              "File not found",
			"file_too_large":              "File is too large (maximum 50MB)",
			"error_while_getting_file":    "Error while getting file",
			"bad_request":                 "Request is in an invalid format",
			"user_not_found":              "User not found",
			"user_info_cannot_be_reached": "Failed to update user information",
			"invalid_date_of_birth":       "Invalid date of birth",
			"internal_server_error":       "Internal server error",
			"required":                    "Required field",
			"min":                         "Value is too small",
			"max":                         "Value is too large",
			"email":                       "Invalid email format",
			"oneof":                       "Invalid value",
			"uuid":                        "Invalid UUID format",
		},
	}

	if langMessages, ok := messages[lang]; ok {
		if message, ok := langMessages[key]; ok {
			return message
		}
	}

	if message, ok := messages["uz"][key]; ok {
		return message
	}
	return "Unknown error"
}

type SuccessResponses[T any] struct {
	Status string `json:"status" example:"success"`
	Data   T      `json:"data"`
}

type ErrorResponses struct {
	Status string      `json:"status" example:"error"`
	Error  interface{} `json:"error"`
}
