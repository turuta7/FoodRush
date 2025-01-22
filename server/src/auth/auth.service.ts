import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { AuthDto } from './dto/auth.dto'
import { faker } from '@faker-js/faker'
import { hash, verify } from 'argon2'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { RefreshTokenDto } from './dto/refresh-token.dto'

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService
	) {}

	async getNewTokens(refreshToken: string) {
		const result = await this.jwt.verifyAsync(refreshToken)

		console.log('====================================')
		console.log(result)
		console.log('====================================')
		if (!result) throw new UnauthorizedException('Invalid refresh token')

		const user = await this.prisma.user.findUnique({
			where: {
				id: result.id
			}
		})

		if (!user) {
			throw new NotFoundException('User not found')
			return {}
		}

		const tikens = await this.issueTokens(user.id)
		return { user: this.returnUserFields(user), ...tikens }
	}

	async login(dto: AuthDto) {
		const user = await this.valedateUser(dto)
		const tikens = await this.issueTokens(user.id)
		return { user: this.returnUserFields(user), ...tikens }
	}

	async register(dto: AuthDto) {
		const oldUser = await this.prisma.user.findUnique({
			where: {
				email: dto.email
			}
		})

		if (oldUser) throw new BadRequestException('User already registered')

		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				name: faker.person.firstName(),
				avatarPath: faker.image.avatar(),
				phone: faker.phone.number(),
				password: await hash(dto.password)
			}
		})

		const tikens = await this.issueTokens(user.id)
		return { user: this.returnUserFields(user), ...tikens }
	}

	private async issueTokens(userId: string) {
		const data = { id: userId }

		const accessToken = await this.jwt.sign(data, {
			expiresIn: '1h'
		})

		const refreshToken = await this.jwt.sign(data, {
			expiresIn: '7d'
		})

		return { accessToken, refreshToken }
	}

	private returnUserFields(user: User) {
		return {
			id: user.id,
			email: user.email
		}
	}

	private async valedateUser(dto: AuthDto) {
		console.log('========user============================')
		const user = await this.prisma.user.findUnique({
			where: {
				email: dto.email
			}
		})

		console.log(user)
		console.log('====================================')

		if (!user) throw new NotFoundException('User not found')

		const isValid = await verify(user.password, dto.password)
		if (!isValid) throw new UnauthorizedException('Invalid password')
		return user
	}
}
