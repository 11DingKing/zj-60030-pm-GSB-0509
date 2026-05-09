import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class UpdateSprintDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  goal?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;
}
