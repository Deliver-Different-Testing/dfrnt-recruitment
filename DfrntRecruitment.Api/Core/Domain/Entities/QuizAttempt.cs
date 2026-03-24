namespace DfrntRecruitment.Api.Core.Domain.Entities;

public class QuizAttempt
{
    public int Id { get; set; }
    public int ApplicantId { get; set; }
    public int QuizId { get; set; }
    public DateTime StartedDate { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedDate { get; set; }
    public int Score { get; set; }
    public bool Passed { get; set; }
    public int? TimeTaken { get; set; }

    public Applicant Applicant { get; set; } = null!;
    public Quiz Quiz { get; set; } = null!;
    public ICollection<QuizAnswer> Answers { get; set; } = [];
}
