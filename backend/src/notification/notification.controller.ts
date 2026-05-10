import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { NotificationService } from "./notification.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

@ApiTags("通知")
@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
@ApiBearerAuth()
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "获取当前用户通知列表" })
  async findByUser(@Request() req) {
    return this.notificationService.findByUser(req.user.id);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "获取未读通知数" })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put(":id/read")
  @ApiOperation({ summary: "标记通知为已读" })
  async markAsRead(@Param("id") id: string, @Request() req) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Put("read-all")
  @ApiOperation({ summary: "标记所有通知为已读" })
  async markAllAsRead(@Request() req) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }
}
