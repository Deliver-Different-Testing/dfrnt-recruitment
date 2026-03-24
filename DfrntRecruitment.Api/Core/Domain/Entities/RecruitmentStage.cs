namespace DfrntRecruitment.Api.Core.Domain.Entities;

public class RecruitmentStage
{
    public int Id { get; set; }
    public int ApplicantId { get; set; }
    public string Stage { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public Applicant Applicant { get; set; } = null!;
}
