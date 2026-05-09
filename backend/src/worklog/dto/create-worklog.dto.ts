import { IsNotEmpty, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class CreateWorklogDto {
  @IsNotEmpty()
  taskId: string;

  @IsNotEmpty()
  @IsDateString()
  workDate: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.5)
  @Max(24)
  hours: number;

  @IsOptional()
  description?: string;
}
