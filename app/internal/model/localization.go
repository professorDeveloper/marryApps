package model

func GetLocalizedMessage(lang, key string) string {
	messages := map[string]map[string]string{
		"uz": {
			"too_many_attempts":           "Juda ko'p urinishlar",
			"not_logged_in":               "Siz tizimga kirmagansiz",
			"invalid_token":               "Noto'g'ri token",
			"invalid_request_body":        "Noto'g'ri so'rov tanasi",
			"invalid_app_type":            "Noto'g'ri app type",
			"invalid_request_format":      "Noto'g'ri so'rov formati",
			"invalid_phone_format":        "Noto'g'ri telefon raqam formati",
			"refresh_token_required":      "Refresh token talab qilinadi",
			"file_not_fount":              "Fayl topilmadi",
			"file_too_large":              "Fayl juda katta (kamida 50MB)",
			"error_while_getting_file":    "Fayl topishda xatolik",
			"bad_request":                 "Noto'g'ri formatda so'rov yuborilgan",
			"user_info_cannot_be_reached": "Foydalanuvchini ma'lumotlarini yangilab bo'lmadi",
			"invalid_date_of_birth":       "Noto'g'ri tug'ilgan sana",
		},
		"ru": {
			"too_many_attempts":           "Слишком много попыток",
			"not_logged_in":               "Вы не вошли в систему",
			"invalid_token":               "Неверный токен",
			"invalid_request_body":        "Некорректное тело запроса",
			"invalid_app_type":            "Неверный тип приложения",
			"invalid_phone_format":        "Неверный формат номера телефона",
			"password_too_short":          "Пароль слишком короткий (минимум 8 символов)",
			"refresh_token_required":      "Требуется refresh token",
			"file_not_fount":              "Файл не найден",
			"file_too_large":              "Файл слишком большой (максимум 50МБ)",
			"error_while_getting_file":    "Ошибка при получении файла",
			"bad_request":                 "Запрос отправлен в неверном формате",
			"user_info_cannot_be_reached": "Не удалось обновить данные пользователя",
			"invalid_date_of_birth":       "Неверная дата рождения",
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