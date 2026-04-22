package model

import (
	"regexp"
	"strings"
)

func NormalizeLanguage(lang string) string {
	lang = strings.ToLower(strings.TrimSpace(lang))
	switch lang {
	case "uz", "ru", "en":
		return lang
	default:
		return "uz"
	}
}

type localizedText struct {
	uz string
	ru string
	en string
}

func (t localizedText) pick(lang string) string {
	switch NormalizeLanguage(lang) {
	case "ru":
		return t.ru
	case "en":
		return t.en
	default:
		return t.uz
	}
}

var exactErrorTranslations = map[string]localizedText{
	"invalid request":                   {"Noto'g'ri so'rov", "Некорректный запрос", "Invalid request"},
	"invalid request body":              {"Noto'g'ri so'rov tanasi", "Некорректное тело запроса", "Invalid request body"},
	"invalid request format":            {"Noto'g'ri so'rov formati", "Некорректный формат запроса", "Invalid request format"},
	"operation failed":                  {"Amal bajarilmadi", "Операция не выполнена", "Operation failed"},
	"forbidden":                         {"Taqiqlangan", "Доступ запрещен", "Forbidden"},
	"expand failed":                     {"Bog'liq ma'lumotlarni kengaytirib bo'lmadi", "Не удалось расширить связанные данные", "Failed to expand related data"},
	"endpoint deprecated":               {"Endpoint eskirgan", "Эндпоинт устарел", "Endpoint deprecated"},
	"no active shift found":             {"Faol smena topilmadi", "Активная смена не найдена", "No active shift found"},
	"cafe table not found":              {"Stol topilmadi", "Стол не найден", "Cafe table not found"},
	"table already has an active order": {"Stolda allaqachon faol buyurtma mavjud", "У стола уже есть активный заказ", "Table already has an active order"},
	"order already exists":              {"Buyurtma allaqachon mavjud", "Заказ уже существует", "Order already exists"},
}

var phraseTranslations = []struct {
	old string
	t   localizedText
}{
	{"already exists", localizedText{"allaqachon mavjud", "уже существует", "already exists"}},
	{"not found", localizedText{"topilmadi", "не найдено", "not found"}},
	{"is required", localizedText{"talab qilinadi", "обязательно", "is required"}},
	{"are required", localizedText{"talab qilinadi", "обязательны", "are required"}},
	{"must be greater than 0", localizedText{"0 dan katta bo'lishi kerak", "должно быть больше 0", "must be greater than 0"}},
	{"must be a positive integer", localizedText{"musbat butun son bo'lishi kerak", "должно быть положительным целым числом", "must be a positive integer"}},
	{"must be a non-negative integer", localizedText{"manfiy bo'lmagan butun son bo'lishi kerak", "должно быть неотрицательным целым числом", "must be a non-negative integer"}},
	{"cannot be negative", localizedText{"manfiy bo'lishi mumkin emas", "не может быть отрицательным", "cannot be negative"}},
	{"cannot be empty", localizedText{"bo'sh bo'lishi mumkin emas", "не может быть пустым", "cannot be empty"}},
	{"failed to create", localizedText{"yaratib bo'lmadi", "не удалось создать", "failed to create"}},
	{"failed to update", localizedText{"yangilab bo'lmadi", "не удалось обновить", "failed to update"}},
	{"failed to delete", localizedText{"o'chirib bo'lmadi", "не удалось удалить", "failed to delete"}},
	{"failed to restore", localizedText{"tiklab bo'lmadi", "не удалось восстановить", "failed to restore"}},
	{"failed to get", localizedText{"olib bo'lmadi", "не удалось получить", "failed to get"}},
	{"failed to fetch", localizedText{"olib bo'lmadi", "не удалось получить", "failed to fetch"}},
	{"failed to retrieve", localizedText{"olib bo'lmadi", "не удалось получить", "failed to retrieve"}},
	{"failed to list", localizedText{"ro'yxatini olib bo'lmadi", "не удалось получить список", "failed to list"}},
	{"failed to count", localizedText{"sonini olib bo'lmadi", "не удалось посчитать", "failed to count"}},
	{"failed to sync", localizedText{"sinxronlab bo'lmadi", "не удалось синхронизировать", "failed to sync"}},
	{"invalid ", localizedText{"noto'g'ri ", "неверный ", "invalid "}},
	{"cannot ", localizedText{"mumkin emas ", "нельзя ", "cannot "}},
}

