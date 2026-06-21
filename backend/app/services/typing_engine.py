from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
import time
from collections import defaultdict


@dataclass
class TypingMetrics:
    gross_wpm: float = 0.0
    net_wpm: float = 0.0
    accuracy: float = 0.0
    error_percentage: float = 0.0
    key_depression_count: int = 0
    backspace_count: int = 0
    pause_count: int = 0
    total_pause_duration: float = 0.0
    avg_pause_duration: float = 0.0
    longest_pause_duration: float = 0.0
    time_utilization_percentage: float = 0.0
    consistency_score: float = 0.0
    typing_rhythm_score: float = 0.0
    error_zones: Dict = field(default_factory=dict)
    weak_words: List[str] = field(default_factory=list)
    common_mistypes: Dict = field(default_factory=dict)
    left_hand_errors: int = 0
    right_hand_errors: int = 0
    shift_key_errors: int = 0
    number_row_errors: int = 0


class TypingEngine:
    PAUSE_THRESHOLD_MS = 2000
    LEFT_HAND_KEYS = set("qwertasdfgzxcvb")
    RIGHT_HAND_KEYS = set("yuiophjklnm")
    NUMBER_ROW_KEYS = set("1234567890")
    SHIFT_KEYS = set("~!@#$%^&*()_+{}|:\"<>?QWERTYUIOPASDFGHJKLZXCVBNM")

    def __init__(self):
        self._sessions: Dict[str, Dict] = {}

    def create_session(self, test_id: str, original_content: str, duration_seconds: int):
        self._sessions[test_id] = {
            "original": original_content,
            "duration": duration_seconds,
            "events": [],
            "start_time": time.time(),
            "pauses": [],
            "backspaces": 0,
            "total_chars": 0,
            "error_count": 0,
            "corrections": 0,
            "char_timings": [],
            "last_event_time": None,
        }
        return test_id

    def record_event(self, test_id: str, key: str, timestamp_ms: int, duration_ms: int = 0):
        session = self._sessions.get(test_id)
        if not session:
            return

        current_time = time.time() * 1000

        if session["last_event_time"] is not None:
            gap = current_time - session["last_event_time"]
            if gap > self.PAUSE_THRESHOLD_MS:
                session["pauses"].append({
                    "start_ms": int(session["last_event_time"]),
                    "end_ms": int(current_time),
                    "duration_ms": int(gap),
                })

        session["last_event_time"] = current_time

        is_backspace = key in ("Backspace", "Delete")
        if is_backspace:
            session["backspaces"] += 1

        session["events"].append({
            "key": key,
            "timestamp_ms": timestamp_ms,
            "duration_ms": duration_ms,
            "is_backspace": is_backspace,
        })
        session["char_timings"].append({
            "key": key,
            "time": timestamp_ms,
            "duration": duration_ms,
        })

    def compute_metrics(self, test_id: str, typed_content: str, original_content: str, time_taken_seconds: float) -> TypingMetrics:
        session = self._sessions.get(test_id)
        if not session:
            return TypingMetrics()

        metrics = TypingMetrics()
        events = session["events"]
        char_timings = session["char_timings"]
        pauses = session["pauses"]

        metrics.key_depression_count = len(typed_content)
        metrics.backspace_count = session["backspaces"]
        metrics.pause_count = len(pauses)

        if pauses:
            metrics.total_pause_duration = sum(p["duration_ms"] for p in pauses) / 1000.0
            metrics.avg_pause_duration = metrics.total_pause_duration / len(pauses)
            metrics.longest_pause_duration = max(p["duration_ms"] for p in pauses) / 1000.0

        total_duration_ms = time_taken_seconds * 1000
        if total_duration_ms > 0:
            active_time = max(0, total_duration_ms - (metrics.total_pause_duration * 1000))
            metrics.time_utilization_percentage = round((active_time / total_duration_ms) * 100, 2)

        metrics.consistency_score = self._calculate_consistency(char_timings)
        metrics.typing_rhythm_score = self._calculate_rhythm(char_timings)

        metrics.left_hand_errors, metrics.right_hand_errors, metrics.shift_key_errors, metrics.number_row_errors = self._analyze_hand_errors(events, original_content)

        metrics.weak_words = self._identify_weak_words(typed_content, original_content)
        metrics.common_mistypes = self._find_common_mistypes(events, original_content)
        metrics.error_zones = self._generate_error_zones(events, original_content)

        del self._sessions[test_id]
        return metrics

    def _calculate_consistency(self, char_timings: List[Dict]) -> float:
        if len(char_timings) < 10:
            return 100.0

        intervals = []
        for i in range(1, len(char_timings)):
            gap = char_timings[i]["time"] - char_timings[i - 1]["time"]
            if 0 < gap < 5000:
                intervals.append(gap)

        if not intervals:
            return 0.0

        avg_interval = sum(intervals) / len(intervals)
        variance = sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)
        std_dev = variance ** 0.5

        cv = std_dev / avg_interval if avg_interval > 0 else 1.0
        consistency = max(0, min(100, 100 - (cv * 50)))
        return round(consistency, 2)

    def _calculate_rhythm(self, char_timings: List[Dict]) -> float:
        if len(char_timings) < 20:
            return 100.0

        bigrams = []
        for i in range(1, len(char_timings)):
            gap = char_timings[i]["time"] - char_timings[i - 1]["time"]
            if 0 < gap < 3000:
                bigrams.append(gap)

        if not bigrams:
            return 0.0

        smooth = sum(bigrams) / len(bigrams)
        rhythm_penalties = sum(1 for b in bigrams if abs(b - smooth) > smooth * 1.5)
        penalty_ratio = rhythm_penalties / len(bigrams)
        score = max(0, min(100, 100 - (penalty_ratio * 100)))
        return round(score, 2)

    def _analyze_hand_errors(self, events: List[Dict], original: str) -> Tuple[int, int, int, int]:
        left_errors = 0
        right_errors = 0
        shift_errors = 0
        number_errors = 0

        for event in events:
            key = event.get("key", "")
            if key in self.LEFT_HAND_KEYS:
                left_errors += 1
            elif key in self.RIGHT_HAND_KEYS:
                right_errors += 1
            elif key in self.SHIFT_KEYS:
                shift_errors += 1
            elif key in self.NUMBER_ROW_KEYS:
                number_errors += 1

        return left_errors, right_errors, shift_errors, number_errors

    def _identify_weak_words(self, typed: str, original: str) -> List[str]:
        typed_words = typed.split()
        original_words = original.split()
        weak_words = []

        import Levenshtein
        for i in range(min(len(typed_words), len(original_words))):
            if typed_words[i] != original_words[i]:
                weak_words.append(original_words[i])

        word_freq = defaultdict(int)
        for w in weak_words:
            word_freq[w] += 1

        sorted_weak = sorted(word_freq.items(), key=lambda x: -x[1])
        return [w for w, _ in sorted_weak[:20]]

    def _find_common_mistypes(self, events: List[Dict], original: str) -> Dict:
        mistypes = defaultdict(int)
        for event in events:
            key = event.get("key", "")
            if event.get("is_error"):
                if key and len(key) == 1:
                    mistypes[key] += 1
        return dict(sorted(mistypes.items(), key=lambda x: -x[1])[:10])

    def _generate_error_zones(self, events: List[Dict], original: str) -> Dict:
        return {
            "left_hand": {"errors": 0, "keys": list(self.LEFT_HAND_KEYS)},
            "right_hand": {"errors": 0, "keys": list(self.RIGHT_HAND_KEYS)},
            "number_row": {"errors": 0, "keys": list(self.NUMBER_ROW_KEYS)},
            "shift_key": {"errors": 0},
        }


typing_engine = TypingEngine()
