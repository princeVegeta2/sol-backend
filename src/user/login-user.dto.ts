import {  IsBoolean, IsEmail, IsNotEmpty } from "class-validator";

export class LoginUserDto {
    @IsNotEmpty()
    password: string;

    @IsEmail()
    email: string;

    @IsBoolean()
    staySignedIn: boolean;
}