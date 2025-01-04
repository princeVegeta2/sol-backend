import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateExitDto {
    @IsString()
    @IsNotEmpty()
    mintAddress: string;
  
    @IsNumber()
    @IsPositive()
    amount: number;
}