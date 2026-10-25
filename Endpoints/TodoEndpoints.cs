using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using TodoApp.Data;
using TodoApp.DTOs;
using TodoApp.Models;

namespace TodoApp.Endpoints;

public static class TodoEndpoints
{
    public static RouteGroupBuilder MapTodoEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/todos")
            .WithTags("Todos");

        group.MapGet("/", async (
            TodoDbContext db,
            string? search,
            bool? isCompleted,
            PriorityLevel? priority,
            string? category,
            string? sortBy,
            string? sortOrder) =>
        {
            IQueryable<TodoItem> query = db.Todos.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(term) || 
                                         (t.Description != null && t.Description.ToLower().Contains(term)));
            }

            if (isCompleted.HasValue)
            {
                query = query.Where(t => t.IsCompleted == isCompleted.Value);
            }

            if (priority.HasValue)
            {
                query = query.Where(t => t.Priority == priority.Value);
            }

            if (!string.IsNullOrWhiteSpace(category) && category != "All")
            {
                query = query.Where(t => t.Category.ToLower() == category.Trim().ToLower());
            }

            bool desc = string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);

            query = (sortBy?.ToLower()) switch
            {
                "duedate" => desc 
                    ? query.OrderByDescending(t => t.DueDate.HasValue).ThenByDescending(t => t.DueDate)
                    : query.OrderByDescending(t => t.DueDate.HasValue).ThenBy(t => t.DueDate),
                "priority" => desc 
                    ? query.OrderByDescending(t => t.Priority)
                    : query.OrderBy(t => t.Priority),
                "title" => desc 
                    ? query.OrderByDescending(t => t.Title)
                    : query.OrderBy(t => t.Title),
                _ => desc 
                    ? query.OrderBy(t => t.CreatedAt)
                    : query.OrderByDescending(t => t.CreatedAt)
            };

            var items = await query.ToListAsync();
            return TypedResults.Ok(items);
        })
        .WithName("GetTodos")
        .WithSummary("Get all todos with optional filtering and sorting");

        group.MapGet("/{id:int}", async Task<Results<Ok<TodoItem>, NotFound>> (int id, TodoDbContext db) =>
        {
            var item = await db.Todos.FindAsync(id);
            return item is not null ? TypedResults.Ok(item) : TypedResults.NotFound();
        })
        .WithName("GetTodoById")
        .WithSummary("Get a specific todo by ID");

        group.MapPost("/", async Task<Results<Created<TodoItem>, BadRequest<string>>> (CreateTodoDto dto, TodoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return TypedResults.BadRequest("Title is required.");
            }

            var item = new TodoItem
            {
                Title = dto.Title.Trim(),
                Description = dto.Description?.Trim(),
                DueDate = dto.DueDate,
                Priority = dto.Priority,
                Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            db.Todos.Add(item);
            await db.SaveChangesAsync();

            return TypedResults.Created($"/api/todos/{item.Id}", item);
        })
        .WithName("CreateTodo")
        .WithSummary("Create a new todo item");

        group.MapPut("/{id:int}", async Task<Results<Ok<TodoItem>, NotFound, BadRequest<string>>> (int id, UpdateTodoDto dto, TodoDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return TypedResults.BadRequest("Title is required.");
            }

            var item = await db.Todos.FindAsync(id);
            if (item is null)
            {
                return TypedResults.NotFound();
            }

            item.Title = dto.Title.Trim();
            item.Description = dto.Description?.Trim();
            item.DueDate = dto.DueDate;
            item.Priority = dto.Priority;
            item.Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim();

            if (!item.IsCompleted && dto.IsCompleted)
            {
                item.CompletedAt = DateTime.UtcNow;
            }
            else if (item.IsCompleted && !dto.IsCompleted)
            {
                item.CompletedAt = null;
            }
            item.IsCompleted = dto.IsCompleted;

            await db.SaveChangesAsync();
            return TypedResults.Ok(item);
        })
        .WithName("UpdateTodo")
        .WithSummary("Update an existing todo item");

        group.MapPatch("/{id:int}/toggle", async Task<Results<Ok<TodoItem>, NotFound>> (int id, TodoDbContext db) =>
        {
            var item = await db.Todos.FindAsync(id);
            if (item is null)
            {
                return TypedResults.NotFound();
            }

            item.IsCompleted = !item.IsCompleted;
            item.CompletedAt = item.IsCompleted ? DateTime.UtcNow : null;

            await db.SaveChangesAsync();
            return TypedResults.Ok(item);
        })
        .WithName("ToggleTodo")
        .WithSummary("Toggle the completion status of a todo");

        group.MapDelete("/{id:int}", async Task<Results<NoContent, NotFound>> (int id, TodoDbContext db) =>
        {
            var item = await db.Todos.FindAsync(id);
            if (item is null)
            {
                return TypedResults.NotFound();
            }

            db.Todos.Remove(item);
            await db.SaveChangesAsync();

            return TypedResults.NoContent();
        })
        .WithName("DeleteTodo")
        .WithSummary("Delete a todo item");

        group.MapDelete("/completed", async (TodoDbContext db) =>
        {
            var completedItems = await db.Todos.Where(t => t.IsCompleted).ToListAsync();
            db.Todos.RemoveRange(completedItems);
            var deletedCount = await db.SaveChangesAsync();

            return TypedResults.Ok(new { DeletedCount = deletedCount });
        })
        .WithName("DeleteCompletedTodos")
        .WithSummary("Delete all completed todos");

        group.MapGet("/stats", async (TodoDbContext db) =>
        {
            var now = DateTime.UtcNow;
            var total = await db.Todos.CountAsync();
            var completed = await db.Todos.CountAsync(t => t.IsCompleted);
            var pending = total - completed;
            var overdue = await db.Todos.CountAsync(t => !t.IsCompleted && t.DueDate.HasValue && t.DueDate.Value < now);
            var highPriority = await db.Todos.CountAsync(t => !t.IsCompleted && t.Priority == PriorityLevel.High);

            return TypedResults.Ok(new TodoStatsDto(total, completed, pending, overdue, highPriority));
        })
        .WithName("GetTodoStats")
        .WithSummary("Get aggregate task statistics");

        // Categories endpoint
        routes.MapGet("/api/categories", async (TodoDbContext db) =>
        {
            var categories = await db.Todos
                .AsNoTracking()
                .Select(t => t.Category)
                .ToListAsync();

            var result = categories
                .GroupBy(c => string.IsNullOrWhiteSpace(c) ? "General" : c.Trim())
                .Select(g => new CategoryCountDto(g.Key, g.Count()))
                .OrderBy(c => c.Name)
                .ToList();

            return TypedResults.Ok(result);
        })
        .WithTags("Categories")
        .WithName("GetCategories")
        .WithSummary("Get all categories and task counts");

        return group;
    }
}
