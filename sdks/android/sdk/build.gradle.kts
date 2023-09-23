plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.basemind.client"
    compileSdk = 34

    defaultConfig {
        minSdk = 25

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}

// directories
private val generatedKotlinDir = "../gen/kt"
private val destinationDir = "src/main/java/com/basemind/client/gateway"

// tasks
private val taskCopyGenKtToSrc = "copyGeneratedKotlinToSrc"
private val taskCleanGenCopies = "cleanGenCopies"
private val taskDefaultBuild = "build"

// messages
private val descTaskCopyGenKtToSrc = "Copying Generated Kotlin Files from $generatedKotlinDir ..."
private val conclusionTaskCopyGenKtToSrc = "Files copied from %s to $destinationDir!"
private val descTaskCleanGenCopies = "Cleaning the contents from $destinationDir ..."
private val conclusionTaskCleanGenCopies = "Directory \"$destinationDir\" is cleaned!"

tasks.register(taskCleanGenCopies) {
    println(descTaskCleanGenCopies)

    val destDir = project.file(destinationDir)
    // Delete the contents of the folder
    destDir.deleteRecursively()

    // Optionally, recreate the empty folder if needed
    destDir.mkdirs()

    println(conclusionTaskCleanGenCopies)
}

tasks.register(taskCopyGenKtToSrc) {
    println(descTaskCopyGenKtToSrc)

    val sourceDir = file(generatedKotlinDir)
    val destDir = project.file(destinationDir)

    project.copy {
        from(sourceDir)
        into(destDir)
    }

    println(String.format(conclusionTaskCopyGenKtToSrc, sourceDir))
}

tasks.named(taskDefaultBuild) {
    dependsOn(taskCleanGenCopies)
    dependsOn(taskCopyGenKtToSrc)
}
