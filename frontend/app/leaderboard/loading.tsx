import { FullPageLoader } from '@/components/ui/loading-logo';

/** Shown while the page is being rendered, so a slow first byte reads as the
 *  product waiting rather than as a blank screen. */
export default function Loading() {
  return <FullPageLoader text="Loading the leaderboard" />;
}
