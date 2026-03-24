namespace DfrntRecruitment.Api.Core.Domain.Entities;

public enum DocumentStatus { Pending, Verified, Rejected, Expired }

public class ApplicantDocument
{
    public int Id { get; set; }
    public int ApplicantId { get; set; }
    public int DocumentTypeId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime UploadedDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiryDate { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Pending;
    public string? VerifiedBy { get; set; }
    public DateTime? VerifiedDate { get; set; }
    public string? RejectionReason { get; set; }

    public Applicant Applicant { get; set; } = null!;
    public DocumentType DocumentType { get; set; } = null!;
}
