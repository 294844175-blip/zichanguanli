-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "background_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "total_area" REAL NOT NULL DEFAULT 0,
    "building_area" REAL NOT NULL DEFAULT 0,
    "rentable_area" REAL NOT NULL DEFAULT 0,
    "green_area" REAL NOT NULL DEFAULT 0,
    "hardened_area" REAL NOT NULL DEFAULT 0,
    "parking_spaces" INTEGER NOT NULL DEFAULT 0,
    "board_spaces" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "parks_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assets" (
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

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "industry" TEXT,
    "needs" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "park_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "rent_method" TEXT NOT NULL,
    "billing_unit" TEXT NOT NULL,
    "unit_price" REAL NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "daily_estimate" REAL NOT NULL DEFAULT 0,
    "monthly_estimate" REAL NOT NULL DEFAULT 0,
    "property_fee" REAL NOT NULL DEFAULT 0,
    "utility_fee" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "risk_level" TEXT NOT NULL DEFAULT 'NORMAL',
    "deposit" REAL NOT NULL DEFAULT 0,
    "contract_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leases_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leases_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leases_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "parks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "follow_up_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_follow_up" DATETIME,
    "result" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follow_ups_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_costs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asset_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "invoice_url" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_costs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "revenue_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "park_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "target_revenue" REAL NOT NULL DEFAULT 0,
    "actual_revenue" REAL NOT NULL DEFAULT 0,
    "expected_revenue" REAL NOT NULL DEFAULT 0,
    "completion_rate" REAL NOT NULL DEFAULT 0,
    "gross_profit" REAL NOT NULL DEFAULT 0,
    "gross_margin" REAL NOT NULL DEFAULT 0,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "space_cost" REAL NOT NULL DEFAULT 0,
    "utility_cost" REAL NOT NULL DEFAULT 0,
    "property_cost" REAL NOT NULL DEFAULT 0,
    "maintenance_cost" REAL NOT NULL DEFAULT 0,
    "receivable" REAL NOT NULL DEFAULT 0,
    "overdue" REAL NOT NULL DEFAULT 0,
    "not_overdue" REAL NOT NULL DEFAULT 0,
    "overdue_rate" REAL NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "revenue_records_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "parks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL,
    "data_scope" TEXT NOT NULL DEFAULT 'ORG',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "real_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "role_id" TEXT NOT NULL,
    "org_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "park_access" (
    "user_id" TEXT NOT NULL,
    "park_id" TEXT NOT NULL,

    PRIMARY KEY ("user_id", "park_id"),
    CONSTRAINT "park_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "park_access_park_id_fkey" FOREIGN KEY ("park_id") REFERENCES "parks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "parks_code_key" ON "parks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "leases_asset_id_key" ON "leases"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
