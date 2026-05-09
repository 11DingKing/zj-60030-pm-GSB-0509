import { IsOptional, IsEnum, IsInt, IsDateString, Min, Max, IsString } from 'class-validator';
import { TaskPriority, TaskType, TaskStatus } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(13)
  storyPoints?: number;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  assigneeId?: string;

  @IsOptional()
  sprintId?: string;
}
