
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCapturedItemInputSchema,
  updateCapturedItemInputSchema,
  searchCapturedItemsInputSchema,
  generateTagsInputSchema,
  semanticSearchInputSchema,
  contentTypeSchema,
} from './schema';

// Import handlers
import { createCapturedItem } from './handlers/create_captured_item';
import { getCapturedItems } from './handlers/get_captured_items';
import { getCapturedItemById } from './handlers/get_captured_item_by_id';
import { updateCapturedItem } from './handlers/update_captured_item';
import { deleteCapturedItem } from './handlers/delete_captured_item';
import { searchCapturedItems } from './handlers/search_captured_items';
import { generateTags } from './handlers/generate_tags';
import { semanticSearch } from './handlers/semantic_search';
import { getAllTags } from './handlers/get_all_tags';
import { getItemsByContentType } from './handlers/get_items_by_content_type';
import { getItemsByTags } from './handlers/get_items_by_tags';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Core captured items operations
  createCapturedItem: publicProcedure
    .input(createCapturedItemInputSchema)
    .mutation(({ input }) => createCapturedItem(input)),

  getCapturedItems: publicProcedure
    .query(() => getCapturedItems()),

  getCapturedItemById: publicProcedure
    .input(z.number())
    .query(({ input }) => getCapturedItemById(input)),

  updateCapturedItem: publicProcedure
    .input(updateCapturedItemInputSchema)
    .mutation(({ input }) => updateCapturedItem(input)),

  deleteCapturedItem: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteCapturedItem(input)),

  // Search and filtering
  searchCapturedItems: publicProcedure
    .input(searchCapturedItemsInputSchema)
    .query(({ input }) => searchCapturedItems(input)),

  getItemsByContentType: publicProcedure
    .input(contentTypeSchema)
    .query(({ input }) => getItemsByContentType(input)),

  getItemsByTags: publicProcedure
    .input(z.array(z.string()))
    .query(({ input }) => getItemsByTags(input)),

  // AI-powered features
  generateTags: publicProcedure
    .input(generateTagsInputSchema)
    .mutation(({ input }) => generateTags(input)),

  semanticSearch: publicProcedure
    .input(semanticSearchInputSchema)
    .query(({ input }) => semanticSearch(input)),

  // Tag management
  getAllTags: publicProcedure
    .query(() => getAllTags()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
