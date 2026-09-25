import {
  Controller,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  SerializeOptions,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDebitDto } from './dto/user-debit.dto';
import { UserDebitResponseDto } from './dto/user-debit-response.dto';
import { BalanceLogAction } from '../common/database/enums/balance-log-action.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post(':userId/debit')
  @ApiOperation({
    summary: 'Списать баланс на кошельке по идентификатору пользователя',
  })
  @ApiResponse({ status: HttpStatus.OK, type: UserDebitResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND })
  @SerializeOptions({ type: UserDebitResponseDto })
  @HttpCode(HttpStatus.OK)
  async debit(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UserDebitDto,
  ): Promise<UserDebitResponseDto> {
    const { balance } = await this.usersService.debit(
      userId,
      BigInt(dto.amount),
      BalanceLogAction.DEBIT,
      dto.idempotencyKey,
    );

    return {
      userId,
      newBalance: balance.toString(),
    };
  }
}
