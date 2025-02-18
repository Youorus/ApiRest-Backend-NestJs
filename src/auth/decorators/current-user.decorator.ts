import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from 'src/dto/create-user.dto';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDto => {
    const request = ctx.switchToHttp().getRequest();

    console.log('✅ Email utilisateur trouvé:', request.user.sub);

    return { email: request.user.sub };
  },
);
