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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('项目')
@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @ApiOperation({ summary: '获取我参与的所有项目' })
  async findAll(@Request() req) {
    return this.projectService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个项目详情' })
  async findById(@Param('id') id: string, @Request() req) {
    return this.projectService.findById(id, req.user.id);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: '获取项目首页数据' })
  async getDashboard(@Param('id') id: string, @Request() req) {
    return this.projectService.getDashboard(id, req.user.id);
  }

  @Post()
  @Roles(UserRole.PROJECT_MANAGER)
  @ApiOperation({ summary: '创建项目（仅项目经理）' })
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectService.create(createProjectDto, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req,
  ) {
    return this.projectService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.projectService.delete(id, req.user.id);
  }
}
