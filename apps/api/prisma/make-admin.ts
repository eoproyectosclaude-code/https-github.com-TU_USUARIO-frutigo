import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Asigna el rol ADMIN a un usuario por correo.
 * Uso: npm run make-admin -- correo@dominio.com
 */
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Uso: npm run make-admin -- correo@dominio.com');
    process.exit(1);
  }

  const user = await prisma.user
    .update({ where: { email }, data: { role: 'ADMIN' } })
    .catch(() => null);

  if (!user) {
    console.error(`❌ Usuario no encontrado: ${email}`);
    console.error('   Registra primero la cuenta desde la app y vuelve a intentar.');
    process.exit(1);
  }

  console.log(`✅ ${email} ahora tiene rol ADMIN.`);
}

main().finally(() => prisma.$disconnect());
