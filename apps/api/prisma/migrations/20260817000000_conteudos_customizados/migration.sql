-- CreateTable
CREATE TABLE "Conteudo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "grandeArea" TEXT NOT NULL,
    "subArea" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conteudo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conteudo_usuarioId_idx" ON "Conteudo"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Conteudo_usuarioId_grandeArea_subArea_key" ON "Conteudo"("usuarioId", "grandeArea", "subArea");

-- AddForeignKey
ALTER TABLE "Conteudo" ADD CONSTRAINT "Conteudo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
