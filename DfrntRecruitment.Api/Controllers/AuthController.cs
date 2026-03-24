using DfrntRecruitment.Api.Core.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DfrntRecruitment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db) : ControllerBase
{
    // Fallback hardcoded creds (backward compat)
    private const string FallbackUser = "admin";
    private const string FallbackPass = "dfrnt2026!";

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Try AdminUsers table first
            var user = await db.AdminUsers.FirstOrDefaultAsync(u =>
                (u.Username == request.Username || u.Email == request.Username) && u.IsActive);

            if (user != null && user.PasswordHash != null)
            {
                if (BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                {
                    user.LastLoginDate = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                    var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{user.Username}:{DateTime.UtcNow:o}"));
                    return Ok(new { token, user = new { username = user.Username, role = user.Role, email = user.Email, displayName = user.DisplayName } });
                }
            }
        }
        catch
        {
            // DB might not have the table yet - fall through to hardcoded
        }

        // Fallback to hardcoded credentials
        if (request.Username == FallbackUser && request.Password == FallbackPass)
            return Ok(new { token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{request.Username}:{DateTime.UtcNow:o}")), user = new { username = request.Username, role = "Admin" } });

        return Unauthorized(new { error = "Invalid credentials" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        // Always return success to prevent email enumeration
        var user = await db.AdminUsers.FirstOrDefaultAsync(u =>
            (u.Email == request.Email || u.Username == request.Email) && u.IsActive);

        if (user != null)
        {
            user.ResetToken = Guid.NewGuid().ToString("N");
            user.ResetExpiry = DateTime.UtcNow.AddHours(1);
            await db.SaveChangesAsync();

            // Log the reset link (no email service configured)
            var resetUrl = $"{Request.Scheme}://{Request.Host}/admin/reset-password?token={user.ResetToken}";
            Console.WriteLine($"[PASSWORD RESET] User: {user.Username}, Email: {user.Email}, Link: {resetUrl}");
        }

        return Ok(new { message = "If an account exists with that email, a password reset link has been generated. Please contact your administrator." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await db.AdminUsers.FirstOrDefaultAsync(u =>
            u.ResetToken == request.Token && u.ResetExpiry > DateTime.UtcNow && u.IsActive);

        if (user == null)
            return BadRequest(new { error = "Invalid or expired reset link" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ResetToken = null;
        user.ResetExpiry = null;
        await db.SaveChangesAsync();

        return Ok(new { message = "Password has been reset successfully" });
    }
}

public record LoginRequest(string Username, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
