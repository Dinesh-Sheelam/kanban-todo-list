# Architecture — Kanban To-Do List

# Design Document: Kanban To-Do List

## High-Level Design (HLD)

### System Overview
The Kanban To-Do List is a single-page application, entirely client-side. The `index.html` file serves as the entry point, containing all static UI elements and styling. It loads `src/main.ts`, which orchestrates the UI interactions by importing and utilizing the core application logic from `src/app.ts`. Data persistence is handled via `localStorage`.

```
index.html
    ├── <style> (Dark theme, responsive CSS)
    ├── <script type="module" src="./src/main.ts"></script>
    └── <div id="app"> (Root UI container)

src/main.ts
    └── Imports src/app.ts (Wires UI events to app logic, updates DOM)

src/app.ts
    └── Exports core logic (Data management, task operations, validation)
```

### Component Responsibilities
*   **`index.html`**: Defines the static HTML structure, applies styling, and bootstraps the `main.ts` script.
*   **`src/main.ts`**: Handles DOM manipulation, event listening, and rendering based on data from `src/app.ts`.
*   **`src/app.ts`**: Manages application state, task data, business logic, and `localStorage` interactions.

### Data Design
**In-Memory:**
*   `tasks`: An array of `Task` objects, representing the current state of all tasks.
*   `activeTaskId`: The ID of the task currently being viewed/edited in the dialog.

**`localStorage`:**
*   **Key:** `kanbanTasks`
*   **Shape:** `string` (JSON stringified `Task[]`)

```typescript
// src/app.ts (Conceptual type definition)
type TaskStatus = 'todo' | 'in-progress' | 'done';

interface Task {
    id: string; // crypto.randomUUID()
    title: string;
    description: string;
    status: TaskStatus;
    dueDate?: string; // ISO 8601 date string (YYYY-MM-DD)
    tags: string[]; // e.g., ["work", "urgent"]
    assignee?: string;
}
```

## Low-Level Design (LLD)

### Logic Core Specification (`src/app.ts`)
*   `TaskStatus`: Type alias for `'todo' | 'in-progress' | 'done'`.
*   `Task`: Interface defining task structure (`id`, `title`, `description`, `status`, `dueDate?`, `tags`, `assignee?`).
*   `AppError`: Class for application-specific errors.
*   `initApp(): Task[]`: Initializes the app, loads tasks from `localStorage`, or returns an empty array.
*   `getTasks(): Task[]`: Returns the current array of all tasks.
*   `addTask(title: string, description: string, status: TaskStatus, dueDate?: string, tags?: string[], assignee?: string): Task`: Creates and adds a new task, returns the new task.
*   `updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): Task`: Updates an existing task's properties, returns the updated task.
*   `deleteTask(id: string): void`: Removes a task by its ID.
*   `clearDoneTasks(): void`: Removes all tasks with `status: 'done'`.
*   `saveTasks(tasks: Task[]): void`: Persists the given tasks array to `localStorage`.
*   `moveTask(id: string, newStatus: TaskStatus): Task`: Changes a task's status, returns the moved task.
*   `generateId(): string`: Returns a collision-proof unique ID for new entities.

### UI Wireframe

```
+-------------------------------------------------------------------+
| Kanban To-Do List                                       [Clear Done]|
+-------------------------------------------------------------------+
|                                                                   |
| +------------+   +----------------+   +----------------+          |
| |    To Do   |   |   In Progress  |   |      Done      |          |
| |------------|   |----------------|   |----------------|          |
| | [Task 1]   |   | [Task 3]       |   | [Task 5]       |          |
| | [Task 2]   |   |                |   |                |          |
| |            |   |                |   |                |          |
| | +--------+ |   | +------------+ |   | +------------+ |          |
| | | Add Task | |   | | Add Task   | |   | | Add Task   | |          |
| +------------+   +----------------+   +----------------+          |
|                                                                   |
+-------------------------------------------------------------------+
|                                                                   |
|                +---------------------------------+                |
|                |       Task Details / Edit       |                |
|                |---------------------------------|                |
|                | Title: [_______________________]|                |
|                | Description: [_________________]|                |
|                | Status: [Dropdown: To Do ▼]     |                |
|                | Due Date: [____/__/__]          |                |
|                | Tags: [_________]               |                |
|                | Assignee: [_________]           |                |
|                |                                 |                |
|                | [Save]           [Delete] [Close]|                |
|                +---------------------------------+                |
|                                                                   |
+-------------------------------------------------------------------+
```

### Interaction Flow
1.  **User opens app**: `main.ts` calls `app.initApp()`, renders existing tasks to their respective columns.
2.  **User clicks "Add Task"**: `main.ts` opens the task dialog (pre-filled with default status), `app.addTask()` is called on save.
3.  **User clicks a task card**: `main.ts` opens the task dialog, populating fields with `app.getTasks()` data for the clicked task.
4.  **User edits task in dialog**: `main.ts` calls `app.updateTask()` on save, re-renders the updated task.
5.  **User drags a task**: `main.ts` detects drag-and-drop, calls `app.moveTask()` with new status, re-renders the board.
6.  **User clicks "Clear Done"**: `main.ts` calls `app.clearDoneTasks()`, re-renders the 'Done' column.

### Key Risks
1.  **Risk**: Complex DOM manipulation for drag-and-drop without a framework could lead to brittle and hard-to-maintain code.
    *   **Mitigation**: Implement drag-and-drop using native HTML5 Drag and Drop API, encapsulating logic within `main.ts` and relying on `app.moveTask()` for state updates, keeping DOM updates minimal and targeted.
2.  **Risk**: Managing task attributes (due date, tags, assignee) in the UI and `localStorage` without type-checking safeguards from a framework could introduce data inconsistencies.
    *   **Mitigation**: `src/app.ts` will strictly validate all incoming data against the `Task` interface before processing or saving. `main.ts` will ensure form inputs are correctly parsed/formatted before passing to `app.ts`.
3.  **Risk**: Performance degradation with a large number of tasks due to full re-renders of the board on every state change.
    *   **Mitigation**: Implement targeted DOM updates in `main.ts` where possible (e.g., only update a single task card or column after a move/edit) instead of re-rendering the entire board.
