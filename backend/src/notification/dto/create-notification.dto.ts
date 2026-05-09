import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateNotificationDto {
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  commentId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;
}
