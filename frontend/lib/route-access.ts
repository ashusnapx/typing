/** Single source of truth for which routes require an account.
 *
 *  This list is consumed by both the edge middleware and the client-side
 *  AuthGate. They previously kept separate, drifting lists, which is why
 *  `/exam` redirected to the login page while `/exam/practice` did not.
 *
 *  The rule is deliberately narrow: only pages that render a specific user's
 *  own stored data are private. Practice, lessons, exams, and results are
 *  open to everyone. */
export const PRIVATE_ROUTE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/analysis',
] as const;

export function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

export function isAuthPage(pathname: string): boolean {
  return pathname === '/auth/login' || pathname === '/auth/register';
}
