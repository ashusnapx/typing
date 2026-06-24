import { TypingExam } from '@/components/exam/typing-exam';

export const dynamic = 'force-dynamic';

export default function BlindModePage() {
  return (
    <TypingExam
      mode="blind"
      durationSeconds={600}
      wpmTarget={35}
    />
  );
}
