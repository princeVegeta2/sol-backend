import { IsString, IsNotEmpty } from "class-validator";

export class DeleteGroupDto {
    @IsString()
    @IsNotEmpty()
    groupName: string;
}