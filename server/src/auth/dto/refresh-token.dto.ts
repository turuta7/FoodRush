import { IsOptional, IsString, MinLength } from 'class-validator'

export class RefreshTokenDto {
	// @IsOptional()
	@IsString()
	refreshToken: string
}
