using DfrntRecruitment.Api.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DfrntRecruitment.Api.Core.Domain;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Applicant> Applicants => Set<Applicant>();
    public DbSet<ApplicantDocument> ApplicantDocuments => Set<ApplicantDocument>();
    public DbSet<DocumentType> DocumentTypes => Set<DocumentType>();
    public DbSet<RecruitmentStage> RecruitmentStages => Set<RecruitmentStage>();
    public DbSet<RecruitmentNote> RecruitmentNotes => Set<RecruitmentNote>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<QuizQuestion> QuizQuestions => Set<QuizQuestion>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();
    public DbSet<TenantSettings> TenantSettings => Set<TenantSettings>();
    public DbSet<PortalStep> PortalSteps => Set<PortalStep>();
    public DbSet<ApplicantStepData> ApplicantStepData => Set<ApplicantStepData>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Applicant>().HasIndex(a => a.Email).IsUnique();
        modelBuilder.Entity<Applicant>().Property(a => a.Status).HasConversion<string>();
        modelBuilder.Entity<ApplicantDocument>().Property(d => d.Status).HasConversion<string>();
        modelBuilder.Entity<DocumentType>().Property(d => d.AppliesTo).HasConversion<string>();
        modelBuilder.Entity<QuizQuestion>().Property(q => q.QuestionType).HasConversion<string>();

        // Performance indexes
        modelBuilder.Entity<Applicant>().HasIndex(a => a.Status);
        modelBuilder.Entity<Applicant>().HasIndex(a => a.AppliedDate);
        modelBuilder.Entity<ApplicantDocument>().HasIndex(a => a.ApplicantId);
        modelBuilder.Entity<RecruitmentStage>().HasIndex(s => s.ApplicantId);
        modelBuilder.Entity<RecruitmentNote>().HasIndex(n => n.ApplicantId);
    }
}
