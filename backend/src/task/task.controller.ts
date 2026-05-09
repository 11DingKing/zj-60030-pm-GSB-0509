import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { TaskStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('任务')
@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: '获取任务列表（支持筛选排序）' })
  async findAll(@Query() query: QueryTasksDto, @Request() req) {
    return this.taskService.findAll(query, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个任务详情' })
  async findById(@Param('id') id: string, @Request() req) {
    return this.taskService.findById(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建任务' })
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.taskService.create(createTaskDto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新任务' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.taskService.update(id, updateTaskDto, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新任务状态（事务处理并记录日志）' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
    @Request() req,
  ) {
    return this.taskService.updateStatus(id, status, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除任务' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.taskService.delete(id, req.user.id);
  }
}
