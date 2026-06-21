import { TypingExam } from '@/components/exam/typing-exam';

export default function MockTestPage() {
  return (
    <TypingExam
      mode="mock"
      durationSeconds={600}
      wpmTarget={35}
    />
  );
}
