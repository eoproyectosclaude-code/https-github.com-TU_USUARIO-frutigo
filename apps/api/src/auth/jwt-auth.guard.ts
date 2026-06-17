import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protege rutas exigiendo un Bearer JWT válido. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
