---
slug: med-vqa
title: "Med-VQA: Multimodal RAG for Medical Image Question Answering"
short_title: Med-VQA
order: 1
featured: true
status: live
published: true
period: Oct 2026
context: Knight Hacks 2026 hackathon, University of Central Florida
role: ML & backend engineer (model selection, retrieval, API, infrastructure)
team: [Jake Weber, Evanton]
summary: >-
  Upload an X-ray, CT, MRI, DICOM or histology image, ask a question in plain English, and get a
  conversational answer grounded in NIH sources with numbered citations and similar real past cases.
highlights:
  - "Built a two-stage multimodal RAG pipeline: a vision-language model reads the image into structured findings, then a retrieval step grounds the answer in 16,346 NIH patient-education passages and 3,818 real chest X-ray reports"
  - "Benchmarked open medical VLMs on the UCF CRCV GPU cluster (vLLM on RTX A6000 / A100): Qwen3.5-9B, Lingshu-7B, Qwen3-VL-8B and Qwen3.8-27B across VQA-RAD, SLAKE and PathVQA, then shipped Claude Haiku 5.5 at ~$0.001 per question"
  - "Model-suggested search terms with per-term retrieval made the right source the top hit (e.g. 'What is Pneumonia?' at 0.86 cosine for a pneumonia X-ray), with every answer citing its sources"
  - "Production touches: DICOM ingestion with header stripping, conversation memory, an answer cache (6 s → 0.01 s on repeats), per-IP rate limiting, and an optional nuclei-segmentation tool powered by my own LoRA-tuned MobileSAM"
  - "Containerized with Docker Compose (Caddy for HTTPS and the static site, FastAPI for the API); the API key is injected from an untracked .env file and never committed"
metrics:
  - {value: "75%", label: "VQA-RAD yes/no accuracy (live pipeline)"}
  - {value: "100%", label: "answers citing NIH sources"}
  - {value: "~5–7 s", label: "per answer, end to end"}
  - {value: "20k+", label: "searchable passages and past cases"}
tech: [Python, FastAPI, Claude Haiku 5.5, Anthropic API, ChromaDB, fastembed (bge-small), vLLM, PyTorch, ONNX Runtime, pydicom, Docker Compose, Caddy, Next.js, Slurm]
links:
  - {label: "Live demo", url: "/projects/med-vqa/"}
  - {label: "Source (backend)", url: "https://github.com/stmori/Stebers-Site/tree/main/services/med-vqa-api"}
  - {label: "Evaluation results", url: "https://github.com/stmori/Stebers-Site/blob/main/services/med-vqa-api/eval/RESULTS.md"}
cover: media/screenshot.jpg
gallery:
  - {src: media/screenshot.jpg, alt: "Med-VQA chat interface with example X-rays", caption: "The Med-VQA chat page"}
youtube: []
documents: []
---

## Overview

Med-VQA answers questions about medical images in plain language. You upload a scan, ask something like *"is anything wrong?"* or *"is the heart enlarged?"*, and get a short, conversational answer. Each medical claim links to the NIH page it came from, and chest X-rays also come with the most similar real cases from a public archive of radiology reports. It was built in about a day at Knight Hacks 2026 with Evanton, who built the web frontend.

## How it works

1. **Read the image.** A vision-language model (Claude Haiku 5.5) turns the image into structured findings: modality, body region, key observations, a direct short answer, and 2–4 search terms such as "pneumonia" or "pleural effusion". Structured outputs guarantee the JSON always parses.
2. **Retrieve.** Each search term is embedded (bge-small via fastembed, ONNX on CPU) and searched separately in ChromaDB over 16,346 MedQuAD passages from NIH sites (MedlinePlus, NHLBI, GARD, …). The results are interleaved so every term is represented, with weak and duplicate matches dropped. Chest X-rays are also matched against 3,818 Indiana University reports from Open-I.
3. **Answer.** A second call writes a short, direct answer in the voice of a radiology tutor: best judgment first ("most likely pneumonia, which I'd call likely"), then the supporting findings, with inline `[n]` citations. Follow-up questions carry the earlier conversation.
4. **Optional nuclei analysis.** For H&E histology images, a toggle runs my LoRA-fine-tuned MobileSAM (see the LoRA project) to count and outline cell nuclei. Its measurements feed into the answer. For other images, the answer says the tool doesn't apply.

## Choosing the model

Before the hackathon, I benchmarked open models on the UCF CRCV cluster with vLLM: Qwen3.5-9B, Lingshu-7B (medical-tuned), Qwen3-VL-8B and Qwen3.8-27B-FP8 on VQA-RAD, SLAKE and PathVQA. Qwen3.5-9B was the best all-rounder (80.5% on VQA-RAD yes/no questions), and Lingshu led on pathology (82.6% on PathVQA). For a site that has to stay up permanently without a GPU server, I shipped Claude Haiku 5.5 through the API, which costs about a tenth of a cent per question. The provider is a one-line setting, so the same pipeline also runs against OpenAI or any vLLM server.

## Results

- **75%** on 100 VQA-RAD yes/no questions through the live pipeline, comparable to the 7–9B open models I benchmarked.
- **20/20** end-to-end answers succeeded in testing, **100%** cited NIH sources (2.6 citations on average), with a median of a few seconds per answer.
- Prompt and retrieval work moved the pneumonia example's top source from unrelated pages (pneumothorax, fibrosis) to *"What is Pneumonia?"*, and turned 4-paragraph hedged replies into direct one-paragraph answers.

## Engineering details

- **Deployment:** Docker Compose with two containers. Caddy serves HTTPS and the static Next.js site and routes `/api/med-vqa/*`; FastAPI runs the model calls and retrieval. The search index is delivered to the server once, outside git.
- **Privacy and safety:** uploads are processed in memory and never stored. DICOM headers, which can contain patient details, are discarded before anything leaves the server. A per-IP rate limit and a spend-capped API key prevent abuse. The UI makes clear this is an educational demo, not a diagnosis.
- **Reliability:** an answer cache, friendly errors for bad input or model refusals, and a test suite that runs without an API key.
