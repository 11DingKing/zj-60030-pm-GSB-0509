import { Module } from "@nestjs/common";
import { CommentService } from "./comment.service";
import { CommentController } from "./comment.controller";
import { PrismaModule } from "../common/prisma/prisma.module";
import { NotificationModule } from "../notification/notification.module";

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [CommentService],
  controllers: [CommentController],
  exports: [CommentService],
})
export class CommentModule {}
