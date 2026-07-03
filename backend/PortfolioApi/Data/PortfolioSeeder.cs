using PortfolioApi.Models;

namespace PortfolioApi.Data;

public static class PortfolioSeeder
{
    public static void Seed(PortfolioDbContext db)
    {
        if (!db.Profiles.Any())
        {
            db.Profiles.Add(new Profile
            {
                Name = "Mate G.",
                Role = "Full Stack Developer",
                Tagline = "I build digital experiences that make an impact.",
                Bio = "Full Stack Developer crafting modern, responsive and user-friendly web applications with clean code and great design.",
                GithubUrl = "https://github.com/",
                LinkedInUrl = "https://linkedin.com/",
                Email = "hello@example.com",
            });
        }

        if (!db.Stats.Any())
        {
            db.Stats.AddRange(
                new Stat { Label = "Projects", Value = "5+", Icon = "briefcase", SortOrder = 1 },
                new Stat { Label = "Years Exp.", Value = "2+", Icon = "calendar", SortOrder = 2 },
                new Stat { Label = "Dedication", Value = "100%", Icon = "sparkles", SortOrder = 3 },
                new Stat { Label = "Learning", Value = "∞", Icon = "infinity", SortOrder = 4 });
        }

        if (!db.Projects.Any())
        {
            db.Projects.AddRange(
                new Project { Title = "ShopEase", Description = "E-commerce platform with modern UI/UX.", Icon = "shopping-bag", Accent = "violet", Tags = new() { "Next.js", "Tailwind", "Stripe" }, RepoUrl = "https://github.com/", LiveUrl = "https://example.com/", Featured = true, SortOrder = 1 },
                new Project { Title = "Chatify", Description = "Real-time chat app with socket integration.", Icon = "message-circle", Accent = "blue", Tags = new() { "React", "Socket.io", "Node.js" }, RepoUrl = "https://github.com/", LiveUrl = "https://example.com/", Featured = true, SortOrder = 2 },
                new Project { Title = "TaskFlow", Description = "Productivity app to organize daily tasks.", Icon = "check-square", Accent = "green", Tags = new() { "Next.js", "MongoDB", "Tailwind" }, RepoUrl = "https://github.com/", LiveUrl = "https://example.com/", Featured = true, SortOrder = 3 },
                new Project { Title = "MovieBox", Description = "Browse movies, trailers and cast info.", Icon = "film", Accent = "orange", Tags = new() { "React", "TMDB API", "CSS" }, RepoUrl = "https://github.com/", LiveUrl = "https://example.com/", Featured = true, SortOrder = 4 },
                new Project { Title = "Fintrack", Description = "Track income, expenses and financial goals.", Icon = "trending-up", Accent = "violet", Tags = new() { "Next.js", "MongoDB", "Chart.js" }, RepoUrl = "https://github.com/", LiveUrl = "https://example.com/", Featured = true, SortOrder = 5 });
        }

        if (!db.Skills.Any())
        {
            db.Skills.AddRange(
                new Skill { Name = "React", Icon = "react", Category = "Frontend", SortOrder = 1 },
                new Skill { Name = "Next.js", Icon = "nextjs", Category = "Frontend", SortOrder = 2 },
                new Skill { Name = "Node.js", Icon = "nodejs", Category = "Backend", SortOrder = 3 },
                new Skill { Name = "MongoDB", Icon = "mongodb", Category = "Database", SortOrder = 4 },
                new Skill { Name = "Tailwind CSS", Icon = "tailwind", Category = "Frontend", SortOrder = 5 },
                new Skill { Name = "TypeScript", Icon = "typescript", Category = "Language", SortOrder = 6 },
                new Skill { Name = "Git", Icon = "git", Category = "Tooling", SortOrder = 7 },
                new Skill { Name = "Docker", Icon = "docker", Category = "Tooling", SortOrder = 8 });
        }

        db.SaveChanges();
    }
}
