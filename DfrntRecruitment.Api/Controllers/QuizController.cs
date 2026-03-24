using DfrntRecruitment.Api.Core.Domain;
using DfrntRecruitment.Api.Core.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DfrntRecruitment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await db.Quizzes.Include(q => q.Questions.OrderBy(qq => qq.SortOrder)).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var quiz = await db.Quizzes.Include(q => q.Questions.OrderBy(qq => qq.SortOrder))
            .FirstOrDefaultAsync(q => q.Id == id);
        return quiz is null ? NotFound() : Ok(quiz);
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var quiz = await db.Quizzes.Include(q => q.Questions.OrderBy(qq => qq.SortOrder))
            .FirstOrDefaultAsync(q => q.IsActive);
        return quiz is null ? NotFound(new { error = "No active quiz" }) : Ok(quiz);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Quiz quiz)
    {
        db.Quizzes.Add(quiz);
        await db.SaveChangesAsync();
        return Ok(quiz);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Quiz updated)
    {
        var quiz = await db.Quizzes.FindAsync(id);
        if (quiz is null) return NotFound();
        quiz.Title = updated.Title;
        quiz.Description = updated.Description;
        quiz.PassingScore = updated.PassingScore;
        quiz.IsActive = updated.IsActive;
        quiz.TimeLimit = updated.TimeLimit;
        await db.SaveChangesAsync();
        return Ok(quiz);
    }

    [HttpPost("{quizId:int}/questions")]
    public async Task<IActionResult> AddQuestion(int quizId, [FromBody] QuizQuestion question)
    {
        question.QuizId = quizId;
        db.QuizQuestions.Add(question);
        await db.SaveChangesAsync();
        return Ok(question);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitQuizRequest request)
    {
        var quiz = await db.Quizzes.Include(q => q.Questions).FirstOrDefaultAsync(q => q.Id == request.QuizId);
        if (quiz is null) return NotFound();

        var attempt = new QuizAttempt
        {
            ApplicantId = request.ApplicantId,
            QuizId = request.QuizId,
            StartedDate = request.StartedDate ?? DateTime.UtcNow,
            CompletedDate = DateTime.UtcNow
        };

        int totalScore = 0;
        foreach (var ans in request.Answers)
        {
            var question = quiz.Questions.FirstOrDefault(q => q.Id == ans.QuestionId);
            var isCorrect = question != null && string.Equals(question.CorrectAnswer, ans.Answer, StringComparison.OrdinalIgnoreCase);
            var points = isCorrect ? (question?.Points ?? 0) : 0;
            totalScore += points;

            attempt.Answers.Add(new QuizAnswer
            {
                QuestionId = ans.QuestionId,
                Answer = ans.Answer,
                IsCorrect = isCorrect,
                Points = points
            });
        }

        attempt.Score = totalScore;
        attempt.Passed = totalScore >= quiz.PassingScore;
        attempt.TimeTaken = request.TimeTaken;

        db.QuizAttempts.Add(attempt);
        await db.SaveChangesAsync();
        return Ok(new { attempt.Id, attempt.Score, attempt.Passed, totalQuestions = quiz.Questions.Count });
    }
}

public record SubmitQuizRequest(int ApplicantId, int QuizId, DateTime? StartedDate, int? TimeTaken, List<AnswerInput> Answers);
public record AnswerInput(int QuestionId, string Answer);
