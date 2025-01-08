import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  mintAddress: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  slippage: number;
}
