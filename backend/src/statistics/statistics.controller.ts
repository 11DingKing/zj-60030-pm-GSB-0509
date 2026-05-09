import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../common/guards/roles.guard";
import { StatisticsService } from "./statistics.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("统计报表")
@Controller("statistics")
@UseGuards(AuthGuard("jwt"), RolesGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get("burndown/:sprintId")
  @ApiOperation({ summary: "获取燃尽图数据" })
  async getBurnDownChart(@Param("sprintId") sprintId: string, @Request() req) {
    return this.statisticsService.getBurnDownChart(sprintId, req.user.id);
  }

  @Get("status/:sprintId")
  @ApiOperation({ summary: "获取 Sprint 任务状态分布" })
  async getSprintStatusDistribution(
    @Param("sprintId") sprintId: string,
    @Request() req,
  ) {
    return this.statisticsService.getSprintStatusDistribution(
      sprintId,
      req.user.id,
    );
  }

  @Get("velocity")
  @ApiOperation({ summary: "获取迭代速率趋势" })
  async getVelocityTrend(
    @Query("projectId") projectId: string,
    @Request() req,
  ) {
    return this.statisticsService.getVelocityTrend(projectId, req.user.id);
  }

  @Get("worklog")
  @ApiOperation({ summary: "获取各成员累计工时" })
  async getMemberWorklog(
    @Query("projectId") projectId: string,
    @Request() req,
  ) {
    return this.statisticsService.getMemberWorklog(projectId, req.user.id);
  }

  @Get("bugs")
  @ApiOperation({ summary: "获取 Bug 数量趋势（近6个Sprint）" })
  async getBugTrend(@Query("projectId") projectId: string, @Request() req) {
    return this.statisticsService.getBugTrend(projectId, req.user.id);
  }
}
