import { IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  taskId: string;

  @IsArray()
  @IsOptional()
  mentionIds?: string[];
}
