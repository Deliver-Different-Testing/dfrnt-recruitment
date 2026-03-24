namespace DfrntRecruitment.Api.Core.Domain.Entities;

public enum ApplicantStatus
{
    Applied, Screening, Interview, DocumentCheck, QuizPending, Approved, Rejected, Withdrawn
}

public class Applicant
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public ApplicantStatus Status { get; set; } = ApplicantStatus.Applied;
    public DateTime AppliedDate { get; set; } = DateTime.UtcNow;
    public DateTime StatusChangedDate { get; set; } = DateTime.UtcNow;
    public string? VehicleType { get; set; }
    public bool HasOwnVehicle { get; set; }
    public string? LicenseType { get; set; }
    public DateTime? LicenseExpiry { get; set; }
    public string? PreferredRegions { get; set; }
    public string? Notes { get; set; }
    public string? Source { get; set; }

    public ICollection<ApplicantDocument> Documents { get; set; } = [];
    public ICollection<RecruitmentStage> Stages { get; set; } = [];
    public ICollection<RecruitmentNote> RecruitmentNotes { get; set; } = [];
    public ICollection<QuizAttempt> QuizAttempts { get; set; } = [];
}
