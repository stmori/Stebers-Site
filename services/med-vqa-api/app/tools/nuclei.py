"""Optional tool: nuclei segmentation in H&E histology with Jake's LoRA-fine-tuned MobileSAM (exported to ONNX).

Runs on CPU with ONNX Runtime (no PyTorch). Only meant for H&E-stained histology tiles; for other images it reports
that it doesn't apply, and the answer model says so while still answering normally.
"""
import base64
import io
import os
import re

import numpy as np
from PIL import Image

from .. import config

HISTOLOGY_WORDS = ("histolog", "h&e", "h & e", "hematoxylin", "haematoxylin", "patholog", "tissue section",
                   "micrograph", "biopsy", "cytolog", "slide")
MIN_NUCLEUS_PX = 30          # at 1024x1024 model resolution; smaller blobs are noise
INPUT = 1024


def looks_like_histology(findings):
    text = f'{findings.get("modality", "")} {findings.get("body_region", "")}'.lower()
    return any(w in text for w in HISTOLOGY_WORDS)



def _short_modality(findings):
    """'Chest X-ray (AP portable)' -> 'chest X-ray'; keeps acronyms like CT/MRI as they are."""
    m = re.sub(r"\s*\(.*?\)", "", str(findings.get("modality") or "")).strip() or "image"
    return m[0].lower() + m[1:] if len(m) > 1 and m[1].islower() else m

class NucleiTool:
    def __init__(self, path=None):
        self.path = path or config.NUCLEI_MODEL
        self.session = None
        if os.path.exists(self.path):
            import onnxruntime as ort
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = config.NUCLEI_THREADS
            self.session = ort.InferenceSession(self.path, sess_options=opts, providers=["CPUExecutionProvider"])

    @property
    def ready(self):
        return self.session is not None

    def segment(self, img: Image.Image):
        """Return an instance label map at 1024x1024 (0 = background)."""
        from scipy import ndimage
        x = np.asarray(img.convert("RGB").resize((INPUT, INPUT), Image.BILINEAR), dtype=np.float32)
        logits = self.session.run(None, {"image": x.transpose(2, 0, 1)[None]})[0][0, 0]          # 256x256
        up = np.asarray(Image.fromarray(logits.astype(np.float32), mode="F").resize((INPUT, INPUT), Image.BILINEAR))
        labels, n = ndimage.label(up > 0.0)                                                    # sigmoid > 0.5
        if n:
            sizes = ndimage.sum(np.ones_like(labels), labels, index=np.arange(1, n + 1))
            keep = np.zeros(n + 1, dtype=bool); keep[1:] = sizes >= MIN_NUCLEUS_PX
            labels, n = ndimage.label(keep[labels])
        return labels, n

    @staticmethod
    def overlay(img: Image.Image, labels, max_side=900):
        base = img.convert("RGB"); base.thumbnail((max_side, max_side))
        lab = np.asarray(Image.fromarray(labels.astype(np.int32)).resize(base.size, Image.NEAREST))
        rng = np.random.default_rng(7)
        palette = rng.integers(90, 256, size=(int(lab.max()) + 1, 3)).astype(np.float32)
        arr = np.asarray(base).astype(np.float32)
        m = lab > 0
        arr[m] = 0.65 * arr[m] + 0.35 * palette[lab[m]]                       # light colored fill
        edge = np.zeros_like(m)                                              # 2-px outline where the label changes
        edge[1:, :] |= lab[1:, :] != lab[:-1, :]; edge[:-1, :] |= lab[:-1, :] != lab[1:, :]
        edge[:, 1:] |= lab[:, 1:] != lab[:, :-1]; edge[:, :-1] |= lab[:, :-1] != lab[:, 1:]
        edge &= m | np.roll(m, 1, 0) | np.roll(m, 1, 1)
        arr[edge] = (255, 236, 64)                                           # bright yellow outlines
        buf = io.BytesIO()
        Image.fromarray(arr.astype(np.uint8)).save(buf, format="JPEG", quality=85)
        return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

    def run(self, img: Image.Image, findings):
        name = "LoRA-fine-tuned MobileSAM nuclei segmentation"
        if not self.ready:
            return dict(status="unavailable", tool=name,
                        message="The nuclei model isn't installed on this server, so the analysis was skipped.")
        if not looks_like_histology(findings):
            return dict(status="not_applicable", tool=name,
                        message=f"The nuclei analysis tool only works on H&E-stained histology slides, so it wasn't "
                                f"run on this {_short_modality(findings)}.")
        labels, n = self.segment(img)
        if n < 3:
            return dict(status="no_nuclei", tool=name, count=int(n),
                        message="The model found almost no nuclei. The image may not be an H&E tile at a usable "
                                "magnification, or it may be mostly non-cellular tissue.")
        from scipy import ndimage
        areas = ndimage.sum(np.ones_like(labels), labels, index=np.arange(1, n + 1)).astype(np.float64)
        coverage = float((labels > 0).mean() * 100)
        cv = float(areas.std() / areas.mean())
        variability = "fairly uniform" if cv < 0.5 else "moderately variable" if cv < 0.9 else "highly variable"
        density = "sparse" if coverage < 8 else "moderate" if coverage < 20 else "dense"
        return dict(status="ok", tool=name, count=int(n), coverage_pct=round(coverage, 1),
                    mean_area_px=round(float(areas.mean()), 1), area_cv=round(cv, 2),
                    size_variability=variability, density=density,
                    message=f"Found {n} nuclei covering {coverage:.1f}% of the tile ({density} cellularity); "
                            f"nuclear size is {variability} (coefficient of variation {cv:.2f}).",
                    overlay=self.overlay(img, labels))


def summary_for_prompt(result):
    """Short text for the answer model (no overlay image)."""
    if not result:
        return ""
    if result["status"] == "ok":
        return (f"Nuclei analysis ({result['tool']}): {result['message']} Mean nucleus area is "
                f"{result['mean_area_px']} px at 1024x1024 model resolution (relative, not calibrated to microns).")
    return f"Nuclei analysis ({result['tool']}): not available for this image. {result['message']}"
