import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('用户')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取所有用户' })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户' })
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
