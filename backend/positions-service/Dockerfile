# build
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY gradlew settings.gradle.kts build.gradle.kts gradle.properties ./
COPY gradle ./gradle
RUN ./gradlew --no-daemon dependencies || true
COPY src ./src
RUN ./gradlew --no-daemon clean bootJar

# runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
