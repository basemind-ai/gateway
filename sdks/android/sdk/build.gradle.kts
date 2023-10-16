plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.protobuf)
    alias(libs.plugins.android.junit.jupiter)
    id("org.jetbrains.kotlin.jvm") apply false
}

kotlin {
    jvmToolchain(17)
}

android {
    namespace = "com.basemind.client"
    compileSdk = 34

    defaultConfig {
        minSdk = 25

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

    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.grpc.kotlin.stub)
    api(libs.grpc.protobuf.kotlin.lite)
    implementation(libs.grpc.protobuf.lite)
    implementation(libs.grpc.stub)
    implementation(libs.androidx.core.ktx)
    implementation(libs.grpc.okhttp)

    testImplementation(libs.grpc.testing)
    testImplementation(libs.junit.jupiter.api)
    testImplementation(libs.junit.jupiter.params)
    testImplementation(libs.system.stubs.jupiter)
    testImplementation(libs.kotlinx.coroutines.test)
    testRuntimeOnly(libs.junit.jupiter.engine)

    compileOnly(libs.annotations.api)
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
