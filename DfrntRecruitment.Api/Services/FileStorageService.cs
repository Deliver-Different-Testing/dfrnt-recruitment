namespace DfrntRecruitment.Api.Services;

public class FileStorageService(IConfiguration config)
{
    private readonly string _basePath = config["Storage:BasePath"] ?? "uploads";

    public async Task<(string FilePath, string FileName)> SaveAsync(IFormFile file)
    {
        Directory.CreateDirectory(_basePath);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var filePath = Path.Combine(_basePath, fileName);
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);
        return (filePath, file.FileName);
    }
}
