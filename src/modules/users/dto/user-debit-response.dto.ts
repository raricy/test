import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UserDebitResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty({ type: String, example: '10050' })
  @Transform(({ value }) => value.toString())
  newBalance: string;
}
