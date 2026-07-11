-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('FINCA', 'COOPERATIVA', 'DISTRIBUIDORA');

-- CreateEnum
CREATE TYPE "SaleUnit" AS ENUM ('KG', 'HALF_QUINTAL', 'QUINTAL');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('FRUTAS', 'VERDURAS', 'LEGUMBRES', 'TUBERCULOS', 'HIERBAS');

-- CreateEnum
CREATE TYPE "CustomerSegment" AS ENUM ('B2C_HOGAR', 'B2B_HORECA', 'DISTRIBUIDOR', 'BUQUE_NAVIERA');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CARRITO', 'PENDIENTE_PAGO', 'PAGADO', 'EN_PREPARACION', 'EN_RUTA', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'YAPPY', 'VISA', 'CRYPTO', 'ACH_SWIFT', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INICIADO', 'PENDIENTE', 'AUTORIZADO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "Port" AS ENUM ('BALBOA', 'CRISTOBAL', 'COLON');

-- CreateEnum
CREATE TYPE "ProvisioningStatus" AS ENUM ('SOLICITADO', 'CONFIRMADO', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('COMPRADOR', 'PROVEEDOR', 'REPARTIDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('DISPONIBLE', 'EN_RUTA', 'INACTIVO');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTO', 'AUTO', 'VAN', 'CAMION');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ASIGNADO', 'RECOGIDO', 'EN_RUTA', 'ENTREGADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "Vessel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imo" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvisioningRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "vesselId" TEXT NOT NULL,
    "port" "Port" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "status" "ProvisioningStatus" NOT NULL DEFAULT 'SOLICITADO',
    "manifestRef" TEXT NOT NULL,
    "taxExempt" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvisioningRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvisioningLine" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "unit" "SaleUnit" NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ProvisioningLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SupplierType" NOT NULL,
    "province" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "ruc" TEXT,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEs" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "descriptionEs" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "certifications" TEXT[],
    "shipProvisioning" BOOLEAN NOT NULL DEFAULT false,
    "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "unit" "SaleUnit" NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicle" "VehicleType" NOT NULL DEFAULT 'MOTO',
    "plate" TEXT NOT NULL,
    "status" "DriverStatus" NOT NULL DEFAULT 'INACTIVO',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'ASIGNADO',
    "pickupAddress" TEXT NOT NULL,
    "dropoffAddress" TEXT NOT NULL,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryLocation" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'COMPRADOR',
    "segment" "CustomerSegment" NOT NULL DEFAULT 'B2C_HOGAR',
    "supplierId" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "referredById" TEXT,
    "referralCreditUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstOrderPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "segment" "CustomerSegment" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "deliveryType" TEXT NOT NULL,
    "subtotalUsd" DOUBLE PRECISION NOT NULL,
    "loyaltyDiscountUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "buyerFeeUsd" DOUBLE PRECISION NOT NULL,
    "deliveryUsd" DOUBLE PRECISION NOT NULL,
    "taxUsd" DOUBLE PRECISION NOT NULL,
    "pointsRedeemed" INTEGER NOT NULL DEFAULT 0,
    "loyaltyCreditUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referralCreditUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsd" DOUBLE PRECISION NOT NULL,
    "taxExempt" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productNameEs" TEXT NOT NULL,
    "productNameEn" TEXT NOT NULL,
    "unit" "SaleUnit" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceUsd" DOUBLE PRECISION NOT NULL,
    "subtotalUsd" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amountUsd" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INICIADO',
    "cryptoAsset" TEXT,
    "providerData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProvisioningRequest_reference_key" ON "ProvisioningRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPrice_productId_unit_key" ON "ProductPrice"("productId", "unit");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_orderId_key" ON "Delivery"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE INDEX "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- AddForeignKey
ALTER TABLE "ProvisioningRequest" ADD CONSTRAINT "ProvisioningRequest_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvisioningLine" ADD CONSTRAINT "ProvisioningLine_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProvisioningRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryLocation" ADD CONSTRAINT "DeliveryLocation_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
