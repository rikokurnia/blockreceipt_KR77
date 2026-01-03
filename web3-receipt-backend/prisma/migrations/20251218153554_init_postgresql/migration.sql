-- CreateEnum
CREATE TYPE "Role" AS ENUM ('auditor', 'cfo', 'finance_admin', 'vendor');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('pending', 'processing', 'verified', 'failed', 'pending_approval', 'rejected');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('draft', 'pending_vendor', 'pending_cfo', 'active', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('between', 'less_than', 'greater_than', 'equals');

-- CreateEnum
CREATE TYPE "ZKStatus" AS ENUM ('valid', 'expired', 'revoked');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "organization_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "payment_terms" TEXT NOT NULL,
    "total_value" DECIMAL(18,2) NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'draft',
    "tx_hash" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_items" (
    "id" TEXT NOT NULL,
    "agreement_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "specifications" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "agreement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_limits" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "limit_amount" DECIMAL(18,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_logs" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT,
    "agreement_id" TEXT,
    "approver_id" TEXT NOT NULL,
    "role_at_time" "Role" NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "invoice_number" TEXT,
    "receipt_date" DATE NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "tax_amount" DECIMAL(18,2) NOT NULL,
    "total_amount" DECIMAL(18,2) NOT NULL,
    "extracted_total" DECIMAL(18,2),
    "notes" TEXT,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'pending',
    "ai_confidence_score" DOUBLE PRECISION NOT NULL,
    "ai_confidence_reason" TEXT,
    "is_manually_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain_records" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "network" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipfs_records" (
    "id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "cid" TEXT NOT NULL,
    "file_hash" TEXT,
    "file_size" BIGINT,
    "file_type" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ipfs_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zk_proofs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "date_range_start" DATE NOT NULL,
    "date_range_end" DATE NOT NULL,
    "proof_type" "ProofType" NOT NULL,
    "range_min" DECIMAL(18,2) NOT NULL,
    "range_max" DECIMAL(18,2) NOT NULL,
    "actual_amount_encrypted" BYTEA,
    "actual_amount_hash" TEXT,
    "proof_metadata" JSONB,
    "include_categories" BOOLEAN NOT NULL DEFAULT false,
    "status" "ZKStatus" NOT NULL DEFAULT 'valid',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "proof_hash" TEXT NOT NULL,
    "verification_count" INTEGER NOT NULL DEFAULT 0,
    "last_verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zk_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zk_proof_categories" (
    "id" TEXT NOT NULL,
    "zk_proof_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "zk_proof_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zk_proof_blockchain" (
    "id" TEXT NOT NULL,
    "zk_proof_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "block_number" BIGINT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zk_proof_blockchain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zk_verification_logs" (
    "id" TEXT NOT NULL,
    "zk_proof_id" TEXT NOT NULL,
    "verifier_ip_hash" TEXT NOT NULL,
    "verifier_user_agent" TEXT,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zk_verification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "daily_limits_category_id_key" ON "daily_limits"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_records_receipt_id_key" ON "blockchain_records"("receipt_id");

-- CreateIndex
CREATE UNIQUE INDEX "ipfs_records_receipt_id_key" ON "ipfs_records"("receipt_id");

-- CreateIndex
CREATE UNIQUE INDEX "zk_proof_blockchain_zk_proof_id_key" ON "zk_proof_blockchain"("zk_proof_id");

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_items" ADD CONSTRAINT "agreement_items_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_limits" ADD CONSTRAINT "daily_limits_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockchain_records" ADD CONSTRAINT "blockchain_records_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ipfs_records" ADD CONSTRAINT "ipfs_records_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zk_proofs" ADD CONSTRAINT "zk_proofs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zk_proof_categories" ADD CONSTRAINT "zk_proof_categories_zk_proof_id_fkey" FOREIGN KEY ("zk_proof_id") REFERENCES "zk_proofs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zk_proof_categories" ADD CONSTRAINT "zk_proof_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zk_proof_blockchain" ADD CONSTRAINT "zk_proof_blockchain_zk_proof_id_fkey" FOREIGN KEY ("zk_proof_id") REFERENCES "zk_proofs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zk_verification_logs" ADD CONSTRAINT "zk_verification_logs_zk_proof_id_fkey" FOREIGN KEY ("zk_proof_id") REFERENCES "zk_proofs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
