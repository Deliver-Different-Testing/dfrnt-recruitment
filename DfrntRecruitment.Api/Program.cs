using DfrntRecruitment.Api.Core.Domain;
using DfrntRecruitment.Api.Middleware;
using DfrntRecruitment.Api.Services;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .WriteTo.Console());

// Database — parse Railway DATABASE_URL or fall back to config
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
string connectionString;
if (!string.IsNullOrEmpty(databaseUrl))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
}
else
{
    connectionString = builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("No DATABASE_URL or ConnectionStrings:Default configured");
}

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<FileStorageService>();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Auto-migrate
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    Log.Information("Database migration completed successfully");

    // Seed document types if empty
    if (!db.DocumentTypes.Any())
    {
        db.DocumentTypes.AddRange(
            new DfrntRecruitment.Api.Core.Domain.Entities.DocumentType { Name = "Driver's Licence", Description = "Current NZ driver's licence (front and back)", IsRequired = true, AppliesTo = DfrntRecruitment.Api.Core.Domain.Entities.AppliesTo.Applicant, ValidityMonths = 60, SortOrder = 1, IsActive = true },
            new DfrntRecruitment.Api.Core.Domain.Entities.DocumentType { Name = "Vehicle Registration", Description = "Current vehicle registration certificate", IsRequired = true, AppliesTo = DfrntRecruitment.Api.Core.Domain.Entities.AppliesTo.Applicant, ValidityMonths = 12, SortOrder = 2, IsActive = true },
            new DfrntRecruitment.Api.Core.Domain.Entities.DocumentType { Name = "Vehicle Insurance", Description = "Comprehensive or third-party vehicle insurance", IsRequired = true, AppliesTo = DfrntRecruitment.Api.Core.Domain.Entities.AppliesTo.Applicant, ValidityMonths = 12, SortOrder = 3, IsActive = true },
            new DfrntRecruitment.Api.Core.Domain.Entities.DocumentType { Name = "Proof of Address", Description = "Utility bill or bank statement (within last 3 months)", IsRequired = false, AppliesTo = DfrntRecruitment.Api.Core.Domain.Entities.AppliesTo.Applicant, SortOrder = 4, IsActive = true },
            new DfrntRecruitment.Api.Core.Domain.Entities.DocumentType { Name = "Passport or NZ ID", Description = "Valid photo ID for identity verification", IsRequired = false, AppliesTo = DfrntRecruitment.Api.Core.Domain.Entities.AppliesTo.Applicant, SortOrder = 5, IsActive = true },
            new DfrntRecruitment.Api.Core.Domain.Entities.DocumentType { Name = "WOF Certificate", Description = "Current Warrant of Fitness", IsRequired = true, AppliesTo = DfrntRecruitment.Api.Core.Domain.Entities.AppliesTo.Applicant, ValidityMonths = 6, SortOrder = 6, IsActive = true }
        );
        db.SaveChanges();
        Log.Information("Seeded default document types");
    }
}
catch (Exception ex)
{
    Log.Error(ex, "Database migration failed — app will start without DB");
}

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseSerilogRequestLogging();
app.UseCors();
app.UseStaticFiles();
app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));
app.MapFallbackToFile("index.html");

app.Run();
