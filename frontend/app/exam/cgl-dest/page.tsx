import { TypingExam } from '@/components/exam/typing-exam';

export default function SSCGOLDESTPage() {
  return (
    <TypingExam
      mode="ssc_cgl_dest"
      durationSeconds={900}
      wpmTarget={0}
    />
  );
}
