// Top-level build file where you can add configuration options common to all sub-projects/modules.
import com.github.benmanes.gradle.versions.updates.DependencyUpdatesTask

plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.gradle.dependency.update)
    alias(libs.plugins.version.catalog.update)
}

tasks.named<DependencyUpdatesTask>("dependencyUpdates").configure {
    checkForGradleUpdate = true
    checkConstraints = true
    checkBuildEnvironmentConstraints = true
    gradleReleaseChannel = "release-candidate"
    reportfileName = "androidDepsUpdatesReport"
}
