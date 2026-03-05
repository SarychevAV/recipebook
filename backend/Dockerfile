FROM maven:3.9-eclipse-temurin-21
WORKDIR /app

# Download dependencies separately for layer caching — retries on network errors
COPY pom.xml .
RUN mvn dependency:go-offline -q
EXPOSE 8080
CMD ["mvn", "spring-boot:run"]
