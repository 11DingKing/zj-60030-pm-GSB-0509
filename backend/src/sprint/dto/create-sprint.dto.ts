import { IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  goal?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @IsNotEmpty()
  projectId: string;
}
