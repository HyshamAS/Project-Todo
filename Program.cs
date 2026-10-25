using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using TodoApp.Data;
using TodoApp.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Add SQLite Database Context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Data Source=todos.db";
builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseSqlite(connectionString));

// Add OpenAPI / Scalar API documentation
builder.Services.AddOpenApi();

// Add CORS if accessing from other local origins
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseCors();

// Serve static files from wwwroot (index.html, styles.css, app.js)
app.UseDefaultFiles();
app.UseStaticFiles();

// Register Todo API endpoints
app.MapTodoEndpoints();

// Initialize and seed database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TodoDbContext>();
    await DbInitializer.InitializeAsync(db);
}

app.Run();
