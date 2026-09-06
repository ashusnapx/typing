import { TypingExam } from '@/components/exam/typing-exam';
import { getPassagePool } from '@/lib/passages/server';

// Passages change only when we ship a migration, so the page is cached rather
// than rebuilt per request. This route previously used `force-dynamic`, which
// opted every exam out of caching AND still left the passage fetch to run in
// the browser after hydration.
export const revalidate = 3600;

export default async function EduquityReplicaPage() {
  // Fetched here so the client starts with the passage already in hand.
  const passagePool = await getPassagePool();

  return (
    <TypingExam
      mode="tcs_ion_replica"
      durationSeconds={600}
      wpmTarget={35}
      isEduquityReplica
      passagePool={passagePool}
    />
  );
}
