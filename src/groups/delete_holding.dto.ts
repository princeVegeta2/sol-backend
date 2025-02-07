import { IsNotEmpty, IsString } from "class-validator";

export class DeleteHoldingDto {
    @IsString()
    @IsNotEmpty()
    mintAddress: string;

    @IsString()
    @IsNotEmpty()
    groupName: string;
}