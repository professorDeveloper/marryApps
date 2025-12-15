
package model

func GetLocalizedMessage(lang, key string) string {
	messages := map[string]map[string]string{
		"uz": {
			"too_many_attempts":       "Juda ko'p urinishlar",
			"not_logged_in":           "Siz tizimga kirmagansiz",
			"invalid_token":           "Noto'g'ri token",
			"invalid_request_body":    "Noto'g'ri so'rov tanasi",
			"invalid_request_format":  "Noto'g'ri so'rov formati",
			"phone_password_required": "Telefon raqami va parol talab qilinadi",
			"invalid_phone_format":    "Noto'g'ri telefon raqam formati",
			"password_too_short":      "Parol juda qisqa (kamida 8 ta belgi)",
			"refresh_token_required":  "Refresh token talab qilinadi",
		},
		"de": {
			"too_many_attempts":       "Zu viele Versuche",
			"not_logged_in":           "Sie sind nicht angemeldet",
			"invalid_token":           "Ungültiger Token",
			"invalid_request_body":    "Ungültiger Anfragekörper",
			"invalid_request_format":  "Ungültiges Anfrageformat",
			"phone_password_required": "Telefonnummer und Passwort sind erforderlich",
			"invalid_phone_format":    "Ungültiges Telefonnummernformat",
			"password_too_short":      "Passwort zu kurz (mindestens 8 Zeichen)",
			"refresh_token_required":  "Refresh-Token erforderlich",
		},
		"en": {
			"too_many_attempts":       "Too many attempts",
			"not_logged_in":           "You are not logged in",
			"invalid_token":           "Invalid token",
			"invalid_request_body":    "Invalid request body",
			"invalid_request_format":  "Invalid request format",
			"phone_password_required": "Phone number and password are required",
			"invalid_phone_format":    "Invalid phone number format",
			"password_too_short":      "Password too short (minimum 8 characters)",
			"refresh_token_required":  "Refresh token is required",
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