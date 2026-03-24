namespace DfrntRecruitment.Api.Core.Domain.Entities;

public class TenantSettings
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = "DFRNT";
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#3bc7f4";
    public string? WelcomeMessage { get; set; }
    public string? RequiredDocuments { get; set; } // JSON
    public int? ActiveQuizId { get; set; }
}
