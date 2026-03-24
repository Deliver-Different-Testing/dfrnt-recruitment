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
}

public record LoginRequest(string Username, string Password);
