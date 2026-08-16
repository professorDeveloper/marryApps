
import json

def load_json(path):
    with open(path, "r") as f:
        return json.load(f)

uz = load_json("lib/l10n/intl_uz.arb")
en = load_json("lib/l10n/intl_en.arb")
ru = load_json("lib/l10n/intl_ru.arb")

uz_keys = set(uz.keys())
en_keys = set(en.keys())
ru_keys = set(ru.keys())

missing_in_en = uz_keys - en_keys
missing_in_ru = uz_keys - ru_keys

print(f"Missing in EN: {missing_in_en}")
print(f"Missing in RU: {missing_in_ru}")

extra_in_en = en_keys - uz_keys
print(f"Extra in EN (not in UZ): {extra_in_en}")

