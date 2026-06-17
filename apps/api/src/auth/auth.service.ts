import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  supplierId?: string | null;
}

type UserLike = {
  id: string;
  email: string;
  role: string;
  name: string;
  segment: string;
  supplierId?: string | null;
};

/** Vida del refresh token en días. */
const REFRESH_TTL_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El correo ya está registrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        segment: (dto.segment ?? 'B2C_HOGAR') as any,
      },
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return this.issueTokens(user);
  }

  /** Renueva el access token validando (y rotando) el refresh token. */
  async refresh(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    // Rotación: revoca el anterior y emite uno nuevo.
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
    return this.issueTokens(record.user);
  }

  /** Revoca un refresh token (logout). */
  async logout(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    await this.prisma.refreshToken
      .updateMany({ where: { tokenHash }, data: { revoked: true } })
      .catch(() => undefined);
    return { ok: true };
  }

  private async issueTokens(user: UserLike) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      supplierId: user.supplierId ?? null,
    };
    // Access token de vida corta.
    const accessToken = this.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' });

    // Refresh token opaco (aleatorio), guardado solo como hash.
    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86_400_000);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: this.hash(refreshToken), expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        segment: user.segment,
        supplierId: user.supplierId ?? null,
      },
    };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
