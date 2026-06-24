import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '@/src/server/trpc/context';
import { appRouter } from '@/src/server/trpc/root';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (opts) => createContext(opts),
  });

export { handler as GET, handler as POST };
