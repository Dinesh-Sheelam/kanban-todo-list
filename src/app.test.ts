import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addTask, getTasks, updateTask, deleteTask, clearDoneTasks, TaskNotFoundError, InvalidInputError, Task } from './app';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; }
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock crypto.randomUUID
let uuidCounter = 0;
Object.defineProperty(globalThis.crypto, 'randomUUID', {
  value: () => `mock-uuid-${uuidCounter++}`,
  writable: true
});

beforeEach(() => {
  localStorage.clear();
  uuidCounter = 0;
});

describe('Kanban App Core Logic', () => {
  it('should add a new task successfully', () => {
    const task = addTask('Test Task', 'Description', '2023-12-31', ['tag1', 'tag2'], 'John Doe');
    const tasks = getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toEqual({
      id: 'mock-uuid-0',
      title: 'Test Task',
      description: 'Description',
      status: 'todo',
      dueDate: '2023-12-31',
      tags: ['tag1', 'tag2'],
      assignee: 'John Doe'
    });
  });

  it('should update an existing task successfully', () => {
    const task = addTask('Original Title', 'Original Desc');
    const updatedTask = updateTask(task.id, { title: 'Updated Title', status: 'doing', tags: ['new-tag'] });
    const tasks = getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Updated Title');
    expect(tasks[0].status).toBe('doing');
    expect(tasks[0].tags).toEqual(['new-tag']);
    expect(updatedTask.title).toBe('Updated Title');
  });

  it('should delete a task successfully', () => {
    const task1 = addTask('Task One', 'Desc One');
    const task2 = addTask('Task Two', 'Desc Two');
    deleteTask(task1.id);
    const tasks = getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task2.id);
  });

  it('should clear all done tasks', () => {
    addTask('Todo Task', 'Desc', undefined, [], undefined);
    const doingTask = addTask('Doing Task', 'Desc', undefined, [], undefined);
    updateTask(doingTask.id, { status: 'doing' });
    const doneTask = addTask('Done Task', 'Desc', undefined, [], undefined);
    updateTask(doneTask.id, { status: 'done' });

    expect(getTasks()).toHaveLength(3);
    clearDoneTasks();
    const remainingTasks = getTasks();
    expect(remainingTasks).toHaveLength(2);
    expect(remainingTasks.some(t => t.status === 'done')).toBeFalsy();
  });

  it('should throw InvalidInputError for empty title when adding task', () => {
    expect(() => addTask('', 'Description')).toThrow(InvalidInputError);
    expect(() => addTask('   ', 'Description')).toThrow(InvalidInputError);
  });

  it('should throw TaskNotFoundError when updating a non-existent task', () => {
    expect(() => updateTask('non-existent-id', { title: 'New Title' })).toThrow(TaskNotFoundError);
  });
});
