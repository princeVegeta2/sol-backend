import { IsNotEmpty, IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class StartPerpDto {
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value)) // Ensure it's a float
  amount: number;

  @IsString()
  @IsNotEmpty()
  side: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  leverage: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  stopLoss?: number;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  takeProfit?: number;
}