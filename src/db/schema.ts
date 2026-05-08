import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

// ─── Users ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdOn: timestamp("created_on", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
