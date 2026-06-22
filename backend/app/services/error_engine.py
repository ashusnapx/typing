import Levenshtein
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass, field


@dataclass
class ErrorReport:
    gross_wpm: float
    net_wpm: float
    accuracy: float
    error_percentage: float
    key_depression_count: int
    correct_key_depressions: int
    incorrect_key_depressions: int
    omission_errors: int
    addition_errors: int
    wrong_word_errors: int
    substitution_errors: int
    formatting_errors: int
    space_errors: int
    total_errors: int
    total_words_original: int
    total_words_typed: int
    total_correct_words: int
    error_details: List[Dict] = field(default_factory=list)
    word_level_errors: List[Dict] = field(default_factory=list)
    char_level_diffs: List[Dict] = field(default_factory=list)


class SSCErrorEngine:
    def __init__(self):
        self.minimum_accuracy_for_qualifying = 0.95

    def evaluate(
        self,
        original: str,
        typed: str,
        duration_seconds: float,
        mode: str = "ssc_chsl",
    ) -> ErrorReport:
        original_clean = original.strip()
        typed_clean = typed.strip()

        char_diffs = self._character_level_diff(original_clean, typed_clean)
        word_errors = self._word_level_mapping(original_clean, typed_clean)

        omission_errors = sum(1 for d in char_diffs if d["type"] == "omission")
        addition_errors = sum(1 for d in char_diffs if d["type"] == "addition")
        substitution_errors = sum(1 for d in char_diffs if d["type"] == "substitution")
        space_errors = sum(1 for d in char_diffs if d["type"] == "space")

        wrong_word_errors = sum(1 for w in word_errors if not w["is_correct"])

        key_depression_count = len(typed_clean)
        incorrect_key_depressions = omission_errors + addition_errors + substitution_errors + space_errors
        correct_key_depressions = max(0, key_depression_count - incorrect_key_depressions)

        gross_wpm = self._calculate_gross_wpm(typed_clean, duration_seconds)
        net_wpm = self._calculate_net_wpm(typed_clean, duration_seconds, incorrect_key_depressions)

        total_errors = omission_errors + addition_errors + wrong_word_errors + substitution_errors + space_errors
        accuracy = self._calculate_accuracy(correct_key_depressions, key_depression_count) if key_depression_count > 0 else 0.0
        error_percentage = round(100.0 - accuracy, 2) if accuracy > 0 else 0.0

        original_words = original_clean.split()
        typed_words = typed_clean.split()
        total_correct_words = sum(1 for w in word_errors if w["is_correct"])

        return ErrorReport(
            gross_wpm=round(gross_wpm, 2),
            net_wpm=round(net_wpm, 2),
            accuracy=round(accuracy, 2),
            error_percentage=round(error_percentage, 2),
            key_depression_count=key_depression_count,
            correct_key_depressions=correct_key_depressions,
            incorrect_key_depressions=incorrect_key_depressions,
            omission_errors=omission_errors,
            addition_errors=addition_errors,
            wrong_word_errors=wrong_word_errors,
            substitution_errors=substitution_errors,
            formatting_errors=0,
            space_errors=space_errors,
            total_errors=total_errors,
            total_words_original=len(original_words),
            total_words_typed=len(typed_words),
            total_correct_words=total_correct_words,
            error_details=char_diffs[:50],
            word_level_errors=word_errors,
            char_level_diffs=char_diffs,
        )

    def _character_level_diff(self, original: str, typed: str) -> List[Dict]:
        diffs: List[Dict] = []
        lev_ops = Levenshtein.editops(original, typed)

        for op, orig_start, typed_start in lev_ops:
            entry = {
                "type": "",
                "original_char": "",
                "typed_char": "",
                "original_position": orig_start,
                "typed_position": typed_start,
            }

            if op == "delete":
                entry["type"] = "omission"
                entry["original_char"] = original[orig_start] if orig_start < len(original) else ""
                entry["typed_char"] = ""
            elif op == "insert":
                entry["type"] = "addition"
                entry["original_char"] = ""
                entry["typed_char"] = typed[typed_start] if typed_start < len(typed) else ""
            elif op == "replace":
                orig_c = original[orig_start] if orig_start < len(original) else ""
                typed_c = typed[typed_start] if typed_start < len(typed) else ""

                if orig_c == " " or typed_c == " ":
                    entry["type"] = "space"
                else:
                    entry["type"] = "substitution"
                entry["original_char"] = orig_c
                entry["typed_char"] = typed_c

            diffs.append(entry)

        return diffs

    def _word_level_mapping(self, original: str, typed: str) -> List[Dict]:
        original_words = original.split()
        typed_words = typed.split()

        result = []
        max_len = max(len(original_words), len(typed_words))

        for i in range(max_len):
            orig_word = original_words[i] if i < len(original_words) else ""
            typed_word = typed_words[i] if i < len(typed_words) else ""

            if orig_word == "" and typed_word == "":
                continue

            if orig_word == typed_word:
                result.append({
                    "index": i,
                    "original": orig_word,
                    "typed": typed_word,
                    "is_correct": True,
                    "error_type": None,
                    "similarity": 1.0,
                })
            else:
                error_type = self._classify_word_error(orig_word, typed_word)
                similarity = Levenshtein.ratio(orig_word, typed_word) if orig_word and typed_word else 0.0
                result.append({
                    "index": i,
                    "original": orig_word,
                    "typed": typed_word,
                    "is_correct": False,
                    "error_type": error_type,
                    "similarity": round(similarity, 4),
                })

        return result

    def _classify_word_error(self, original: str, typed: str) -> str:
        if not original:
            return "addition"
        if not typed:
            return "omission"
        lev_dist = Levenshtein.distance(original, typed)
        if lev_dist <= 2:
            return "typo"
        return "wrong_word"

    def _calculate_gross_wpm(self, typed: str, duration_seconds: float) -> float:
        char_count = len(typed)
        minutes = duration_seconds / 60.0
        if minutes <= 0:
            return 0.0
        return (char_count / 5.0) / minutes

    def _calculate_net_wpm(self, typed: str, duration_seconds: float, errors: int) -> float:
        gross = self._calculate_gross_wpm(typed, duration_seconds)
        minutes = duration_seconds / 60.0
        if minutes <= 0:
            return 0.0
        net = gross - (errors / minutes)
        return max(0, net)

    def _calculate_accuracy(self, correct: int, total: int) -> float:
        if total <= 0:
            return 0.0
        return (correct / total) * 100.0

    def is_qualified_chsl(self, wpm: float, accuracy: float, mode: str = "english") -> bool:
        if mode == "hindi":
            return wpm >= 30.0 and accuracy >= 95.0
        return wpm >= 35.0 and accuracy >= 95.0

    def is_qualified_cgl_dest(self, wpm: float, accuracy: float) -> bool:
        return accuracy >= 95.0

    def is_qualified(self, wpm: float, accuracy: float, test_mode: str) -> bool:
        """Dispatch to the correct qualification check based on test mode."""
        if test_mode == "ssc_hindi":
            return self.is_qualified_chsl(wpm, accuracy, mode="hindi")
        if test_mode == "ssc_cgl_dest":
            return self.is_qualified_cgl_dest(wpm, accuracy)
        return self.is_qualified_chsl(wpm, accuracy)


error_engine = SSCErrorEngine()
