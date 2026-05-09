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
import { WorklogService } from './worklog.service';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('工时记录')
@Controller('worklogs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class WorklogController {
  constructor(private worklogService: WorklogService) {}

  @Get()
  @ApiOperation({ summary: '获取任务的工时记录或用户自己的工时记录' })
  async findByTaskOrUser(@Query('taskId') taskId: string, @Request() req) {
    if (taskId) {
      return this.worklogService.findByTask(taskId, req.user.id);
    }
    return this.worklogService.findByUser(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建工时记录' })
  async create(@Body() createWorklogDto: CreateWorklogDto, @Request() req) {
    return this.worklogService.create(createWorklogDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除工时记录' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.worklogService.delete(id, req.user.id);
  }
}
