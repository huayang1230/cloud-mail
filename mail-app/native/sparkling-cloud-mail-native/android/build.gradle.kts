plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "net.yzsaas.mail.cloudmailnative.cloudmailnative"
    compileSdk = 34

    defaultConfig {
        minSdk = 23
    }
}

// Add dependencies required by your module.
