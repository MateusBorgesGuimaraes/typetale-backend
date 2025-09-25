import { UserRole } from 'src/user/entities/user.entity';

export type JwtPayload = {
  sub: string;
  role: UserRole;
};
