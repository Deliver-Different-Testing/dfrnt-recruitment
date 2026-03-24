using Microsoft.AspNetCore.Mvc;

namespace DfrntRecruitment.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // Simple admin login — hardcoded for now, replace with proper auth later
    private const string AdminUser = "admin";
    private const string AdminPass = "dfrnt2026!";

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (request.Username == AdminUser && request.Password == AdminPass)
            return Ok(new { token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{request.Username}:{DateTime.UtcNow:o}")), user = new { username = request.Username, role = "admin" } });

        return Unauthorized(new { error = "Invalid credentials" });
    }
}

public record LoginRequest(string Username, string Password);
