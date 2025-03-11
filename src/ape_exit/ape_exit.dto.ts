import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateApeExitDto {
    @IsString()
    @IsNotEmpty()
    mintAddress: string;
  
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    amount: number;
}