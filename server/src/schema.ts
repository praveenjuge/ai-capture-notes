
import { z } from 'zod';

// Content type enum
export const contentTypeSchema = z.enum(['text', 'code', 'image', 'link']);
export type ContentType = z.infer<typeof contentTypeSchema>;

// Captured item schema
export const capturedItemSchema = z.object({
  id: z.number(),
  content_type: contentTypeSchema,
  content: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.any()).nullable(), // JSON field for additional metadata
});

export type CapturedItem = z.infer<typeof capturedItemSchema>;

// Input schema for creating captured items
export const createCapturedItemInputSchema = z.object({
  content_type: contentTypeSchema,
  content: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateCapturedItemInput = z.infer<typeof createCapturedItemInputSchema>;

// Input schema for updating captured items
export const updateCapturedItemInputSchema = z.object({
  id: z.number(),
  content_type: contentTypeSchema.optional(),
  content: z.string().min(1).optional(),
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).nullable().optional(),
});

export type UpdateCapturedItemInput = z.infer<typeof updateCapturedItemInputSchema>;

// Search input schema
export const searchCapturedItemsInputSchema = z.object({
  query: z.string().optional(),
  content_type: contentTypeSchema.optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type SearchCapturedItemsInput = z.infer<typeof searchCapturedItemsInputSchema>;

// Tag schema
export const tagSchema = z.object({
  id: z.number(),
  name: z.string(),
  usage_count: z.number().int(),
  created_at: z.coerce.date(),
});

export type Tag = z.infer<typeof tagSchema>;

// AI tag generation input
export const generateTagsInputSchema = z.object({
  content: z.string().min(1),
  content_type: contentTypeSchema,
  title: z.string().optional(),
  description: z.string().optional(),
});

export type GenerateTagsInput = z.infer<typeof generateTagsInputSchema>;

// Semantic search input
export const semanticSearchInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(10),
  content_type: contentTypeSchema.optional(),
});

export type SemanticSearchInput = z.infer<typeof semanticSearchInputSchema>;
