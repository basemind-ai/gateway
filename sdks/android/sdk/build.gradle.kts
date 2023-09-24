plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    id("org.jetbrains.kotlin.jvm") apply false
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

// root directories
private val androidCoreDir = "$rootDir/sdks/android"
private val androidSdkDir = "$androidCoreDir/sdk"
private val androidSdkMainDir = "$androidSdkDir/src/main/java/com/basemind/client"

// directories in focus
private val genKtGatewayDir = "$rootDir/gen/kt/gateway/v1"
private val copyDestinationGatewayDir = "$androidSdkMainDir/gateway"
private val copyDestinationPModelsDir = "$androidSdkMainDir/promptModels"

// tasks
private val taskCopyGenKtToSrc = "copyGeneratedKotlinToSrc"
private val taskCleanGenCopies = "cleanGenCopies"
private val taskDefaultBuild = "build"

// messages
private val descTaskCopy = "Copying Generated Kotlin Files from $genKtGatewayDir ..."
private val positiveConclusionTaskCopy = "Files copied from %s to %s"
private val negativeConclusionTaskCopy = "There was an problem copying files from %s to %s"
private val descTaskClean = "Cleaning the contents from %s ..."
private val conclusionTaskClean = "Directory %s is cleaned!"

tasks.register(taskCleanGenCopies) {
    println(descTaskClean)

    deleteContents(project.file(copyDestinationGatewayDir))
    println(String.format(conclusionTaskClean, copyDestinationGatewayDir))

    deleteContents(project.file(copyDestinationPModelsDir))
    println(String.format(conclusionTaskClean, copyDestinationPModelsDir))
}

tasks.register(taskCopyGenKtToSrc) {
    println(descTaskCopy)

    val sourceDir = file(genKtGatewayDir)

    // Copy gateway files to the sdk's 'gateway' folder
    val copiedGatewayFiles = project.copy {
        val destDir = project.file(copyDestinationGatewayDir)

        from(sourceDir)
        into(destDir)

        exclude("**/*Prompt*")
    }

    printConclusionMessage(copiedGatewayFiles.didWork, sourceDir, copyDestinationGatewayDir)

    // Copy promptReq/Res files to the sdk's 'promptModels' folder
    val copiedPromptFiles = project.copy {
        val destDir = project.file(copyDestinationPModelsDir)

        from(sourceDir)
        into(destDir)

        include("**/*Prompt*")
    }

    printConclusionMessage(copiedPromptFiles.didWork, sourceDir, copyDestinationPModelsDir)
}

fun deleteContents(file: File) {
    // Delete the contents of the folder
    file.deleteRecursively()

    // Optionally, recreate the empty folder if needed
    file.mkdirs()
}

fun printConclusionMessage(copyStatus: Boolean, sourceDir: File, destinationDir: String) {
    val conclusionMessage = if (copyStatus) {
        positiveConclusionTaskCopy
    } else {
        negativeConclusionTaskCopy
    }

    println(String.format(conclusionMessage, sourceDir, destinationDir))
}

tasks.named(taskDefaultBuild) {
    dependsOn(taskCleanGenCopies)
    dependsOn(taskCopyGenKtToSrc)
}
