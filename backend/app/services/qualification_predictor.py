from typing import List, Dict, Optional
import numpy as np


class QualificationPredictor:
    def __init__(self):
        self.chsl_wpm_threshold = 35.0
        self.chsl_wpm_hindi_threshold = 30.0
        self.chsl_accuracy_threshold = 95.0
        self.cgl_accuracy_threshold = 95.0

    def predict_chsl_qualification(self, recent_tests: List[Dict], language: str = "english") -> Dict:
        if not recent_tests:
            return {"probability": 50.0, "is_qualified": False, "confidence": "low"}

        wpm_threshold = self.chsl_wpm_hindi_threshold if language == "hindi" else self.chsl_wpm_threshold
        recent_tests = recent_tests[-20:]

        wpms = [t.get("net_wpm", 0) for t in recent_tests]
        accuracies = [t.get("accuracy", 0) for t in recent_tests]
        consistencies = [t.get("consistency_score", 50) for t in recent_tests]

        avg_wpm = np.mean(wpms) if wpms else 0
        avg_accuracy = np.mean(accuracies) if accuracies else 0
        avg_consistency = np.mean(consistencies) if consistencies else 0

        wpm_weight = 0.4
        accuracy_weight = 0.4
        consistency_weight = 0.2

        wpm_score = min(100, (avg_wpm / wpm_threshold) * 100)
        accuracy_score = min(100, (avg_accuracy / self.chsl_accuracy_threshold) * 100)
        consistency_score = avg_consistency

        probability = (wpm_score * wpm_weight) + (accuracy_score * accuracy_weight) + (consistency_score * consistency_weight)
        probability = min(99, max(1, probability))

        recent_trend = self._calculate_trend(wpms)
        if recent_trend > 0:
            probability = min(99, probability + 5)
        elif recent_trend < 0:
            probability = max(1, probability - 5)

        is_qualified = avg_wpm >= wpm_threshold and avg_accuracy >= self.chsl_accuracy_threshold

        confidence = "high" if len(recent_tests) >= 10 else "medium" if len(recent_tests) >= 5 else "low"

        return {
            "probability": round(probability, 1),
            "is_qualified": is_qualified,
            "confidence": confidence,
            "avg_wpm": round(avg_wpm, 1),
            "avg_accuracy": round(avg_accuracy, 1),
            "avg_consistency": round(avg_consistency, 1),
            "tests_analyzed": len(recent_tests),
        }

    def predict_cgl_dest_qualification(self, recent_tests: List[Dict]) -> Dict:
        if not recent_tests:
            return {"probability": 50.0, "is_qualified": False, "confidence": "low"}

        recent_tests = recent_tests[-20:]

        accuracies = [t.get("accuracy", 0) for t in recent_tests]
        consistencies = [t.get("consistency_score", 50) for t in recent_tests]

        avg_accuracy = np.mean(accuracies) if accuracies else 0
        avg_consistency = np.mean(consistencies) if consistencies else 0

        accuracy_score = min(100, (avg_accuracy / self.cgl_accuracy_threshold) * 100)
        consistency_score = avg_consistency

        probability = (accuracy_score * 0.7) + (consistency_score * 0.3)
        probability = min(99, max(1, probability))

        accuracy_trend = self._calculate_trend(accuracies)
        if accuracy_trend > 0:
            probability = min(99, probability + 3)

        is_qualified = avg_accuracy >= self.cgl_accuracy_threshold

        confidence = "high" if len(recent_tests) >= 10 else "medium" if len(recent_tests) >= 5 else "low"

        return {
            "probability": round(probability, 1),
            "is_qualified": is_qualified,
            "confidence": confidence,
            "avg_accuracy": round(avg_accuracy, 1),
            "avg_consistency": round(avg_consistency, 1),
            "tests_analyzed": len(recent_tests),
        }

    def _calculate_trend(self, values: List[float]) -> float:
        if len(values) < 3:
            return 0.0
        recent = values[-3:]
        return recent[-1] - recent[0]


qualification_predictor = QualificationPredictor()
