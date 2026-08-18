plugins {
    java
    id("org.springframework.boot") version "3.3.4"
    id("io.spring.dependency-management") version "1.1.6"
    checkstyle
}

group = "com.skypulse"
version = "0.1.0-SNAPSHOT"
description = "SkyPulse positions service — отдаёт живые позиции самолётов и треки на карту"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // Swagger UI / OpenAPI генерятся автоматически из контроллеров
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

checkstyle {
    toolVersion = "10.18.1"
    configFile = file("config/checkstyle/checkstyle.xml")
    configDirectory.set(file("config/checkstyle"))
    isIgnoreFailures = false
    maxWarnings = 0
}

tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
    options.compilerArgs.add("-parameters")
}

tasks.test {
    useJUnitPlatform()
}
