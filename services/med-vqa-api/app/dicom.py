"""DICOM (.dcm) uploads: convert the pixels to an 8-bit image; the header (which can hold patient details) is discarded."""
import io

import numpy as np
from PIL import Image


def is_dicom(data: bytes) -> bool:
    return len(data) > 132 and data[128:132] == b"DICM"


def to_image(data: bytes) -> Image.Image:
    import pydicom
    from pydicom.pixels import apply_voi_lut

    try:
        ds = pydicom.dcmread(io.BytesIO(data))
        arr = ds.pixel_array
    except Exception as e:
        raise ValueError("This DICOM file couldn't be read (it may use an unsupported compression). "
                         "Export it as PNG or JPEG and try again.") from e

    if arr.ndim == 4 or (arr.ndim == 3 and getattr(ds, "SamplesPerPixel", 1) == 1):
        arr = arr[arr.shape[0] // 2]                      # multi-frame: use the middle frame
    if getattr(ds, "SamplesPerPixel", 1) == 3:            # already colour (e.g. ultrasound, photos)
        return Image.fromarray(arr.astype(np.uint8)).convert("RGB")

    try:
        arr = apply_voi_lut(arr, ds)                      # the scan's own display window, if it has one
    except Exception:
        pass
    arr = arr.astype(np.float32)
    lo, hi = np.percentile(arr, (0.5, 99.5))
    if hi <= lo:
        lo, hi = float(arr.min()), float(arr.max()) or 1.0
    arr = np.clip((arr - lo) / (hi - lo), 0, 1) * 255
    if getattr(ds, "PhotometricInterpretation", "") == "MONOCHROME1":
        arr = 255 - arr                                   # MONOCHROME1 means "higher value = darker"
    return Image.fromarray(arr.astype(np.uint8)).convert("RGB")
