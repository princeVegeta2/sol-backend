import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  mintAddress: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value)) // Ensure it's a float
  amount: number;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10)) // Ensure it's an integer
  slippage: number;
}
