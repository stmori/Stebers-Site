# Med-VQA evaluation: VQA-RAD

Run with `scripts/eval_vqarad.py` on 2026-10-10, against the live pipeline code, model `claude-haiku-5-5` (effort `low`). Raw results: `vqarad_results.json`.

## Vision stage: 100 closed (yes/no) questions
VQA-RAD test split, random sample (seed 0). We score the first "yes"/"no" in the model's `short_answer`.

| | |
|---|---|
| **Accuracy** | **75%** (75/100) |
| Answered with a clear yes/no | 99/100 |
| API errors | 0 |

Before the prompt asked the model to lead with "Yes"/"No", it hedged on 45/100 questions. It was 84% correct when it did commit, but only 46% overall.

For context: open models we benchmarked on the CRCV cluster scored 74.5–80.5% on all 251 VQA-RAD closed questions (Qwen3-VL-8B 74.5%, Lingshu-7B 77.7%, Qwen3.5-9B 80.5%). Those runs used a short-answer prompt, so the numbers aren't directly comparable.

## Full pipeline: 20 questions through `POST /api/ask`
| | |
|---|---|
| Successful responses | 20/20 |
| Latency, median / p90 | 7.4 s / 9.1 s (vision + retrieval + cited answer) |
| Answers citing ≥1 NIH source | 100% |
| Citations per answer | 2.6 on average |

## Caveats
- 100 questions is a small sample (±~9 percentage points at 95% confidence).
- Typical misses: fine spatial details (pleural outline), MRI vs CT terminology ("hyperdense" vs "hyperintense"), and questions about mechanisms rather than the image.
- This measures image question answering, not clinical accuracy. The app is an educational demo.
