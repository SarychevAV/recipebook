# ── Stage: dev ─────────────────────────────────────────────────────────────
# src монтируется из docker-compose.yml — spring-devtools подхватывает изменения
FROM maven:3.9-eclipse-temurin-21 AS dev
WORKDIR /app

# Download dependencies separately for layer caching — retries on network errors
COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY recipe-photos ./docs/recipe-photos

EXPOSE 8080
CMD ["mvn", "spring-boot:run"]

# ── Stage: builder ──────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage: prod ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS prod
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
