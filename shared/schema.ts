import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
  lastAccessedAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const managedFiles = pgTable("managed_files", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => sessions.id, { onDelete: "cascade" }),
  originalName: text("original_name").notNull(),
  storageKey: text("storage_key").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isOutput: boolean("is_output").default(false).notNull(),
  outputType: text("output_type"),
});

export const insertManagedFileSchema = createInsertSchema(managedFiles).omit({
  uploadedAt: true,
});

export type InsertManagedFile = z.infer<typeof insertManagedFileSchema>;
export type ManagedFile = typeof managedFiles.$inferSelect;
