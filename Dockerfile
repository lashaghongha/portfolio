# syntax=docker/dockerfile:1

# ---------- Stage 1: build the React frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /app/frontend

# Install deps first (better layer caching)
COPY frontend/package*.json ./
RUN npm ci

# Build. VITE_API_URL="" makes the frontend call the API on the SAME origin,
# because the backend below serves these static files itself (single service).
COPY frontend/ ./
ENV VITE_API_URL=""
RUN npm run build

# ---------- Stage 2: build & publish the .NET backend ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend
WORKDIR /src

COPY backend/PortfolioApi/PortfolioApi.csproj ./PortfolioApi/
RUN dotnet restore ./PortfolioApi/PortfolioApi.csproj

COPY backend/PortfolioApi/ ./PortfolioApi/
RUN dotnet publish ./PortfolioApi/PortfolioApi.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---------- Stage 3: runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Published backend
COPY --from=backend /app/publish ./

# Built frontend goes into wwwroot so ASP.NET Core serves it (index.html + assets)
COPY --from=frontend /app/frontend/dist ./wwwroot/

# Uploads dir. NOTE: Railway's container filesystem is ephemeral — mount a Railway
# Volume at /app/wwwroot/uploads to keep uploaded images across redeploys.
RUN mkdir -p ./wwwroot/uploads

ENV ASPNETCORE_ENVIRONMENT=Production
# Railway injects PORT at runtime; Program.cs binds to it. 8080 is the fallback.
EXPOSE 8080

ENTRYPOINT ["dotnet", "PortfolioApi.dll"]
