---
slug: diffusion-virtual-staining
title: "Diffusion-Based Virtual Staining: H&E → IHC for HER2 Breast Cancer Pathology"
short_title: Diffusion Virtual Staining
order: 4
featured: false
status: complete
published: true
period: Mar 2026 – May 2026
context: CAP 5516 Medical Image Computing, University of Central Florida
role: Sole author
team: [Jake Weber]
summary: >-
  Compared four diffusion architectures, including three with novel components, for computationally turning routine
  H&E histology slides into IHC stains on the BCI breast-cancer benchmark, trained on NVIDIA A100 GPUs.
highlights:
  - "Designed and compared four diffusion-based generative models for H&E-to-IHC virtual staining on the BCI-512 benchmark, which could replace a separate physical staining step for HER2 scoring"
  - "Introduced three novel components: a Topological Consistency Loss (soft Euler characteristic), Spatial-Transformer-in-the-loop correction for slide misalignment, and dual-stream SAM conditioning for a Diffusion Transformer"
  - "Cut FID by ~40% (360.96 → 214.77) with the misalignment-correcting PST-Diff+STN model versus the Brownian Bridge (BBDM) baseline, and reached the best perceptual quality (LPIPS 0.664)"
  - "Trained all models on NVIDIA A100 GPUs in a Slurm HPC environment with mixed precision, under a standardized 2-hour training budget per model for a fair comparison"
metrics:
  - {value: "~40%", label: "lower FID vs baseline"}
  - {value: "4", label: "diffusion architectures compared"}
  - {value: "3", label: "novel model components"}
  - {value: "A100", label: "GPU training (Slurm HPC)"}
tech: [Python, PyTorch, Diffusion Models, Diffusion Transformers, Brownian Bridge Diffusion, Spatial Transformer Networks, SAM, Mixed Precision, Slurm, NVIDIA A100]
links:
  - {label: "Source", url: "https://github.com/Jeber811/Diffusion_Model_Virtual_Staining"}
cover: ""
gallery: []
youtube: []
documents:
  - {label: "Technical report (PDF)", url: "https://github.com/Jeber811/Diffusion_Model_Virtual_Staining/blob/main/Diffusion_Model_Virtual_Staining_Report.pdf", pages: 6}
---

## Overview

Pathologists stain breast-cancer tissue twice: once with routine **H&E**, and again with **immunohistochemistry (IHC)** to score HER2 expression, which guides treatment. Virtual staining tries to predict the IHC image directly from the H&E slide, saving time, tissue and lab cost. This study asks which diffusion-model design choices close the gap with established GAN baselines on the **BCI-512** benchmark.

## What I built

Four diffusion models, each trained under the same 2-hour NVIDIA A100 budget:

| Model | Idea | Params |
|---|---|---|
| **BBDM** | Brownian Bridge diffusion: a direct stochastic bridge from the H&E domain to the IHC domain | 120.25 M |
| **PST-Diff+STN** | Conditional UNet diffusion with a **Spatial Transformer Network in the loop** to correct H&E/IHC slide misalignment, plus a chromatic frequency-guidance loss | 69.43 M |
| **ScoreTopo** | Score-based diffusion with a novel **Topological Consistency Loss** (soft Euler characteristic) and a mutual-information contrastive objective | 66.74 M |
| **HistDiT+SAM** | A Diffusion Transformer with **dual-stream SAM-proxy conditioning** for structure-aware generation | 80.66 M |

## Results

| Model | PSNR ↑ | SSIM ↑ | LPIPS ↓ | FID ↓ |
|---|---|---|---|---|
| BBDM | **15.16** | **0.243** | 0.757 | 360.96 |
| PST-Diff+STN | 10.08 | 0.016 | **0.664** | **214.77** |
| ScoreTopo | 6.89 | 0.001 | 1.169 | 416.81 |
| HistDiT+SAM | 11.93 | 0.0004 | 0.940 | 443.43 |

- **Misalignment correction matters most for realism.** PST-Diff+STN's spatial transformer cut FID by about 40% relative to BBDM and gave the best LPIPS. The H&E and IHC slides in BCI are cut from adjacent tissue and don't line up perfectly, which penalizes models that assume pixel alignment.
- **The bridge formulation wins pixel fidelity.** BBDM scored best on PSNR and SSIM, because a direct domain-to-domain bridge preserves layout.
- **Topological and Transformer variants need longer training.** ScoreTopo and HistDiT+SAM were still converging within the 2-hour budget.

The report discusses the clinical risk of structural hallucination and what each model's inductive biases suggest for making diffusion viable in pathology.
