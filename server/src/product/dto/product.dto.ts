import { IsNumber, IsString } from 'class-validator'

export class ProductDto {
	@IsString()
	name: string

	@IsString()
	description: string

	@IsString()
	image: string

	@IsString()
	categoryId: string

	@IsNumber()
	price: number
}
