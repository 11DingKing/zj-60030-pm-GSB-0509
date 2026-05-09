import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('评论')
@Controller('comments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: '获取任务的所有评论' })
  async findByTask(@Query('taskId') taskId: string, @Request() req) {
    return this.commentService.findByTask(taskId, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建评论（支持 @提及成员）' })
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentService.create(createCommentDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除评论' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.commentService.delete(id, req.user.id);
  }
}
