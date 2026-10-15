// Vercel rewrites nested /api/* URLs to this single, directly addressable function.
import handler from './[...path].ts';

export default handler;
