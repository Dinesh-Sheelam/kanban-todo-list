import { addTask, getTasks, updateTask, deleteTask, clearDoneTasks, Task, TaskNotFoundError, InvalidInputError } from './app';

const taskColumns = {
  todo: document.getElementById('todo-column') as HTMLElement,
  doing: document.getElementById('doing-column') as HTMLElement,
  done: document.getElementById('done-column') as HTMLElement,
};
const addTaskForm = document.getElementById('add-task-form') as HTMLFormElement;
const taskTitleInput = document.getElementById('new-task-title') as HTMLInputElement;
const taskDescriptionInput = document.getElementById('new-task-description') as HTMLTextAreaElement;
const taskDueDateInput = document.getElementById('new-task-due-date') as HTMLInputElement;
const taskTagsInput = document.getElementById('new-task-tags') as HTMLInputElement;
const taskAssigneeInput = document.getElementById('new-task-assignee') as HTMLInputElement;
const clearDoneButton = document.getElementById('clear-done-button') as HTMLButtonElement;
const taskDetailModal = document.getElementById('task-detail-modal') as HTMLDialogElement;
const closeModalButton = document.getElementById('close-modal-button') as HTMLButtonElement;
const editTaskForm = document.getElementById('edit-task-form') as HTMLFormElement;
const editTaskIdInput = document.getElementById('edit-task-id') as HTMLInputElement;
const editTaskTitleInput = document.getElementById('edit-task-title') as HTMLInputElement;
const editTaskDescriptionInput = document.getElementById('edit-task-description') as HTMLTextAreaElement;
const editTaskStatusSelect = document.getElementById('edit-task-status') as HTMLSelectElement;
const editTaskDueDateInput = document.getElementById('edit-task-due-date') as HTMLInputElement;
const editTaskTagsInput = document.getElementById('edit-task-tags') as HTMLInputElement;
const editTaskAssigneeInput = document.getElementById('edit-task-assignee') as HTMLInputElement;
const deleteTaskButton = document.getElementById('delete-task-button') as HTMLButtonElement;

function renderTasks(): void {
  taskColumns.todo.innerHTML = '';
  taskColumns.doing.innerHTML = '';
  taskColumns.done.innerHTML = '';

  const tasks = getTasks();
  tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    taskColumns[task.status].appendChild(taskElement);
  });
}

function createTaskElement(task: Task): HTMLElement {
  const article = document.createElement('article');
  article.className = 'task-card';
  article.dataset.taskId = task.id;
  article.innerHTML = `
    <h3>${task.title}</h3>
    <p>${task.description}</p>
    ${task.dueDate ? `<p class="task-meta">Due: ${task.dueDate}</p>` : ''}
    ${task.assignee ? `<p class="task-meta">Assignee: ${task.assignee}</p>` : ''}
    ${task.tags.length > 0 ? `<p class="task-meta">Tags: ${task.tags.join(', ')}</p>` : ''}
  `;
  article.addEventListener('click', () => openTaskDetailModal(task.id));
  return article;
}

function openTaskDetailModal(taskId: string): void {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    alert('Task not found!');
    return;
  }

  editTaskIdInput.value = task.id;
  editTaskTitleInput.value = task.title;
  editTaskDescriptionInput.value = task.description;
  editTaskStatusSelect.value = task.status;
  editTaskDueDateInput.value = task.dueDate || '';
  editTaskTagsInput.value = task.tags.join(', ');
  editTaskAssigneeInput.value = task.assignee || '';

  taskDetailModal.showModal();
}

addTaskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const title = taskTitleInput.value;
    const description = taskDescriptionInput.value;
    const dueDate = taskDueDateInput.value || undefined;
    const tags = taskTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    const assignee = taskAssigneeInput.value || undefined;
    addTask(title, description, dueDate, tags, assignee);
    taskTitleInput.value = '';
    taskDescriptionInput.value = '';
    taskDueDateInput.value = '';
    taskTagsInput.value = '';
    taskAssigneeInput.value = '';
    renderTasks();
  } catch (error) {
    if (error instanceof InvalidInputError) {
      alert(error.message);
    } else {
      console.error('Failed to add task:', error);
      alert('An unexpected error occurred while adding the task.');
    }
  }
});

editTaskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const id = editTaskIdInput.value;
    const updates: Partial<Task> = {
      title: editTaskTitleInput.value,
      description: editTaskDescriptionInput.value,
      status: editTaskStatusSelect.value as 'todo' | 'doing' | 'done',
      dueDate: editTaskDueDateInput.value || undefined,
      tags: editTaskTagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      assignee: editTaskAssigneeInput.value || undefined,
    };
    updateTask(id, updates);
    taskDetailModal.close();
    renderTasks();
  } catch (error) {
    if (error instanceof TaskNotFoundError || error instanceof InvalidInputError) {
      alert(error.message);
    } else {
      console.error('Failed to update task:', error);
      alert('An unexpected error occurred while updating the task.');
    }
  }
});

deleteTaskButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to delete this task?')) {
    try {
      const id = editTaskIdInput.value;
      deleteTask(id);
      taskDetailModal.close();
      renderTasks();
    } catch (error) {
      if (error instanceof TaskNotFoundError) {
        alert(error.message);
      } else {
        console.error('Failed to delete task:', error);
        alert('An unexpected error occurred while deleting the task.');
      }
    }
  }
});

closeModalButton.addEventListener('click', () => {
  taskDetailModal.close();
});

clearDoneButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all tasks in the "Done" column?')) {
    clearDoneTasks();
    renderTasks();
  }
});

// Initial render
renderTasks();
