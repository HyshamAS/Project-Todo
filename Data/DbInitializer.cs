using Microsoft.EntityFrameworkCore;
using TodoApp.Models;

namespace TodoApp.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(TodoDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Todos.AnyAsync())
        {
            return; // DB already has data
        }

        var sampleTodos = new List<TodoItem>
        {
            new()
            {
                Title = "Welcome to your .NET Todo App! 🎉",
                Description = "This task list is powered by ASP.NET Core, EF Core, and SQLite. Try checking off this item!",
                Priority = PriorityLevel.High,
                Category = "Getting Started",
                DueDate = DateTime.UtcNow.AddHours(2),
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow.AddMinutes(-30)
            },
            new()
            {
                Title = "Review project architecture and endpoints",
                Description = "Explore the REST API endpoints and interactive documentation at /scalar/v1.",
                Priority = PriorityLevel.Medium,
                Category = "Work",
                DueDate = DateTime.UtcNow.AddDays(1),
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            },
            new()
            {
                Title = "Buy groceries for dinner",
                Description = "Olive oil, fresh basil, cherry tomatoes, and pasta.",
                Priority = PriorityLevel.Low,
                Category = "Personal",
                DueDate = DateTime.UtcNow.AddDays(2),
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow.AddHours(-5)
            },
            new()
            {
                Title = "Setup automated backups",
                Description = "Configure daily backups for database storage and cloud sync.",
                Priority = PriorityLevel.High,
                Category = "Work",
                DueDate = DateTime.UtcNow.AddDays(-1), // overdue to showcase overdue indicator
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new()
            {
                Title = "Explore dark mode and filtering features",
                Description = "Toggle the theme switcher and filter tasks by categories or priority badges.",
                Priority = PriorityLevel.Low,
                Category = "Getting Started",
                DueDate = DateTime.UtcNow.AddDays(3),
                IsCompleted = true,
                CompletedAt = DateTime.UtcNow.AddHours(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            }
        };

        context.Todos.AddRange(sampleTodos);
        await context.SaveChangesAsync();
    }
}
