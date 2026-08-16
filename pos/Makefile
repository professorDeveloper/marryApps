### Ushbu fayl doimiy amallar(build, fix, build_runner...) uchun qisqa terminal komandalari
### Bitta kommand ichida ko'pgina ketma-ket bajariladigan operatsiyalar yozish mumkin.
### Masalan quyidagi kod, clean qilib pub get qiladi. Terminalga ``make clean`` yozish kerak.
### clean:
### 	flutter clean
### 	flutter pub get


# Generatsiya pakagelari uchun, bir martalik generatsiya
gen:
	dart run build_runner build


# Generatsiya pakagelari uchun, o'zgarishlarni eshitib turadi
gen_auto:
	dart run build_runner watch --delete-conflicting-outputs

# Generatsiya pakagelari uchun, o'zgarishlarni eshitib turadi
# dart pub global activate intl_utils
lang_auto:
	flutter pub run intl_utils:generate

# Clean qilish uchun
clean:
	flutter clean
	flutter pub get


# Build ios qilish uchun
build_ios:
	flutter clean
	flutter build ios


# Apk build qilish uchun:
# apk build qiladi, nomini project_name_sana.apk ko'rinisiga o'tkazadi
# papkani ochadi, gitdagi joriy branchdagi ohirgi 5 commitni, changes.txtga saqlaydi
build_android:
	flutter clean
	flutter build apk --release
	mv ./build/app/outputs/flutter-apk/app-release.apk "./build/app/outputs/flutter-apk/LCUP-Student-`date +%d.%m.%Y`.apk"
	git log -n 5 --pretty=format:"%s" > ./build/app/outputs/flutter-apk/changes.txt
	echo "`git log -n 5 --pretty=format:"%s"`" | pbcopy
	open ./build/app/outputs/flutter-apk/


# iosda uchrab turadigan odatiy xatoliklarni oldini oladi
fix_ios:
	cd ios; pod cache clean --all; pod clean; pod deintegrate; sudo gem install cocoapods-deintegrate cocoapods-clean; sudo arch -x86_64 gem install ffi; arch -x86_64 pod repo update; arch -x86_64 pod install