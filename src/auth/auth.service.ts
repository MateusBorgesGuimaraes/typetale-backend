import { UserService } from './../user/user.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { HashingService } from 'src/common/hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}
  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmailOrFail(loginDto.email);
    const error = new UnauthorizedException('Invalid email or password');

    if (!user) {
      throw error;
    }

    const isPasswordValid = this.hashingService.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw error;
    }

    const jwtPayload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(jwtPayload);

    return { accessToken };
  }
}
