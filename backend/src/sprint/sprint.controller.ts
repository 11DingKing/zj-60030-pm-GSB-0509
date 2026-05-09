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
import { Roles } from '../common/decorators/roles.decorator';
import { SprintService } from './sprint.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sprint')
@Controller('sprints')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class SprintController {
  constructor(private sprintService: SprintService) {}

  @Get()
  @ApiOperation({ summary: '获取项目下的所有 Sprint' })
  async findByProject(@Query('projectId') projectId: string, @Request() req) {
    return this.sprintService.findByProject(projectId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个 Sprint 详情' })
  async findById(@Param('id') id: string, @Request() req) {
    return this.sprintService.findById(id, req.user.id);
  }

  @Get(':id/kanban')
  @ApiOperation({ summary: '获取 Sprint 看板视图数据' })
  async getKanban(@Param('id') id: string, @Request() req) {
    return this.sprintService.getKanban(id, req.user.id);
  }

  @Get(':id/retrospective')
  @ApiOperation({ summary: '获取 Sprint 回顾数据' })
  async getRetrospective(@Param('id') id: string, @Request() req) {
    return this.sprintService.getRetrospective(id, req.user.id);
  }

  @Post()
  @Roles(UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '创建 Sprint（仅项目经理）' })
  async create(@Body() createSprintDto: CreateSprintDto, @Request() req) {
    return this.sprintService.create(createSprintDto, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新 Sprint' })
  async update(
    @Param('id') id: string,
    @Body() updateSprintDto: UpdateSprintDto,
    @Request() req,
  ) {
    return this.sprintService.update(id, updateSprintDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除 Sprint' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.sprintService.delete(id, req.user.id);
  }
}
