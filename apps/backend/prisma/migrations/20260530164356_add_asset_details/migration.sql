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
    "customer" TEXT,
    "industry" TEXT,
    "contract_no" TEXT,
    "phone" TEXT,
    "floor_height" REAL NOT NULL DEFAULT 0,
    "load_capacity" REAL NOT NULL DEFAULT 0,
    "passage" TEXT,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "park_id" TEXT NOT NULL,
    "building_id" TEXT,
    "floor_id" TEXT,
    "score" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "assets_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "parks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assets_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "assets_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_assets" ("area", "building_area", "building_id", "code", "created_at", "floor_id", "id", "name", "park_id", "projection_area", "property_fee_unit", "rentable_area", "score", "slice_height", "slice_icon", "slice_rotation", "slice_title", "slice_width", "slice_x", "slice_y", "status", "type", "unit_price", "updated_at", "utility_fee_unit") SELECT "area", "building_area", "building_id", "code", "created_at", "floor_id", "id", "name", "park_id", "projection_area", "property_fee_unit", "rentable_area", "score", "slice_height", "slice_icon", "slice_rotation", "slice_title", "slice_width", "slice_x", "slice_y", "status", "type", "unit_price", "updated_at", "utility_fee_unit" FROM "assets";
DROP TABLE "assets";
ALTER TABLE "new_assets" RENAME TO "assets";
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
