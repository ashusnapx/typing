from typing import List, Dict, Optional
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass, field


@dataclass
class CoachFeedback:
    overall_score: float
    strengths: List[str]
    weaknesses: List[str]
    detailed_feedback: str
    daily_drills: List[Dict]
    weak_word_exercises: List[str]
    speed_exercises: List[Dict]
    accuracy_exercises: List[Dict]
    fatigue_analysis: Optional[Dict]
    practice_passage_suggestion: Optional[str]
    predicted_improvement: Optional[Dict]


class AITypingCoach:
    def __init__(self):
        self.fatigue_threshold_seconds = 600
        self.suffix_patterns = ["ing", "ed", "tion", "ment", "able", "ness", "ful", "less", "ously", "ation"]

    def generate_feedback(
        self,
        test_data: Dict,
        recent_tests: List[Dict],
    ) -> CoachFeedback:
        accuracy = test_data.get("accuracy", 0)
        wpm = test_data.get("net_wpm", 0)
        backspace_count = test_data.get("backspace_count", 0)
        pause_count = test_data.get("pause_count", 0)
        total_pauses = test_data.get("total_pause_duration_seconds", 0)
        time_taken = test_data.get("time_taken_seconds", 600)
        weak_words = test_data.get("weak_words", [])
        consistency = test_data.get("consistency_score", 50)

        strengths = self._identify_strengths(test_data, recent_tests)
        weaknesses = self._identify_weaknesses(test_data, recent_tests)
        detailed_feedback = self._generate_detailed_feedback(test_data, recent_tests)
        fatigue_analysis = self._analyze_fatigue(test_data, time_taken)
        drills = self._generate_daily_drills(weaknesses, weak_words)

        return CoachFeedback(
            overall_score=round(self._calculate_overall_score(test_data), 2),
            strengths=strengths,
            weaknesses=weaknesses,
            detailed_feedback=detailed_feedback,
            daily_drills=drills,
            weak_word_exercises=weak_words[:10],
            speed_exercises=self._generate_speed_exercises(wpm),
            accuracy_exercises=self._generate_accuracy_exercises(accuracy, weak_words),
            fatigue_analysis=fatigue_analysis,
            practice_passage_suggestion=self._suggest_practice_passage(weak_words),
            predicted_improvement=self._predict_improvement(test_data, recent_tests),
        )

    def _identify_strengths(self, test: Dict, recent: List[Dict]) -> List[str]:
        strengths = []
        accuracy = test.get("accuracy", 0)
        wpm = test.get("net_wpm", 0)
        consistency = test.get("consistency_score", 50)

        if accuracy >= 97:
            strengths.append("Exceptional typing accuracy")
        elif accuracy >= 95:
            strengths.append("Above average typing accuracy")

        if wpm >= 40:
            strengths.append("Strong typing speed")
        elif wpm >= 35:
            strengths.append("Good typing speed")

        if consistency >= 80:
            strengths.append("Consistent typing rhythm")

        if test.get("backspace_count", 0) <= 5:
            strengths.append("Minimal corrections needed")

        if test.get("pause_count", 0) <= 3:
            strengths.append("Excellent flow with minimal pauses")

        return strengths[:5]

    def _identify_weaknesses(self, test: Dict, recent: List[Dict]) -> List[str]:
        weaknesses = []
        accuracy = test.get("accuracy", 0)
        wpm = test.get("net_wpm", 0)
        consistency = test.get("consistency_score", 50)
        weak_words = test.get("weak_words", [])
        pauses = test.get("pause_count", 0)
        backspaces = test.get("backspace_count", 0)

        if accuracy < 90:
            weaknesses.append("Accuracy needs significant improvement")
        elif accuracy < 95:
            weaknesses.append("Accuracy slightly below qualifying threshold")

        if wpm < 35:
            weaknesses.append("Speed below SSC CHSL requirement (35 WPM)")

        if consistency < 60:
            weaknesses.append("Inconsistent typing rhythm")

        if pauses > 10:
            weaknesses.append("Frequent pauses disrupting flow")

        if backspaces > 15:
            weaknesses.append("Excessive corrections - accuracy issues while typing")

        if weak_words:
            most_common = weak_words[:3]
            weaknesses.append(f"Frequent mistakes in: {', '.join(most_common)}")

        suffix_errors = self._detect_suffix_errors(test)
        if suffix_errors:
            weaknesses.append(f"Pattern errors detected in suffix groups: {', '.join(suffix_errors)}")

        if test.get("space_errors", 0) > 3:
            weaknesses.append("Space handling needs improvement")

        fatigue = self._analyze_fatigue(test, test.get("time_taken_seconds", 600))
        if fatigue and fatigue.get("fatigue_detected"):
            weaknesses.append(f"Fatigue detected after {fatigue.get('fatigue_start_seconds')} seconds")

        return weaknesses[:7]

    def _detect_suffix_errors(self, test: Dict) -> List[str]:
        detected = []
        typed_content = test.get("typed_content", "")
        original = test.get("original_content", "")

        for suffix in self.suffix_patterns:
            typed_suffixes = 0
            error_suffixes = 0
            idx = 0
            while idx < len(typed_content):
                pos = typed_content.find(suffix, idx)
                if pos == -1:
                    break
                typed_suffixes += 1
                if pos >= len(original) or original[pos:pos + len(suffix)] != suffix:
                    error_suffixes += 1
                idx = pos + 1

            if typed_suffixes > 0 and (error_suffixes / typed_suffixes) > 0.3:
                detected.append(suffix)

        return detected

    def _analyze_fatigue(self, test: Dict, total_duration: float) -> Optional[Dict]:
        if total_duration < 300:
            return {"fatigue_detected": False, "reason": "Test too short for fatigue analysis"}

        wpm_halves = self._compare_halves(test)
        if not wpm_halves:
            return None

        first_half_wpm = wpm_halves.get("first_half_wpm", 0)
        second_half_wpm = wpm_halves.get("second_half_wpm", 0)

        if first_half_wpm > 0 and second_half_wpm < first_half_wpm * 0.85:
            fatigue_start = int(total_duration * 0.5)
            return {
                "fatigue_detected": True,
                "fatigue_start_seconds": fatigue_start,
                "speed_decline_percentage": round((1 - second_half_wpm / first_half_wpm) * 100, 1),
                "first_half_wpm": round(first_half_wpm, 1),
                "second_half_wpm": round(second_half_wpm, 1),
            }

        return {"fatigue_detected": False, "reason": "Consistent speed throughout"}

    def _compare_halves(self, test: Dict) -> Optional[Dict]:
        typed = test.get("typed_content", "")
        if not typed:
            return None
        mid = len(typed) // 2
        first_half = typed[:mid]
        second_half = typed[mid:]
        duration = test.get("time_taken_seconds", 600)

        first_half_time = duration * 0.5
        second_half_time = duration * 0.5

        return {
            "first_half_wpm": (len(first_half) / 5) / (first_half_time / 60) if first_half_time > 0 else 0,
            "second_half_wpm": (len(second_half) / 5) / (second_half_time / 60) if second_half_time > 0 else 0,
        }

    def _generate_detailed_feedback(self, test: Dict, recent: List[Dict]) -> str:
        parts = []
        wpm = test.get("net_wpm", 0)
        accuracy = test.get("accuracy", 0)
        consistency = test.get("consistency_score", 50)

        if wpm < 25:
            parts.append("Start with speed-building exercises focusing on common words.")
        elif wpm < 35:
            parts.append("You're close to the SSC threshold. Focus on reducing unnecessary movements.")

        if accuracy < 90:
            parts.append("Prioritize accuracy over speed. Slow down and focus on each keystroke.")
        elif accuracy < 95:
            parts.append("Small improvements in accuracy will make you qualifying-ready.")

        if consistency < 60:
            parts.append("Work on maintaining a steady rhythm. Use the metronome feature during practice.")

        if test.get("pause_count", 0) > 10:
            parts.append("Your frequent pauses suggest hesitation. Practice the passages beforehand.")

        fatigue = self._analyze_fatigue(test, test.get("time_taken_seconds", 600))
        if fatigue and fatigue.get("fatigue_detected"):
            parts.append(f"Fatigue starts at ~{fatigue['fatigue_start_seconds']}s. Try building endurance with longer practice sessions.")

        return " ".join(parts) if parts else "Good performance! Keep practicing to maintain consistency."

    def _generate_daily_drills(self, weaknesses: List[str], weak_words: List[str]) -> List[Dict]:
        drills = []
        word_set = set(weak_words[:5])

        if word_set:
            drills.append({
                "name": "Weak Words Drill",
                "description": f"Practice these words: {', '.join(word_set)}",
                "duration_minutes": 5,
                "words": list(word_set),
                "type": "accuracy",
            })

        drills.append({
            "name": "Speed Sprint",
            "description": "Type simple sentences as fast as possible for 2 minutes",
            "duration_minutes": 2,
            "type": "speed",
        })

        if any("accuracy" in w.lower() for w in weaknesses):
            drills.append({
                "name": "Accuracy Focus",
                "description": "Slow down to 90% of your max speed and focus on zero errors",
                "duration_minutes": 5,
                "type": "accuracy",
            })

        drills.append({
            "name": "Rhythm Practice",
            "description": "Use the metronome at 80% of your current WPM for 3 minutes",
            "duration_minutes": 3,
            "type": "rhythm",
        })

        return drills

    def _generate_speed_exercises(self, current_wpm: float) -> List[Dict]:
        target_wpm = max(current_wpm + 5, 35)
        return [
            {
                "name": "Speed Target",
                "target_wpm": target_wpm,
                "duration_seconds": 120,
                "passage_type": "simple_common_words",
            },
            {
                "name": "Burst Typing",
                "description": "Type at 120% of target speed for 30-second bursts",
                "target_wpm": target_wpm * 1.2,
                "duration_seconds": 30,
                "repetitions": 3,
            },
        ]

    def _generate_accuracy_exercises(self, current_accuracy: float, weak_words: List[str]) -> List[Dict]:
        return [
            {
                "name": "Zero Error Challenge",
                "target_accuracy": 100.0,
                "duration_seconds": 120,
                "description": "Type slowly but aim for zero errors",
            },
            {
                "name": "Weak Word Focus",
                "words": weak_words[:10],
                "repetitions": 10,
                "description": "Practice each weak word 10 times correctly",
            },
        ]

    def _calculate_overall_score(self, test: Dict) -> float:
        weights = {"wpm": 0.35, "accuracy": 0.35, "consistency": 0.15, "time_utilization": 0.15}
        scores = {}

        wpm = test.get("net_wpm", 0)
        scores["wpm"] = min(100, (wpm / 50) * 100)

        scores["accuracy"] = test.get("accuracy", 0)

        scores["consistency"] = test.get("consistency_score", 50)

        time_util = test.get("time_utilization_percentage", 50)
        scores["time_utilization"] = time_util

        total = sum(scores[k] * weights[k] for k in weights)
        return min(100, total)

    def _suggest_practice_passage(self, weak_words: List[str]) -> Optional[str]:
        if not weak_words:
            return None
        return f"A passage focused on {', '.join(weak_words[:3])} and related administrative vocabulary"

    def _predict_improvement(self, test: Dict, recent: List[Dict]) -> Optional[Dict]:
        if len(recent) < 5:
            return None

        recent_wpms = [t.get("net_wpm", 0) for t in recent[-5:]]
        recent_accuracies = [t.get("accuracy", 0) for t in recent[-5:]]

        if len(recent_wpms) >= 2:
            wpm_trend = recent_wpms[-1] - recent_wpms[0]
            accuracy_trend = recent_accuracies[-1] - recent_accuracies[0]

            return {
                "wpm_trend": f"{'+' if wpm_trend >= 0 else ''}{round(wpm_trend, 1)} WPM over last 5 tests",
                "accuracy_trend": f"{'+' if accuracy_trend >= 0 else ''}{round(accuracy_trend, 1)}% over last 5 tests",
                "projected_wpm_7_days": round(recent_wpms[-1] + (wpm_trend * 1.4), 1) if len(recent_wpms) >= 2 else None,
                "projected_accuracy_7_days": round(min(100, recent_accuracies[-1] + (accuracy_trend * 1.4)), 1) if len(recent_accuracies) >= 2 else None,
            }

        return None


ai_coach = AITypingCoach()
