import { TypingExam } from '@/components/exam/typing-exam';

export default function SSCHindiPage() {
  return (
    <TypingExam
      mode="ssc_hindi"
      durationSeconds={600}
      wpmTarget={30}
      lang="hindi"
    />
  );
}
