import { IsNotEmpty, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsArray()
  @IsOptional()
  memberIds?: string[];
}
