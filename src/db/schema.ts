import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  integer,
  primaryKey,
  numeric,
  pgEnum,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────
export const ingredientCategoryEnum = pgEnum("ingredient_category", [
  "produce",
  "dairy",
  "meat_seafood",
  "bakery",
  "frozen",
  "dry_goods",
  "beverages",
  "condiments",
  "snacks",
  "other",
]);

export type IngredientCategory = (typeof ingredientCategoryEnum.enumValues)[number];
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Users ────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // Nullable: a user isn't required to be in a household. Visibility for
  // pantry/recipes/grocery_list is derived live from this column at query
  // time — those tables are not themselves household-scoped.
  householdId: uuid("household_id").references((): AnyPgColumn => households.id, {
    onDelete: "set null",
  }),
  createdOn: timestamp("created_on", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Households ───────────────────────────────────────────
export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  inviteCode: varchar("invite_code", { length: 12 }).notNull().unique(),
  createdOn: timestamp("created_on", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── NextAuth Adapter Tables ──────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Ingredients ──────────────────────────────────────────
export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  category: ingredientCategoryEnum("category").default("other").notNull(),
});

// ─── Pantry ───────────────────────────────────────────────
export const pantry = pgTable("pantry", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  updatedOn: timestamp("updated_on", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Recipes ──────────────────────────────────────────────
export const recipes = pgTable("recipes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  instructions: text("instructions"),
  cookTimeMinutes: integer("cook_time_minutes"),
  createdOn: timestamp("created_on", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── RecipeIngredients (M2M) ──────────────────────────────
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  optional: integer("optional").default(0).notNull(), // 0=required, 1=optional
});

// ─── Tags ─────────────────────────────────────────────────
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

// ─── RecipeTags (M2M) ─────────────────────────────────────
export const recipeTags = pgTable(
  "recipe_tags",
  {
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.tagId] })]
);

// ─── GroceryList ──────────────────────────────────────────
export const groceryStatusEnum = pgEnum("grocery_status", ["pending", "purchased"]);

export const groceryList = pgTable("grocery_list", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ingredientId: uuid("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  status: groceryStatusEnum("status").default("pending").notNull(),
  updatedOn: timestamp("updated_on", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Stores ───────────────────────────────────────────────
export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

// ─── IngredientStores (M2M) ───────────────────────────────
export const ingredientStores = pgTable(
  "ingredient_stores",
  {
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.ingredientId, t.storeId] })]
);
