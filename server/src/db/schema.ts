
import { serial, text, pgTable, timestamp, integer, json, pgEnum } from 'drizzle-orm/pg-core';

// Content type enum
export const contentTypeEnum = pgEnum('content_type', ['text', 'code', 'image', 'link']);

// Captured items table
export const capturedItemsTable = pgTable('captured_items', {
  id: serial('id').primaryKey(),
  content_type: contentTypeEnum('content_type').notNull(),
  content: text('content').notNull(),
  title: text('title'),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  tags: text('tags').array().notNull().default([]), // Array of tag names
  metadata: json('metadata'), // JSON field for additional metadata like image dimensions, code language, etc.
});

// Tags table for tracking tag usage and management
export const tagsTable = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  usage_count: integer('usage_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type CapturedItem = typeof capturedItemsTable.$inferSelect;
export type NewCapturedItem = typeof capturedItemsTable.$inferInsert;
export type Tag = typeof tagsTable.$inferSelect;
export type NewTag = typeof tagsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  capturedItems: capturedItemsTable, 
  tags: tagsTable 
};
