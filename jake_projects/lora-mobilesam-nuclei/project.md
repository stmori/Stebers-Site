---
slug: lora-mobilesam-nuclei
title: "Nuclei Instance Segmentation with LoRA-Fine-Tuned MobileSAM"
short_title: LoRA Nuclei Segmentation
order: 5
featured: false
status: complete
published: true
period: Apr 2026
context: UCF graduate coursework (medical image computing)
role: Sole author
team: [Jake Weber]
summary: >-
  Adapted the lightweight MobileSAM segmentation model to find cell nuclei in H&E histology by training only
  29.7k LoRA parameters (~0.3% of the model), with no prompts needed at inference. It now powers Med-VQA's
  nuclei-analysis tool.
highlights:
  - "Engineered a parameter-efficient fine-tuning (PEFT) pipeline that injects rank-4 LoRA adapters into MobileSAM's TinyViT attention layers, training only 29,696 parameters (~0.3% of the model) for edge-friendly inference"
  - "Reached 0.77 mean IoU and 0.81 F1 on NuInsSeg (31 human and mouse organs) using prompt-free inference: one forward pass and connected components, no clicks or boxes"
  - "Evaluated with 5-fold cross-validation using pathology-standard instance metrics (Dice, Aggregated Jaccard Index, Panoptic Quality) with Hungarian matching"
  - "Merged the LoRA weights back into the base model and exported it to ONNX for CPU inference, so it now runs as the optional nuclei-analysis tool inside Med-VQA"
metrics:
  - {value: "0.77", label: "mean IoU"}
  - {value: "0.81", label: "F1"}
  - {value: "29.7k", label: "trainable parameters (~0.3%)"}
  - {value: "rank 4", label: "LoRA adapters"}
tech: [Python, PyTorch, MobileSAM, TinyViT, LoRA, PEFT, scikit-image, ONNX Runtime, NuInsSeg]
links:
  - {label: "Source", url: "https://github.com/Jeber811/Fine-Tuning-MobileSAM-with-LoRA-for-Nuclei-Instance-Segmentation"}
  - {label: "Try it in Med-VQA", url: "/projects/med-vqa/"}
cover: ""
gallery: []
youtube: []
documents:
  - {label: "Report (PDF)", url: "https://github.com/Jeber811/Fine-Tuning-MobileSAM-with-LoRA-for-Nuclei-Instance-Segmentation/blob/main/Report.pdf"}
---

## Overview

Counting and outlining cell nuclei in H&E-stained tissue is a basic step in computational pathology: nuclear density, size and shape variation all carry diagnostic signal. Segment Anything (SAM) models segment well in general but aren't trained on histology. They also usually need a human to click or draw boxes. This project adapts **MobileSAM**, a lightweight SAM variant with a TinyViT image encoder, to nuclei **without prompts** and while training almost nothing.

## Approach

- **LoRA on the image encoder.** Every attention `qkv` projection in TinyViT is wrapped with a rank-4 low-rank adapter (α = 8), and all original weights stay frozen. Only **29,696 parameters** are trained, about 0.3% of MobileSAM.
- **Prompt-free decoding.** The mask decoder gets an empty prompt and predicts a nuclei probability map for the whole tile in a single pass. Thresholding plus connected components turns it into individual nucleus instances.
- **Training.** NuInsSeg (H&E tiles from 31 human and mouse organs) at 1024×1024, BCE loss, AdamW (learning rate 1e-4), 5-fold cross-validation.
- **Evaluation.** Pixel IoU and F1, plus the instance-level metrics used in pathology: Dice, Aggregated Jaccard Index (AJI) and Panoptic Quality (PQ), with Hungarian matching between predicted and ground-truth nuclei.

## Results

**0.77 mean IoU** and **0.81 F1**, with metrics still rising when training stopped at 10 epochs. Longer schedules are the obvious next step.

## In production: Med-VQA nuclei analysis

I merged the LoRA weights back into the base model (`W' = W + (A·B)·α/r`), so it runs as a plain MobileSAM, and exported it to **ONNX** for CPU inference on the Med-VQA server. With the *nuclei analysis* toggle on, an H&E histology image gets a nuclei count, density, size variation and a colored overlay. The answer model uses those measurements, and for non-histology images it says the tool doesn't apply.
