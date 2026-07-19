import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateHeldBillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  hold_name: string;
}
