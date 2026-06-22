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

    # SSC Full/Half mistake system
    full_mistakes: int = 0
    half_mistakes: int = 0
    ssc_net_wpm: float = 0.0
    ssc_accuracy: float = 0.0
    ssc_error_percentage: float = 0.0

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

        # SSC Full/Half mistake calculation
        # Full Mistake (100% penalty): Omission, Substitution, Addition, Spelling errors
        # Half Mistake (50% penalty): Capitalization, Punctuation, Spacing errors
        full_mistakes, half_mistakes = self._calculate_full_half_mistakes(
            original_clean, typed_clean, char_diffs, word_errors
        )

        minutes = duration_seconds / 60.0 if duration_seconds > 0 else 1.0
        ssc_net_wpm = self._calculate_ssc_net_wpm(
            key_depression_count, full_mistakes, half_mistakes, minutes
        )

        ssc_total_errors = full_mistakes + (half_mistakes / 2.0)
        ssc_accuracy = self._calculate_ssc_accuracy(
            key_depression_count, ssc_total_errors
        )
        ssc_error_pct = round(100.0 - ssc_accuracy, 2) if ssc_accuracy > 0 else 0.0

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
            full_mistakes=full_mistakes,
            half_mistakes=half_mistakes,
            ssc_net_wpm=round(ssc_net_wpm, 2),
            ssc_accuracy=round(ssc_accuracy, 2),
            ssc_error_percentage=ssc_error_pct,
            error_details=char_diffs[:50],
            word_level_errors=word_errors,
            char_level_diffs=char_diffs,
        )

    def _calculate_full_half_mistakes(
        self,
        original: str,
        typed: str,
        char_diffs: List[Dict],
        word_errors: List[Dict],
    ) -> Tuple[int, int]:
        """
        SSC Official Full/Half Mistake Calculation:

        Full Mistakes (100% penalty):
        - Word Omission: skipping a word entirely
        - Word Substitution: replacing with completely different word
        - Word Addition: typing extra word
        - Spelling error with >2 char difference

        Half Mistakes (50% penalty):
        - Capitalization error (e.g., 'india' vs 'India')
        - Punctuation error (missing/additional punctuation)
        - Spacing error (extra/missing space within word)
        - Minor typo (1-2 character difference)
        """
        full_mistakes = 0
        half_mistakes = 0

        for we in word_errors:
            if we["is_correct"]:
                continue

            orig = we["original"]
            typed_w = we["typed"]
            err_type = we["error_type"]

            # Full mistakes
            if err_type == "omission":
                full_mistakes += 1
            elif err_type == "addition":
                full_mistakes += 1
            elif err_type == "wrong_word":
                full_mistakes += 1
            elif err_type == "typo":
                # Check if it's a capitalization-only error -> half mistake
                if orig.lower() == typed_w.lower():
                    half_mistakes += 1
                else:
                    lev_dist = Levenshtein.distance(orig, typed_w)
                    if lev_dist <= 2:
                        # Minor typo (1-2 chars off)
                        # Check if punctuation-only difference
                        orig_clean = ''.join(c for c in orig if c.isalnum() or c.isspace())
                        typed_clean_w = ''.join(c for c in typed_w if c.isalnum() or c.isspace())
                        if orig_clean == typed_clean_w:
                            half_mistakes += 1  # Punctuation error = half
                        else:
                            full_mistakes += 1  # Spelling error = full
                    else:
                        full_mistakes += 1

        # Count spacing errors as half mistakes
        for cd in char_diffs:
            if cd["type"] == "space":
                # Check if this space error is already counted in word errors
                is_partial = True
                for we in word_errors:
                    if not we["is_correct"] and (we["error_type"] == "omission" or we["error_type"] == "addition"):
                        is_partial = False
                        break
                if is_partial:
                    half_mistakes += 1

        return full_mistakes, half_mistakes

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
        if original.lower() == typed.lower():
            return "typo"  # Capitalization-only difference
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

    def _calculate_ssc_net_wpm(self, key_depressions: int, full_mistakes: int, half_mistakes: int, minutes: float) -> float:
        """
        SSC Official: Net WPM = ((Total Key Depressions ÷ 5) - Total Errors) ÷ Time in minutes
        Total Errors = Full Mistakes + (Half Mistakes ÷ 2)
        """
        if minutes <= 0:
            return 0.0
        gross_words = key_depressions / 5.0
        total_errors = full_mistakes + (half_mistakes / 2.0)
        net_words = max(0, gross_words - total_errors)
        return net_words / minutes

    def _calculate_ssc_accuracy(self, key_depressions: int, total_errors: float) -> float:
        if key_depressions <= 0:
            return 0.0
        return max(0, ((key_depressions - total_errors) / key_depressions) * 100.0)

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
