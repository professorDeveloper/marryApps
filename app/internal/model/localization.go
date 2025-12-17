
package model

func GetLocalizedMessage(lang, key string) string {
	messages := map[string]map[string]string{
		"uz": {
			"too_many_attempts":       "Juda ko'p urinishlar",
			"not_logged_in":           "Siz tizimga kirmagansiz",
			"invalid_token":           "Noto'g'ri token",
			"invalid_request_body":    "Noto'g'ri so'rov tanasi",
			"invalid_app_type":        "Noto'g'ri app type",
			"invalid_request_format":  "Noto'g'ri so'rov formati",
			"phone_password_required": "Telefon raqami va parol talab qilinadi",
			"invalid_phone_format":    "Noto'g'ri telefon raqam formati",
			"password_too_short":      "Parol juda qisqa (kamida 8 ta belgi)",
			"refresh_token_required":  "Refresh token talab qilinadi",
			"file_not_fount":          "Fayl topilmadi",
			"file_too_large":          "Fayl juda katta (kamida 50MB)",
			"error_while_getting_file": "Fayl topishda xatolik",
			"bad_request": "Noto'g'ri formatda so'rov yuborilgan",
			"user_info_cannot_be_reached": "Foydalanuvchini ma'lumotlarini yangilab bo'lmadi",
			"google_login_failed": "Google bilan login qilishda xatolik",
			"invalid_date_of_birth": "Noto'g'ri tug'ilgan sana",

		},
		"de": {
			"too_many_attempts":       "Zu viele Versuche",
			"not_logged_in":           "Sie sind nicht angemeldet",
			"invalid_token":           "Ungültiger Token",
			"invalid_request_body":    "Ungültiger Anfragekörper",
			"invalid_app_type":        "Ungültiger App-Typ",
			"invalid_request_format":  "Ungültiges Anfrageformat",
			"phone_password_required": "Telefonnummer und Passwort sind erforderlich",
			"invalid_phone_format":    "Ungültiges Telefonnummernformat",
			"password_too_short":      "Passwort zu kurz (mindestens 8 Zeichen)",
			"refresh_token_required":  "Refresh-Token erforderlich",
			"file_not_fount":          "Datei nicht gefunden",
			"file_too_large":          "Datei zu groß (maximal 50MB)",
			"error_while_getting_file": "Datei konnte nicht geöffnet werden",
			"bad_request": "Nicht korrekt formatierter Anfrage",
			"user_info_cannot_be_reached": "Fehler beim Aktualisieren des Benutzers",
			"google_login_failed": "Google Anmeldung fehlgeschlagen",
			"invalid_date_of_birth": "Ungültige Geburtsdatum",
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