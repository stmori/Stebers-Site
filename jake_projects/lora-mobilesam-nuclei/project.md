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
  - "Reached 0.72 Dice/F1 and 0.59 Aggregated Jaccard Index on held-out NuInsSeg tiles (31 human and mouse organs) with prompt-free inference: one forward pass and connected components, no clicks or boxes"
  - "Evaluated with 5-fold cross-validation using pathology-standard instance metrics (Dice, AJI, Panoptic Quality) with Hungarian matching; a longer 30-epoch retrain raised AJI from 0.47 to 0.59 on the same validation fold"
  - "Merged the LoRA weights back into the base model and exported it to ONNX for CPU inference, so it now runs as the optional nuclei-analysis tool inside Med-VQA"
metrics:
  - {value: "0.72", label: "Dice / F1"}
  - {value: "0.59", label: "AJI (instance)"}
  - {value: "29.7k", label: "trainable parameters (~0.3%)"}
  - {value: "rank 4", label: "LoRA adapters"}
tech: [Python, PyTorch, MobileSAM, TinyViT, LoRA, PEFT, scikit-image, ONNX Runtime, NuInsSeg]
links:
  - {label: "Source", url: "https://github.com/Jeber811/Fine-Tuning-MobileSAM-with-LoRA-for-Nuclei-Instance-Segmentation"}
  - {label: "Try it in Med-VQA", url: "/projects/med-vqa/"}
cover: media/architecture.jpg
gallery:
  - {src: media/architecture.jpg, alt: "Diagram: frozen MobileSAM encoder, decoder and prompt encoder, with LoRA down/up-projection matrices added to an attention layer",
     caption: "Architecture: LoRA adapters inside MobileSAM's frozen TinyViT encoder"}
  - {src: media/retrained-val-example.jpg, alt: "Validation H&E tile, ground-truth nuclei, and predictions from the 30-epoch retrained model side by side",
     caption: "Held-out tile: original, ground truth, 30-epoch model prediction"}
  - {src: media/report-fold1-example.jpg, alt: "H&E tile, ground-truth nuclei instances, and LoRA predictions side by side",
     caption: "Original H&E tile, ground-truth nuclei, and LoRA prediction (from the course report)"}
youtube: []
documents:
  - {label: "Report (PDF)", url: "https://github.com/Jeber811/Fine-Tuning-MobileSAM-with-LoRA-for-Nuclei-Instance-Segmentation/blob/main/Report.pdf"}
---

## Overview

Counting and outlining cell nuclei in H&E-stained tissue is a basic step in computational pathology: nuclear density, size and shape variation all carry diagnostic signal. Segment Anything (SAM) models segment well in general but aren't trained on histology. They also usually need a human to click or draw boxes. This project adapts **MobileSAM**, a lightweight SAM variant with a TinyViT image encoder, to nuclei **without prompts** and while training almost nothing.

## Approach

- **LoRA on the image encoder.** Every attention `qkv` projection in TinyViT is wrapped with a rank-4 low-rank adapter (α = 8), and all original weights stay frozen. Only **29,696 parameters** are trained, about 0.3% of MobileSAM.
- **Prompt-free decoding.** The mask decoder gets an empty prompt and predicts a nuclei probability map for the whole tile in a single pass. Thresholding plus connected components turns it into individual nucleus instances.
- **Training.** NuInsSeg (665 H&E tiles from 31 human and mouse organs) at 1024×1024, BCE loss, AdamW (learning rate 1e-4), batch 2, 5-fold cross-validation (10 epochs per fold in the course report).
- **Evaluation.** Pixel IoU and F1, plus the instance-level metrics used in pathology: Dice, Aggregated Jaccard Index (AJI) and Panoptic Quality (PQ), with Hungarian matching between predicted and ground-truth nuclei.

## Results

The course report trained 10 epochs per fold and averaged **Dice 0.61, AJI 0.42, PQ 0.14** over 5 folds, with the loss still falling. So I retrained on fold 1 for **30 epochs** with everything else unchanged and measured the same 133 held-out tiles:

| Fold 1 (133 validation tiles) | Dice / F1 | Pixel IoU | AJI | PQ |
|---|---|---|---|---|
| Report, 10 epochs | 0.665 | – | 0.466 | 0.165 |
| Retrain, 10 epochs | 0.674 | 0.529 | 0.438 | 0.172 |
| **Retrain, 30 epochs (deployed)** | **0.720** | **0.585** | **0.595** | **0.186** |

The biggest gain is in AJI, which means nuclei are separated into the right instances more often instead of merged blobs. PQ is still low because touching nuclei often merge after thresholding. A watershed or distance-map head is the next step.

## In production: Med-VQA nuclei analysis

I merged the 30-epoch LoRA weights back into the base model (`W' = W + (A·B)·α/r`), so it runs as a plain MobileSAM, and exported it to **ONNX** (52 MB, ~1.2 s per tile on CPU, identical masks to PyTorch) for the Med-VQA server. With the *nuclei analysis* toggle on, an H&E histology image gets a nuclei count, density, size variation and a colored overlay. The answer model uses those measurements, and for non-histology images it says the tool doesn't apply.
