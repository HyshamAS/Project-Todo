using System.ComponentModel.DataAnnotations;
using TodoApp.Models;

namespace TodoApp.DTOs;

public record CreateTodoDto(
    [Required] [MaxLength(200)] string Title,
    [MaxLength(1000)] string? Description,
    DateTime? DueDate,
    PriorityLevel Priority = PriorityLevel.Medium,
    string? Category = "General"
);

public record UpdateTodoDto(
    [Required] [MaxLength(200)] string Title,
    [MaxLength(1000)] string? Description,
    bool IsCompleted,
    DateTime? DueDate,
    PriorityLevel Priority,
    string? Category
);

public record TodoStatsDto(
    int Total,
    int Completed,
    int Pending,
    int Overdue,
    int HighPriority
);

public record CategoryCountDto(
    string Name,
    int Count
);