var localizedEntities = map[string]localizedText{
	"cafe table":       {"stol", "стол", "cafe table"},
	"table":            {"stol", "стол", "table"},
	"order":            {"buyurtma", "заказ", "order"},
	"orders":           {"buyurtmalar", "заказы", "orders"},
	"inventory":        {"inventarizatsiya", "инвентаризация", "inventory"},
	"inventories":      {"inventarizatsiyalar", "инвентаризации", "inventories"},
	"inventory item":   {"inventar elementi", "элемент инвентаризации", "inventory item"},
	"item":             {"element", "элемент", "item"},
	"items":            {"elementlar", "элементы", "items"},
	"storage":          {"ombor", "склад", "storage"},
	"ingredient":       {"ingredient", "ингредиент", "ingredient"},
	"ingredient stock": {"ingredient qoldig'i", "остаток ингредиента", "ingredient stock"},
	"shift":            {"smena", "смена", "shift"},
	"cash register":    {"kassa", "касса", "cash register"},
	"branch":           {"filial", "филиал", "branch"},
	"brand":            {"brend", "бренд", "brand"},
	"category":         {"kategoriya", "категория", "category"},
	"department":       {"bo'lim", "отдел", "department"},
	"hall":             {"zal", "зал", "hall"},
	"translation":      {"tarjima", "перевод", "translation"},
	"user":             {"foydalanuvchi", "пользователь", "user"},
	"good":             {"tovar", "товар", "good"},
	"modifier":         {"modifikator", "модификатор", "modifier"},
	"calculation":      {"kalkulyatsiya", "калькуляция", "calculation"},
	"compound":         {"yarim tayyor mahsulot", "полуфабрикат", "compound"},
	"supplier":         {"ta'minotchi", "поставщик", "supplier"},
	"shipment":         {"kirim", "поставка", "shipment"},
	"outgoing invoice": {"chiqim hujjati", "расходная накладная", "outgoing invoice"},
	"separation act":   {"ajratish akti", "акт разделения", "separation act"},
	"transfer":         {"ko'chirish", "перемещение", "transfer"},
	"deduction":        {"hisobdan chiqarish", "списание", "deduction"},
	"superadmin":       {"superadmin", "суперадмин", "superadmin"},
	"transaction":      {"tranzaksiya", "транзакция", "transaction"},
}

