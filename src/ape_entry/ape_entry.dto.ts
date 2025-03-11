import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateApeEntryDto {
  @IsString()
  @IsNotEmpty()
  mintAddress: string;

  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value)) // Ensure it's a float
  amount: number;
}