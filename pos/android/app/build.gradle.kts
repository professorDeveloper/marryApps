import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Doimiy reliz kaliti. `android/key.properties` bo'lsa — o'sha ishlatiladi,
// bo'lmasa eski xatti-harakat (debug kalit) saqlanadi, ya'ni bu fayl yo'q
// ishlab chiquvchida hech narsa buzilmaydi.
//
// Nega kerak: debug kalit har mashinada boshqacha generatsiya qilinadi.
// APK'ni bir noutbukda, keyingisini CI'da yig'sak, planshetdagi eski nusxa
// ustidan o'rnatib bo'lmaydi — Android imzo mos kelmagani uchun rad etadi
// ("App not installed") va ilovani qo'lda o'chirish kerak bo'ladi. Bu esa
// ofitsiantning lokal ma'lumotlarini (LAN sozlamasi, navbatdagi buyurtmalar)
// o'chirib yuboradi.
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) {
        keystorePropertiesFile.inputStream().use { load(it) }
    }
}
val hasReleaseKeystore = keystoreProperties.getProperty("storeFile") != null

android {
    namespace = "uz.yurtal.maryaipos.mary_ai_pos"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        // flutter_local_notifications uchun zarur — java.time va boshqa yangi API lar
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "uz.yurtal.maryaipos.mary_ai_pos"
        // flutter_local_notifications: minSdk 21+ kerak (default Flutter'da 21)
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            // `key.properties` bo'lsa doimiy kalit, bo'lmasa debug kalit.
            // Debug kalit bilan yig'ilgan APK ham o'rnatiladi, lekin faqat
            // shu mashinada yig'ilganlar bir-birini yangilay oladi.
            signingConfig = if (hasReleaseKeystore) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
