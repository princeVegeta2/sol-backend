import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @IsNotEmpty()
  mintAddress: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  source: string;
}
