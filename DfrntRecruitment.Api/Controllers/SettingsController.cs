using DfrntRecruitment.Api.Core.Domain;
using DfrntRecruitment.Api.Core.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DfrntRecruitment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var settings = await db.TenantSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new TenantSettings();
            db.TenantSettings.Add(settings);
            await db.SaveChangesAsync();
        }
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] TenantSettings updated)
    {
        var settings = await db.TenantSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new TenantSettings();
            db.TenantSettings.Add(settings);
        }
        settings.CompanyName = updated.CompanyName;
        settings.LogoUrl = updated.LogoUrl;
        settings.PrimaryColor = updated.PrimaryColor;
        settings.WelcomeTitle = updated.WelcomeTitle;
        settings.WelcomeSubtitle = updated.WelcomeSubtitle;
        settings.ShowVehicleStep = updated.ShowVehicleStep;
        settings.ShowQuizStep = updated.ShowQuizStep;
        settings.ActiveQuizId = updated.ActiveQuizId;
        await db.SaveChangesAsync();
        return Ok(settings);
    }

    // Public endpoint for applicant portal — returns settings + active doc types
    [HttpGet("portal")]
    public async Task<IActionResult> GetPortalConfig()
    {
        var settings = await db.TenantSettings.FirstOrDefaultAsync() ?? new TenantSettings();
        var docTypes = await db.DocumentTypes
            .Where(d => d.IsActive && (d.AppliesTo == AppliesTo.Applicant || d.AppliesTo == AppliesTo.Both))
            .OrderBy(d => d.SortOrder)
            .ToListAsync();

        Quiz? activeQuiz = null;
        if (settings.ShowQuizStep && settings.ActiveQuizId.HasValue)
        {
            activeQuiz = await db.Quizzes
                .Include(q => q.Questions.OrderBy(qq => qq.SortOrder))
                .FirstOrDefaultAsync(q => q.Id == settings.ActiveQuizId && q.IsActive);
        }
        // If no specific quiz set, try first active
        if (settings.ShowQuizStep && activeQuiz == null)
        {
            activeQuiz = await db.Quizzes
                .Include(q => q.Questions.OrderBy(qq => qq.SortOrder))
                .FirstOrDefaultAsync(q => q.IsActive);
        }

        var steps = await db.PortalSteps
            .Where(s => s.IsActive)
            .OrderBy(s => s.SortOrder)
            .ToListAsync();

        return Ok(new
        {
            settings.CompanyName,
            settings.WelcomeTitle,
            settings.WelcomeSubtitle,
            settings.ShowVehicleStep,
            settings.ShowQuizStep,
            settings.PrimaryColor,
            documentTypes = docTypes,
            quiz = activeQuiz,
            steps
        });
    }
}
