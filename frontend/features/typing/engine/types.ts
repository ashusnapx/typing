export interface EngineKeystroke {
  key: string;
  timestamp_ms: number;
  duration_ms: number;
  is_error: boolean;
  is_backspace: boolean;
  cursor_position: number;
  expected_char: string;
}

export interface EngineMetrics {
  wpm: number;
  accuracy: number;
  errors: number;
  backspaces: number;
  elapsedSeconds: number;
}

export interface TimingSignal {
  key: string;
  holdDuration: number;
  interKeyDelay: number;
}

export interface AntiCheatTelemetry {
  paste_attempts: number;
  copy_attempts: number;
  context_menu_opens: number;
  blur_events: number;
  focus_events: number;
  timing_signals: TimingSignal[];
}
