import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { canApplyReferral, generateReferralCode, normalizeReferralCode } from '@frutigo/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto, RegisterDto } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  supplierId?: string | null;
}

type UserLike = {
  id: string; email: string; role: string; name: string; segment: string;
  supplierId?: string | null; referralCode?: string | null;
};

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

    // Código de referido propio (determinista) + aplicar el código de quien lo invitó.
    const referralCode = generateReferralCode(`${user.id}|${user.name}`);
    let referredById: string | null = null;
    let welcome = 0;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: normalizeReferralCode(dto.referralCode) },
      });
      if (
        referrer &&
        canApplyReferral({ newUserCode: referralCode, referrerCode: referrer.referralCode ?? '', alreadyReferred: false })
      ) {
        referredById = referrer.id;
        welcome = 5; // crédito de bienvenida al referido
      }
    }

    const saved = await this.prisma.user.update({
      where: { id: user.id },
      data: { referralCode, referredById, referralCreditUsd: welcome },
    });

    return this.issueTokens(saved);
  }

  /** Perfil enriquecido del usuario autenticado (incluye referidos y crédito). */
  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, segment: true, supplierId: true,
        points: true, referralCode: true, referralCreditUsd: true,
        _count: { select: { referrals: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Sesión inválida');
    const { _count, ...rest } = user as typeof user & { _count: { referrals: number } };
    return { ...rest, referralsCount: _count.referrals };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    await this.prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
    return this.issueTokens(record.user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hash(refreshToken);
    await this.prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } }).catch(() => undefined);
    return { ok: true };
  }

  private async issueTokens(user: UserLike) {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role, supplierId: user.supplierId ?? null };
    const accessToken = this.jwt.sign(payload, { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' });

    const refreshToken = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86_400_000);
    await this.prisma.refreshToken.create({ data: { userId: user.id, tokenHash: this.hash(refreshToken), expiresAt } });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id, email: user.email, name: user.name, role: user.role,
        segment: user.segment, supplierId: user.supplierId ?? null, referralCode: user.referralCode ?? null,
      },
    };
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
