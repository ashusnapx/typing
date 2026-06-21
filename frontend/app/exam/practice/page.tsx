import { TypingExam } from '@/components/exam/typing-exam';

export default function PracticePage() {
  return (
    <TypingExam
      mode="practice"
      durationSeconds={600}
      wpmTarget={35}
    />
  );
}
