plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.protobuf)
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
    protobuf(files("../../../proto/gateway/v1"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.grpc.kotlin.stub)
    implementation(libs.grpc.okhttp)
    implementation(libs.grpc.protobuf.kotlin.lite)
    implementation(libs.grpc.protobuf.lite)
    implementation(libs.grpc.stub)
    implementation(libs.kotlinx.coroutines)

    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    testImplementation(libs.junit)
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().all {
    kotlinOptions {
        freeCompilerArgs = listOf("-opt-in=kotlin.RequiresOptIn")
    }
}

protobuf {
    protoc {
        artifact = "com.google.protobuf:protoc:3.24.3"
    }
    plugins {
        create("java") {
            artifact = "io.grpc:protoc-gen-grpc-java:1.58.0"
        }
        create("grpc") {
            artifact = "io.grpc:protoc-gen-grpc-java:1.58.0"
        }
        create("grpckt") {
            artifact = "io.grpc:protoc-gen-grpc-kotlin:1.4.0:jdk8@jar"
        }
    }
    generateProtoTasks {
        all().forEach {
            it.plugins {
                create("java") {
                    option("lite")
                }
                create("grpc") {
                    option("lite")
                }
                create("grpckt") {
                    option("lite")
                }
            }
            it.builtins {
                create("kotlin") {
                    option("lite")
                }
            }
        }
    }
}
