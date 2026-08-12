type TaskId = string;

export interface Task {
  id: TaskId;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  dueDate?: string; // YYYY-MM-DD format
  tags: string[];
  assignee?: string;
}

export class TaskNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskNotFoundError';
  }
}

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

const STORAGE_KEY = 'kanban-tasks';

function generateId(): TaskId {
  return crypto.randomUUID();
}

function validateTaskInput(task: Partial<Task>): void {
  if (task.title !== undefined && (typeof task.title !== 'string' || task.title.trim() === '')) {
    throw new InvalidInputError('Task title cannot be empty.');
  }
  if (task.description !== undefined && typeof task.description !== 'string') {
    throw new InvalidInputError('Task description must be a string.');
  }
  if (task.status !== undefined && !['todo', 'doing', 'done'].includes(task.status)) {
    throw new InvalidInputError('Invalid task status.');
  }
  if (task.dueDate !== undefined && task.dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
    throw new InvalidInputError('Due date must be in YYYY-MM-DD format.');
  }
  if (task.tags !== undefined && (!Array.isArray(task.tags) || !task.tags.every(tag => typeof tag === 'string')) ) {
    throw new InvalidInputError('Tags must be an array of strings.');
  }
  if (task.assignee !== undefined && typeof task.assignee !== 'string') {
    throw new InvalidInputError('Assignee must be a string.');
  }
}

export function getTasks(): Task[] {
  const tasksJson = localStorage.getItem(STORAGE_KEY);
  return tasksJson ? JSON.parse(tasksJson) : [];
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function addTask(title: string, description: string, dueDate?: string, tags: string[] = [], assignee?: string): Task {
  validateTaskInput({ title, description, dueDate, tags, assignee });
  const tasks = getTasks();
  const newTask: Task = {
    id: generateId(),
    title: title.trim(),
    description: description.trim(),
    status: 'todo',
    dueDate: dueDate || undefined,
    tags: tags.map(tag => tag.trim()).filter(tag => tag !== ''),
    assignee: assignee ? assignee.trim() : undefined,
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: TaskId, updates: Partial<Omit<Task, 'id'>>): Task {
  validateTaskInput(updates);
  const tasks = getTasks();
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    throw new TaskNotFoundError(`Task with ID ${id} not found.`);
  }
  const updatedTask = { ...tasks[taskIndex], ...updates };
  // Ensure tags are always an array of strings
  if (updatedTask.tags && !Array.isArray(updatedTask.tags)) {
    updatedTask.tags = String(updatedTask.tags).split(',').map(tag => tag.trim()).filter(tag => tag !== '');
  }
  tasks[taskIndex] = updatedTask;
  saveTasks(tasks);
  return updatedTask;
}

export function deleteTask(id: TaskId): void {
  const tasks = getTasks();
  const initialLength = tasks.length;
  const filteredTasks = tasks.filter(task => task.id !== id);
  if (filteredTasks.length === initialLength) {
    throw new TaskNotFoundError(`Task with ID ${id} not found.`);
  }
  saveTasks(filteredTasks);
}

export function clearDoneTasks(): void {
  const tasks = getTasks();
  const filteredTasks = tasks.filter(task => task.status !== 'done');
  saveTasks(filteredTasks);
}

export function getTaskById(id: TaskId): Task | undefined {
  const tasks = getTasks();
  return tasks.find(task => task.id === id);
}
