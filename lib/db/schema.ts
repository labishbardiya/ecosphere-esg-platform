import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// ============================================================
// Organization structure
// ============================================================

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  parentId: integer("parentId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// ============================================================
// Better Auth tables (column names must stay camelCase)
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("employee"),
  departmentId: integer("departmentId"),
  xpBalance: integer("xpBalance").notNull().default(0),
  pointsBalance: integer("pointsBalance").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

// ============================================================
// Gamification
// ============================================================

export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("environmental"),
  xpReward: integer("xpReward").notNull().default(50),
  pointsReward: integer("pointsReward").notNull().default(10),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  createdBy: text("createdBy").references(() => user.id, { onDelete: "set null" }),
})

export const challengeParticipants = pgTable("challengeParticipants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challengeId")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  proofUrl: text("proofUrl"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon").notNull().default("award"),
  category: text("category").notNull().default("general"),
  xpThreshold: integer("xpThreshold"),
  challengeThreshold: integer("challengeThreshold"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const userBadges = pgTable("userBadges", {
  id: serial("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  badgeId: integer("badgeId")
    .notNull()
    .references(() => badges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earnedAt").notNull().defaultNow(),
})

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("pointsCost").notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

export const rewardRedemptions = pgTable("rewardRedemptions", {
  id: serial("id").primaryKey(),
  rewardId: integer("rewardId")
    .notNull()
    .references(() => rewards.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  redeemedAt: timestamp("redeemedAt").notNull().defaultNow(),
})

// ============================================================
// Module 1: Environmental (GHG Protocol / GRI 302, 303, 305, 306)
// ============================================================

/** Versioned kgCO2e conversion factors (DEFRA/EPA-derived). */
export const emissionFactors = pgTable("emission_factors", {
  id: serial("id").primaryKey(),
  activityType: text("activityType").notNull(),
  unit: text("unit").notNull(),
  factorKgCo2e: numeric("factorKgCo2e", { precision: 12, scale: 6 }).notNull(),
  source: text("source").notNull(),
  validFrom: date("validFrom").notNull(),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

/** Carbon ledger: every emission event, factor snapshotted for auditability. */
export const carbonTransactions = pgTable("carbon_transactions", {
  id: serial("id").primaryKey(),
  sourceType: text("sourceType").notNull(), // purchase|manufacturing|expense|fleet|energy|travel|other
  description: text("description").notNull(),
  activityType: text("activityType").notNull(),
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  factorKgCo2e: numeric("factorKgCo2e", { precision: 12, scale: 6 }).notNull(),
  totalKgCo2e: numeric("totalKgCo2e", { precision: 16, scale: 4 }).notNull(),
  departmentId: integer("departmentId").notNull(),
  userId: text("userId").notNull(),
  transactionDate: date("transactionDate").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

/** Monthly resource consumption per department (GRI 302/303). */
export const resourceUsage = pgTable("resource_usage", {
  id: serial("id").primaryKey(),
  resourceType: text("resourceType").notNull(), // electricity|water|paper|fuel
  quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  departmentId: integer("departmentId").notNull(),
  userId: text("userId").notNull(),
  periodMonth: date("periodMonth").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

/** Waste logs by category; recycling rate derives from these (GRI 306). */
export const wasteLogs = pgTable("waste_logs", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // recycled|landfill|e-waste|organic|hazardous
  weightKg: numeric("weightKg", { precision: 12, scale: 2 }).notNull(),
  departmentId: integer("departmentId").notNull(),
  userId: text("userId").notNull(),
  logDate: date("logDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

/** Reduction targets tracked against actuals. */
export const environmentalGoals = pgTable("environmental_goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  metric: text("metric").notNull(), // emissions_reduction|recycling_rate|electricity_reduction|water_reduction|paper_reduction|fuel_reduction
  targetValue: numeric("targetValue", { precision: 12, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  baselineValue: numeric("baselineValue", { precision: 14, scale: 4 }),
  departmentId: integer("departmentId"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  status: text("status").notNull().default("active"), // active|achieved|missed|archived
  createdBy: text("createdBy").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
