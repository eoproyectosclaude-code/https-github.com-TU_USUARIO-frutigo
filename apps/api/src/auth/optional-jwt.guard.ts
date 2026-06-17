import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT opcional: si hay token válido adjunta el usuario,
 * pero NO bloquea la petición si falta o es inválido.
 * Útil para permitir checkout de invitado y a la vez ligar pedidos a usuarios logueados.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }

  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
