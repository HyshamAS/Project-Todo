# TaskFlow • Modern .NET Todo Web Application

A full-stack Todo web application built with **ASP.NET Core (.NET 10)**, **Entity Framework Core**, **SQLite**, and a modern, responsive Single-Page Application (SPA) frontend.

---

## ✨ Features

- **Full Task Lifecycle (CRUD)**: Create, view, edit, complete/uncomplete, and delete tasks.
- **Persistent Storage**: Backed by **SQLite** using **Entity Framework Core** with auto-creation and initial seed data on startup.
- **Rich Task Metadata**:
  - Task title & notes/description
  - Priority levels with distinct badges: `High` (🔴), `Medium` (🟡), `Low` (🟢)
  - Custom categories / tags (e.g. `Work`, `Personal`, `Health`)
  - Due dates with relative time calculations (`Today`, `Tomorrow`, `Overdue by X days`)
- **Dashboard & Statistics**:
  - Live counts for Total, Pending, Completed, and Overdue tasks
  - Dynamic completion progress bar
- **Filter & Search Controls**:
  - Real-time instant search across titles and descriptions (debounced)
  - Status tabs: `All`, `Active`, `Completed`
  - Dynamic category chips with item counts
  - Priority dropdown filter
  - Sorting options: Created Date, Due Date, Priority, Title
- **Bulk Actions**:
  - Single-click "Clear Completed"
- **Modern User Experience**:
  - Dark mode & Light mode toggle with `localStorage` persistence
  - Glassmorphic card styling, smooth animations, and hover transitions
  - Floating toast notification system
  - Edit modal with keyboard accessibility (Escape to dismiss, Enter to add)
- **Interactive API Documentation**:
  - OpenAPI 3.0 integration with **Scalar API Reference** accessible at `/scalar/v1`

---

## 🏗️ Architecture & Project Structure

```
TodoApp/
├── Data/
│   ├── TodoDbContext.cs       # EF Core SQLite database context
│   └── DbInitializer.cs       # Database initialization & seed data
├── DTOs/
│   └── TodoDTOs.cs            # Request/Response Data Transfer Objects
├── Endpoints/
│   └── TodoEndpoints.cs       # RESTful Minimal API route mappings
├── Models/
│   ├── PriorityLevel.cs       # Priority enum (Low, Medium, High)
│   └── TodoItem.cs            # Database domain entity
├── Properties/
│   └── launchSettings.json    # Local development server ports
├── wwwroot/                   # Frontend SPA
│   ├── index.html             # Application markup & dashboard
│   ├── css/
│   │   └── styles.css         # Modern responsive CSS design system
│   └── js/
│       └── app.js             # State management, REST sync, UI renderer
├── Program.cs                 # App bootstrap, middleware pipeline & DI
├── TodoApp.csproj             # .NET project configuration
└── todos.db                   # Auto-generated SQLite database
```

---

## 🚀 Getting Started

### Prerequisites

- [.NET SDK 10.0](https://dotnet.microsoft.com/download) (or .NET 8.0+)

### Running the Application

1. Open PowerShell / terminal in the project directory:
   ```bash
   cd c:\dev\second-project
   ```

2. Run the application:
   ```bash
   dotnet run --launch-profile http
   ```

3. Open your browser and navigate to:
   - **Web Application UI**: [http://localhost:5284](http://localhost:5284)
   - **Interactive API Docs (Scalar)**: [http://localhost:5284/scalar/v1](http://localhost:5284/scalar/v1)

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/todos` | List tasks (supports `search`, `isCompleted`, `priority`, `category`, `sortBy`, `sortOrder`) |
| `GET` | `/api/todos/{id}` | Get single task details by ID |
| `POST` | `/api/todos` | Create a new task |
| `PUT` | `/api/todos/{id}` | Update an existing task |
| `PATCH` | `/api/todos/{id}/toggle` | Toggle task completion status |
| `DELETE` | `/api/todos/{id}` | Delete a task |
| `DELETE` | `/api/todos/completed` | Bulk delete all completed tasks |
| `GET` | `/api/todos/stats` | Aggregated statistics (total, completed, pending, overdue, high-priority) |
| `GET` | `/api/categories` | List unique categories with item counts |
