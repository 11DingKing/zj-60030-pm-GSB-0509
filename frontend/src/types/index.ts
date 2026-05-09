export enum UserRole {
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  DEVELOPER = 'DEVELOPER',
}

export enum SprintStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum TaskPriority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TaskType {
  REQUIREMENT = 'REQUIREMENT',
  BUG = 'BUG',
  OPTIMIZATION = 'OPTIMIZATION',
  TECH_DEBT = 'TECH_DEBT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  TESTING = 'TESTING',
  DONE = 'DONE',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  ownerId: string;
  owner?: User;
  members?: User[];
  sprints?: Sprint[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  projectId: string;
  tasks?: Task[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  type: TaskType;
  storyPoints: number;
  status: TaskStatus;
  dueDate?: string;
  assigneeId?: string;
  creatorId: string;
  sprintId?: string;
  projectId: string;
  assignee?: User;
  creator?: User;
  statusLogs?: TaskStatusLog[];
  comments?: Comment[];
  worklogs?: Worklog[];
  _count?: { comments: number; worklogs: number };
  createdAt: string;
  updatedAt: string;
}

export interface TaskStatusLog {
  id: string;
  taskId: string;
  userId: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  changedAt: string;
  user?: User;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author?: User;
  mentions?: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Worklog {
  id: string;
  taskId: string;
  userId: string;
  workDate: string;
  hours: number;
  description?: string;
  user?: User;
  task?: { id: string; title: string };
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface KanbanColumn {
  status: TaskStatus;
  tasks: Task[];
  count: number;
}

export interface KanbanData {
  sprint: {
    id: string;
    name: string;
    status: SprintStatus;
  };
  columns: KanbanColumn[];
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    testing: number;
    done: number;
  };
}
