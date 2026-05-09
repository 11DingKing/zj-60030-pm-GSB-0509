import { IsOptional, IsDateString, IsArray, IsString } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsArray()
  @IsOptional()
  memberIds?: string[];
}
