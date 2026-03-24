using DfrntRecruitment.Api.Core.Domain;
using DfrntRecruitment.Api.Core.Domain.Entities;
using DfrntRecruitment.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DfrntRecruitment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DocumentController(AppDbContext db, FileStorageService storage) : ControllerBase
{
    // Document Types CRUD
    [HttpGet("types")]
    public async Task<IActionResult> GetTypes() =>
        Ok(await db.DocumentTypes.OrderBy(d => d.SortOrder).ToListAsync());

    [HttpPost("types")]
    public async Task<IActionResult> CreateType([FromBody] DocumentType docType)
    {
        db.DocumentTypes.Add(docType);
        await db.SaveChangesAsync();
        return Ok(docType);
    }

    [HttpPut("types/{id:int}")]
    public async Task<IActionResult> UpdateType(int id, [FromBody] DocumentType updated)
    {
        var docType = await db.DocumentTypes.FindAsync(id);
        if (docType is null) return NotFound();
        docType.Name = updated.Name;
        docType.Description = updated.Description;
        docType.IsRequired = updated.IsRequired;
        docType.AppliesTo = updated.AppliesTo;
        docType.ValidityMonths = updated.ValidityMonths;
        docType.SortOrder = updated.SortOrder;
        docType.IsActive = updated.IsActive;
        await db.SaveChangesAsync();
        return Ok(docType);
    }

    // Document Upload
    [HttpPost("upload/{applicantId:int}/{documentTypeId:int}")]
    public async Task<IActionResult> Upload(int applicantId, int documentTypeId, IFormFile file)
    {
        var (filePath, fileName) = await storage.SaveAsync(file);
        var docType = await db.DocumentTypes.FindAsync(documentTypeId);

        var doc = new ApplicantDocument
        {
            ApplicantId = applicantId,
            DocumentTypeId = documentTypeId,
            FileName = fileName,
            FilePath = filePath,
            FileSize = file.Length,
            ContentType = file.ContentType,
            ExpiryDate = docType?.ValidityMonths != null ? DateTime.UtcNow.AddMonths(docType.ValidityMonths.Value) : null
        };
        db.ApplicantDocuments.Add(doc);
        await db.SaveChangesAsync();
        return Ok(doc);
    }

    [HttpPut("{id:int}/verify")]
    public async Task<IActionResult> Verify(int id, [FromBody] VerifyRequest request)
    {
        var doc = await db.ApplicantDocuments.FindAsync(id);
        if (doc is null) return NotFound();
        doc.Status = request.Approved ? DocumentStatus.Verified : DocumentStatus.Rejected;
        doc.VerifiedBy = request.VerifiedBy ?? "Admin";
        doc.VerifiedDate = DateTime.UtcNow;
        doc.RejectionReason = request.Approved ? null : request.Reason;
        await db.SaveChangesAsync();
        return Ok(doc);
    }

    [HttpGet("applicant/{applicantId:int}")]
    public async Task<IActionResult> GetByApplicant(int applicantId) =>
        Ok(await db.ApplicantDocuments.Include(d => d.DocumentType)
            .Where(d => d.ApplicantId == applicantId).ToListAsync());
}

public record VerifyRequest(bool Approved, string? Reason, string? VerifiedBy);
