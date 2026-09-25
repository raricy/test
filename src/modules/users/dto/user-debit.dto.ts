import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Min, IsInt } from 'class-validator';

export class UserDebitDto {
  @ApiProperty({
    example: 10050,
    description:
      'Количество в минимально возможном номинале (например, копейки для рублей)',
  })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idempotencyKey: string;
}
