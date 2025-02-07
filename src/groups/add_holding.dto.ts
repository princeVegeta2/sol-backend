import { IsNotEmpty, IsString } from "class-validator";

export class AddHoldingDto {
    @IsString()
    @IsNotEmpty()
    mintAddress: string;

    @IsString()
    @IsNotEmpty()
    groupName: string;
}