var regexErrorTranslations = []struct {
	re *regexp.Regexp
	uz string
	ru string
	en string
}{
	{regexp.MustCompile(`^failed to create (.+?)(: .+)?$`), "%s yaratib bo'lmadi%s", "Не удалось создать %s%s", "Failed to create %s%s"},
	{regexp.MustCompile(`^failed to update (.+?)(: .+)?$`), "%s yangilab bo'lmadi%s", "Не удалось обновить %s%s", "Failed to update %s%s"},
	{regexp.MustCompile(`^failed to delete (.+?)(: .+)?$`), "%s o'chirib bo'lmadi%s", "Не удалось удалить %s%s", "Failed to delete %s%s"},
	{regexp.MustCompile(`^failed to restore (.+?)(: .+)?$`), "%s tiklab bo'lmadi%s", "Не удалось восстановить %s%s", "Failed to restore %s%s"},
	{regexp.MustCompile(`^failed to (get|fetch|retrieve|list|count) (.+?)(: .+)?$`), "%s olib bo'lmadi%s", "Не удалось получить %s%s", "Failed to get %s%s"},
	{regexp.MustCompile(`^invalid (.+?) format$`), "%s formati noto'g'ri", "Неверный формат: %s", "Invalid %s format"},
	{regexp.MustCompile(`^invalid (.+?)$`), "%s noto'g'ri", "%s неверный", "Invalid %s"},
	{regexp.MustCompile(`^(.+?) is required$`), "%s talab qilinadi", "Требуется %s", "%s is required"},
	{regexp.MustCompile(`^(.+?) are required$`), "%s talab qilinadi", "Требуются %s", "%s are required"},
	{regexp.MustCompile(`^(.+?) not found$`), "%s topilmadi", "%s не найден", "%s not found"},
	{regexp.MustCompile(`^(.+?) already exists$`), "%s allaqachon mavjud", "%s уже существует", "%s already exists"},
	{regexp.MustCompile(`^(.+?) must be greater than 0$`), "%s 0 dan katta bo'lishi kerak", "%s должно быть больше 0", "%s must be greater than 0"},
	{regexp.MustCompile(`^(.+?) cannot be negative$`), "%s manfiy bo'lishi mumkin emas", "%s не может быть отрицательным", "%s cannot be negative"},
	{regexp.MustCompile(`^at least one (.+?) is required$`), "Kamida bitta %s talab qilinadi", "Требуется хотя бы один %s", "At least one %s is required"},
	{regexp.MustCompile(`^no active (.+?) found$`), "Faol %s topilmadi", "Активный %s не найден", "No active %s found"},
}

func LocalizeErrorText(lang, text string) string {
	text = strings.TrimSpace(text)
	if text == "" {
		return text
	}

	lang = NormalizeLanguage(lang)
	lower := strings.ToLower(text)

	if exact, ok := exactErrorTranslations[lower]; ok {
		return exact.pick(lang)
	}

	for _, item := range regexErrorTranslations {
		matches := item.re.FindStringSubmatch(lower)
		if len(matches) == 0 {
			continue
		}

		switch len(matches) {
		case 2:
			return formatLocalized(lang, item.uz, item.ru, item.en, localizeSubject(lang, matches[1]))
		case 3:
			return formatLocalized(lang, item.uz, item.ru, item.en, localizeSubject(lang, matches[1]), localizeTail(lang, matches[2]))
		case 4:
			if matches[1] == "get" || matches[1] == "fetch" || matches[1] == "retrieve" || matches[1] == "list" || matches[1] == "count" {
				return formatLocalized(lang, item.uz, item.ru, item.en, localizeSubject(lang, matches[2]), localizeTail(lang, matches[3]))
			}
		}
	}

	if lang == "en" {
		return text
	}

	translated := lower
	for _, item := range phraseTranslations {
		translated = strings.ReplaceAll(translated, item.old, item.t.pick(lang))
	}
	translated = localizeSubject(lang, translated)
	if translated == "" {
		return text
	}
	return translated
}

func formatLocalized(lang, uz, ru, en string, args ...any) string {
	format := localizedText{uz: uz, ru: ru, en: en}.pick(lang)
	return strings.TrimSpace(strings.ReplaceAll(strings.TrimSpace(sprintf(format, args...)), "  ", " "))
}

func sprintf(format string, args ...any) string {
	for _, arg := range args {
		format = strings.Replace(format, "%s", toString(arg), 1)
	}
	return format
}

func toString(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}

func localizeTail(lang, tail string) string {
	tail = strings.TrimSpace(tail)
	if tail == "" {
		return ""
	}
	if strings.HasPrefix(tail, ":") {
		return ": " + LocalizeErrorText(lang, strings.TrimSpace(strings.TrimPrefix(tail, ":")))
	}
	return " " + LocalizeErrorText(lang, tail)
}

func localizeSubject(lang, subject string) string {
	subject = strings.TrimSpace(strings.ToLower(subject))
	if subject == "" {
		return subject
	}
	if strings.Contains(subject, "_") {
		return subject
	}

	for key, value := range localizedEntities {
		subject = strings.ReplaceAll(subject, key, value.pick(lang))
	}
	return subject
}
