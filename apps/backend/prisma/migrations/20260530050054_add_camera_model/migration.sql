/*
  Warnings:

  - You are about to drop the column `floor` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `inner_area` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `orientation` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `rent` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `rent_per_sqm` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `space_type` on the `assets` table. All the data in the column will be lost.
  - You are about to drop the column `zone` on the `assets` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "cameras" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" REAL NOT NULL DEFAULT 0,
    "y" REAL NOT NULL DEFAULT 0,
    "width" REAL NOT NULL DEFAULT 100,
    "height" REAL NOT NULL DEFAULT 100,
    "rotation" REAL NOT NULL DEFAULT 0,
    "hikvisionConfig" TEXT,
    "park_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cameras_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "parks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "area" REAL NOT NULL DEFAULT 0,
    "rentable_area" REAL NOT NULL DEFAULT 0,
    "building_area" REAL NOT NULL DEFAULT 0,
    "projection_area" REAL NOT NULL DEFAULT 0,
    "slice_x" REAL NOT NULL DEFAULT 0,
    "slice_y" REAL NOT NULL DEFAULT 0,
    "slice_width" REAL NOT NULL DEFAULT 0,
    "slice_height" REAL NOT NULL DEFAULT 0,
    "slice_rotation" REAL NOT NULL DEFAULT 0,
    "slice_icon" TEXT,
    "slice_title" TEXT,
    "unit_price" REAL NOT NULL DEFAULT 0,
    "property_fee_unit" REAL NOT NULL DEFAULT 0,
    "utility_fee_unit" REAL NOT NULL DEFAULT 0,
    "park_id" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "assets_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "parks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assets" ("area", "building_area", "code", "created_at", "id", "name", "park_id", "projection_area", "property_fee_unit", "rentable_area", "score", "slice_height", "slice_icon", "slice_rotation", "slice_title", "slice_width", "slice_x", "slice_y", "status", "type", "unit_price", "updated_at", "utility_fee_unit") SELECT "area", "building_area", "code", "created_at", "id", "name", "park_id", "projection_area", "property_fee_unit", "rentable_area", "score", "slice_height", "slice_icon", "slice_rotation", "slice_title", "slice_width", "slice_x", "slice_y", "status", "type", "unit_price", "updated_at", "utility_fee_unit" FROM "assets";
DROP TABLE "assets";
ALTER TABLE "new_assets" RENAME TO "assets";
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
