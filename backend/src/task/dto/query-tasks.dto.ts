import { IsOptional, IsEnum, IsString } from 'class-validator';
import { TaskPriority, TaskType, TaskStatus } from '@prisma/client';

export class QueryTasksDto {
  @IsOptional()
  projectId?: string;

  @IsOptional()
  sprintId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
