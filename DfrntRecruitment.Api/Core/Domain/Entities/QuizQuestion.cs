namespace DfrntRecruitment.Api.Core.Domain.Entities;

public enum QuestionType { MultiChoice, TrueFalse, Text }

public class QuizQuestion
{
    public int Id { get; set; }
    public int QuizId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public QuestionType QuestionType { get; set; }
    public string? Options { get; set; } // JSON array
    public string CorrectAnswer { get; set; } = string.Empty;
    public int Points { get; set; } = 1;
    public int SortOrder { get; set; }

    public Quiz Quiz { get; set; } = null!;
}
