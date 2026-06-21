import { TypingExam } from '@/components/exam/typing-exam';

export default function SSCCHSLPage() {
  return (
    <TypingExam
      mode="ssc_chsl"
      durationSeconds={600}
      wpmTarget={35}
    />
  );
}
