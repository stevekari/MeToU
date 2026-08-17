# ============================
# 1️⃣ Build React Frontend
# ============================
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ============================
# 2️⃣ Build Spring Boot Backend
# ============================
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /backend
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

# ============================
# 3️⃣ Final Image
# ============================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy backend JAR
COPY --from=backend-build /backend/target/*.jar app.jar

# Copy React build into Spring Boot static folder
COPY --from=frontend-build /frontend/dist /app/static/

EXPOSE 10000
ENTRYPOINT ["java", "-jar", "app.jar"]
