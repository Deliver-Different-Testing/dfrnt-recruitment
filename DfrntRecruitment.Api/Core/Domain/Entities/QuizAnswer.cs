namespace DfrntRecruitment.Api.Core.Domain.Entities;

public class QuizAnswer
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public string Answer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int Points { get; set; }

    public QuizAttempt Attempt { get; set; } = null!;
    public QuizQuestion Question { get; set; } = null!;
}
