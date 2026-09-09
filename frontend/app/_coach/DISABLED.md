# Coach — off for now

This route is disabled. The folder is prefixed with `_`, which the Next.js App
Router treats as private, so nothing under it resolves as a URL while the code
stays where it is.

To turn it back on, rename `app/_coach` to `app/coach` and put back:

- the `{ href: '/coach', label: 'Coach' }` entry in `components/layout/navbar.tsx`
- the `/coach` row in `app/sitemap.ts`
- the suggestion in `app/not-found.tsx`

The `/coach/feedback` and `/coach/weak-words` entries in `lib/api.ts` and
`lib/config.ts` are backend endpoints, not this page, and were left alone.
