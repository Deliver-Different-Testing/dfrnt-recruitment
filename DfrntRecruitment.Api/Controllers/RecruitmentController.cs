using DfrntRecruitment.Api.Core.Domain;
using DfrntRecruitment.Api.Core.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DfrntRecruitment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecruitmentController(AppDbContext db) : ControllerBase
{
    [HttpGet("pipeline")]
    public async Task<IActionResult> GetPipeline()
    {
        var applicants = await db.Applicants
            .Include(a => a.Documents)
            .OrderByDescending(a => a.AppliedDate)
            .ToListAsync();

        var grouped = applicants.GroupBy(a => a.Status)
            .ToDictionary(g => g.Key.ToString(), g => g.ToList());

        return Ok(grouped);
    }

    [HttpPost("{applicantId:int}/notes")]
    public async Task<IActionResult> AddNote(int applicantId, [FromBody] AddNoteRequest request)
    {
        var note = new RecruitmentNote
        {
            ApplicantId = applicantId,
            Content = request.Content,
            CreatedBy = request.CreatedBy ?? "Admin"
        };
        db.RecruitmentNotes.Add(note);
        await db.SaveChangesAsync();
        return Ok(note);
    }

    [HttpGet("{applicantId:int}/history")]
    public async Task<IActionResult> GetHistory(int applicantId) =>
        Ok(await db.RecruitmentStages.Where(s => s.ApplicantId == applicantId)
            .OrderByDescending(s => s.CreatedDate).ToListAsync());
}

public record AddNoteRequest(string Content, string? CreatedBy);
