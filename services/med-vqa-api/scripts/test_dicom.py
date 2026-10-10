"""DICOM upload checks (no API key needed): real sample files + synthetic MONOCHROME1, through the API in mock mode."""
import io, os, sys
os.environ.update(MOCK_LLM="1", RATE_PER_MIN="100")
sys.path.insert(0, os.getcwd())
import numpy as np, pydicom
from pydicom.data import get_testdata_file
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, generate_uid
from fastapi.testclient import TestClient
from PIL import Image
from app import dicom, main

ok = True
def check(name, cond, detail=""):
    global ok; ok &= bool(cond); print(("PASS " if cond else "FAIL ") + name + (f"  ({detail})" if detail and not cond else ""))

def synthetic(photometric):
    meta = FileMetaDataset(); meta.TransferSyntaxUID = ExplicitVRLittleEndian
    meta.MediaStorageSOPClassUID = "1.2.840.10008.5.1.4.1.1.1"; meta.MediaStorageSOPInstanceUID = generate_uid()
    ds = Dataset(); ds.file_meta = meta
    ds.PatientName = "SECRET^PATIENT"; ds.PatientID = "123456"
    ds.Rows, ds.Columns = 64, 64; ds.SamplesPerPixel = 1; ds.PhotometricInterpretation = photometric
    ds.BitsAllocated = ds.BitsStored = 16; ds.HighBit = 15; ds.PixelRepresentation = 0
    a = np.zeros((64, 64), np.uint16); a[:, 32:] = 4000                    # left low values, right high values
    ds.PixelData = a.tobytes()
    buf = io.BytesIO(); pydicom.dcmwrite(buf, ds, enforce_file_format=True); return buf.getvalue()

for name in ("CT_small.dcm", "MR_small.dcm"):
    data = open(get_testdata_file(name), "rb").read()
    img = dicom.to_image(data)
    px = np.asarray(img)
    check(f"{name}: detected and converted", dicom.is_dicom(data) and img.mode == "RGB" and px.std() > 10, (img.size, px.std()))

m2 = np.asarray(dicom.to_image(synthetic("MONOCHROME2")).convert("L"))
m1 = np.asarray(dicom.to_image(synthetic("MONOCHROME1")).convert("L"))
check("MONOCHROME2: high values are bright", m2[:, 48].mean() > m2[:, 16].mean())
check("MONOCHROME1: high values are dark (inverted)", m1[:, 48].mean() < m1[:, 16].mean())

c = TestClient(main.app)
r = c.post("/api/ask", files={"image": ("scan.dcm", open(get_testdata_file("CT_small.dcm"), "rb").read(), "application/dicom")},
           data={"question": "What is visible?"})
check("API accepts a .dcm upload (mock mode)", r.status_code == 200, r.text[:200])
uri_holder = {}
orig = main.llm.look
main.llm.look = lambda uri, q: (uri_holder.setdefault("uri", uri), orig(uri, q))[1]
main._cache.clear()
c.post("/api/ask", files={"image": ("p.dcm", synthetic("MONOCHROME2"), "application/dicom")}, data={"question": "What is visible?"})
sent = uri_holder.get("uri", "")
check("only a JPEG is sent on (no DICOM header / patient name)", sent.startswith("data:image/jpeg;base64,") and b"SECRET" not in sent.encode())
r = c.post("/api/ask", files={"image": ("bad.dcm", b"\0" * 128 + b"DICM" + b"garbage" * 10, "application/dicom")}, data={"question": "What is visible?"})
check("broken DICOM -> 400 with a helpful message", r.status_code == 400 and "DICOM" in r.json()["error"], r.text)
print("\nALL PASS" if ok else "\nSOME TESTS FAILED"); sys.exit(0 if ok else 1)
