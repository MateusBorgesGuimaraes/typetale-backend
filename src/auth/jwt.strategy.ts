import { UserService } from './../user/user.service';
import { JwtPayload } from './types/jwt-payload.type';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET not found');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }
  async validate(payload: JwtPayload) {
    const user = await this.userService.findByIdOrFail(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Login needed.');
    }
    return user;
  }
}
