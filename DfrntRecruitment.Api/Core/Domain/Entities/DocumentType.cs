namespace DfrntRecruitment.Api.Core.Domain.Entities;

public enum AppliesTo { Applicant, ActiveCourier, Both }

public class DocumentType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsRequired { get; set; }
    public AppliesTo AppliesTo { get; set; } = AppliesTo.Applicant;
    public int? ValidityMonths { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
