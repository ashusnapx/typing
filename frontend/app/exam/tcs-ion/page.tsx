import { TypingExam } from '@/components/exam/typing-exam';

export const dynamic = 'force-dynamic';

export default function TCSIONReplicaPage() {
  return (
    <TypingExam
      mode="tcs_ion_replica"
      durationSeconds={600}
      wpmTarget={35}
      isTCSReplica={true}
    />
  );
}
