-- CreateTable
CREATE TABLE "Issuer" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "flag" TEXT,
    "wikidataId" TEXT,
    "parentCode" TEXT,
    "parentName" TEXT,
    "level" INTEGER,
    "catalogSyncedAt" DATETIME,
    "catalogTotal" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegionLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "regionName" TEXT NOT NULL,
    "issuerCode" TEXT NOT NULL,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegionLink_issuerCode_fkey" FOREIGN KEY ("issuerCode") REFERENCES "Issuer" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "issuerCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "objectTypeName" TEXT,
    "title" TEXT NOT NULL,
    "minYear" INTEGER,
    "maxYear" INTEGER,
    "obverseThumb" TEXT,
    "reverseThumb" TEXT,
    "currencyName" TEXT,
    "currencyId" INTEGER,
    "valueText" TEXT,
    "numericValue" REAL,
    "rawList" TEXT NOT NULL,
    "rawDetail" TEXT,
    "detailFetchedAt" DATETIME,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CatalogType_issuerCode_fkey" FOREIGN KEY ("issuerCode") REFERENCES "Issuer" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "typeId" INTEGER NOT NULL,
    "year" INTEGER,
    "grade" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" REAL,
    "note" TEXT,
    "imagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollectionItem_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CatalogType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiUsage" (
    "month" TEXT NOT NULL PRIMARY KEY,
    "calls" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "RegionLink_regionName_idx" ON "RegionLink"("regionName");

-- CreateIndex
CREATE UNIQUE INDEX "RegionLink_regionName_issuerCode_yearFrom_yearTo_key" ON "RegionLink"("regionName", "issuerCode", "yearFrom", "yearTo");

-- CreateIndex
CREATE INDEX "CatalogType_issuerCode_category_idx" ON "CatalogType"("issuerCode", "category");

-- CreateIndex
CREATE INDEX "CollectionItem_typeId_idx" ON "CollectionItem"("typeId");
