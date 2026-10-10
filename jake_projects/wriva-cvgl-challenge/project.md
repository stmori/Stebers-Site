---
slug: wriva-cvgl-challenge
title: "IARPA WRIVA Cross-View Geo-Localization Challenge 2026: 15th Place Globally"
short_title: WRIVA CVGL Challenge
order: 3
featured: true
status: complete
published: true
period: May 2026 – Aug 2026
context: IARPA WRIVA Cross-View Geo-Localization (CVGL) Challenge 2026, Codabench
role: Solo competitor (team "jeber81")
team: [Jake Weber]
summary: >-
  Located ground-level photos on Maxar satellite imagery (latitude, longitude, heading, pitch) with a customized
  DINOv3 pipeline, finishing 15th globally in IARPA's 2026 challenge.
highlights:
  - "Placed 15th globally (final score 107.36) in the IARPA-sponsored WRIVA Cross-View Geo-Localization Challenge, recognized with an IARPA certificate of achievement"
  - "Customized a DINOv3-based pipeline that matches ground-level frames to Maxar satellite GeoTIFFs by cosine similarity of 2048-dimensional embeddings"
  - "Removed a ~32 m grid-quantization error with softmax spatial-centroid aggregation over 50%-overlapping 128×128 satellite chips, producing continuous coordinates instead of snapping to chip centers"
  - "Engineered a crash-resilient, stateful inference loop: weights and code cached on local NVMe to survive network-drive disconnects, plus frame-level resume, so 10-hour runs could be interrupted and continued on another machine"
  - "Automated geospatial handling and submission packaging: on-the-fly CRS reprojection to WGS84 with rasterio/pyproj, variance-based skipping of blank tiles, and a validated Codabench archive across in- and out-of-distribution sites"
metrics:
  - {value: "15th", label: "global leaderboard rank"}
  - {value: "107.36", label: "final score"}
  - {value: "~32 m", label: "quantization error removed"}
tech: [Python, PyTorch, DINOv3, Hugging Face Hub, Rasterio, PyProj, GeoTIFF, Google Colab, Codabench]
links:
  - {label: "Source", url: "https://github.com/Jeber811/CVGL-Challenge"}
  - {label: "Official leaderboard", url: "https://www.codabench.org/competitions/16082/#/results-tab"}
cover: media/certificate.jpg
gallery:
  - {src: media/certificate.jpg, alt: "IARPA certificate of achievement: WRIVA CVGL Challenge 2026, leaderboard rank 15, final score 107.36, presented to Jake Weber",
     caption: "IARPA certificate of achievement (August 2026)"}
youtube: []
documents: []
---

## Overview

Cross-view geo-localization means working out *where* a ground-level photo was taken by matching it against overhead satellite imagery. In IARPA's 2026 WRIVA CVGL Challenge, systems received sequences of ground camera frames and had to predict each frame's latitude, longitude, heading and pitch on Maxar satellite GeoTIFFs, including on test sites whose data differed from training. I competed solo and finished **15th globally** with a final score of **107.36**, recognized by an IARPA certificate of achievement.

## What I built

My pipeline starts from a DINOv3-based cross-view architecture (from Johns Hopkins University). It slides a window over the satellite map, embeds each 128×128 chip and the ground frame into 2048-dimensional features, and ranks chips by cosine similarity. On top of that baseline I made several upgrades.

**Accuracy**
- **Softmax spatial-centroid aggregation.** The baseline snapped every prediction to the center of a grid chip, a built-in error of about 32 m. I switched to 50%-overlapping chips (64 px stride) and computed a softmax-weighted centroid of the top matches, giving continuous coordinates.
- **Dynamic CRS reprojection.** The pipeline detects each GeoTIFF's projected coordinate system and converts predictions to standard WGS84 latitude/longitude on the fly, using rasterio and pyproj.

**Speed and robustness**
- **Variance filter.** Blank or low-information satellite tiles (pixel variance < 10) are skipped before they reach the GPU.
- **Corrupted-image guardrails.** Unreadable ground images fall back to the site's center instead of crashing the run or producing missing-file penalties.
- **Local NVMe caching.** Model weights and code are copied to local disk before inference, which isolated the run from network-drive disconnects (Errno 107) under heavy read load.
- **Stateful resume.** A skip-ahead scanner checks which frames already have saved predictions, so 10-hour runs could be stopped and resumed, even on a different server, without losing progress.

**Submission**
- A custom packager writes thousands of per-frame JSON predictions into the required folder tree and validates the counts against the inputs. It handles both the in-distribution sites (A01–A11) and the out-of-distribution site (M02).
