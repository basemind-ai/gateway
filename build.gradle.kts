// Top-level build file where you can add configuration options common to all sub-projects/modules.
import com.github.benmanes.gradle.versions.updates.DependencyUpdatesTask


plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.gradle.dependency.update)
    alias(libs.plugins.version.catalog.update)
}

versionCatalogUpdate {
    sortByKey.set(true)
    pin {}
    keep {
        keepUnusedVersions.set(false)
        keepUnusedLibraries.set(false)
        keepUnusedPlugins.set(false)
    }
}

tasks.named<DependencyUpdatesTask>("dependencyUpdates").configure {
    checkForGradleUpdate = true
    checkConstraints = true
    checkBuildEnvironmentConstraints = true
    gradleReleaseChannel = "current"
    reportfileName = "report"
}

/**
 * isNonStable checks if a given version is not stable
 */
fun isNonStable(version: String): Boolean {
    val stableKeyword = listOf("RELEASE", "FINAL", "GA").any { version.uppercase().contains(it) }
    val nonStableKeyword = listOf("ALPHA", "BETA", "RC").any { version.uppercase().contains(it) }

    val regex = "^[0-9,.v-]+(-r)?$".toRegex()
    val isStable = !nonStableKeyword && (stableKeyword || regex.matches(version))
    return isStable.not()
}

tasks.withType<DependencyUpdatesTask> {
    rejectVersionIf {
        isNonStable(candidate.version) && !isNonStable(currentVersion)
    }
}
