-- CreateTable
CREATE TABLE "Promocode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "advantage" JSONB NOT NULL,
    "restrictions" JSONB NOT NULL,
    "convertedRule" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promocode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Promocode_name_key" ON "Promocode"("name");
