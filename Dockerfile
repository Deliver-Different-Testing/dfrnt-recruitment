FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Install Node.js for frontend build
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs

# Copy and restore .NET
COPY DfrntRecruitment.Api/DfrntRecruitment.Api.csproj DfrntRecruitment.Api/
RUN dotnet restore DfrntRecruitment.Api/DfrntRecruitment.Api.csproj

# Copy and build frontend
COPY package.json package-lock.json* ./
RUN npm ci
COPY src/ src/
COPY vite.config.ts tsconfig.json tsconfig.app.json index.html ./
RUN npm run build

# Copy and build .NET (frontend output goes to wwwroot)
COPY . .
RUN mkdir -p DfrntRecruitment.Api/wwwroot && cp -r dist/* DfrntRecruitment.Api/wwwroot/
RUN dotnet publish DfrntRecruitment.Api/DfrntRecruitment.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "DfrntRecruitment.Api.dll"]
