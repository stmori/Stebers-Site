"""Smoke-test a running Med-VQA API. usage: python smoke_api.py <base_url> <demo_images_dir> <out_json> [--mock]"""
import json, sys, time
import httpx

base, demo, out = sys.argv[1], sys.argv[2], sys.argv[3]
mock = "--mock" in sys.argv
c = httpx.Client(base_url=base, timeout=120)
res = {"health": c.get("/api/health").json()}
print("health:", res["health"])

def ask(fname, q, **kw):
    with open(f"{demo}/{fname}", "rb") as f:
        t = time.time()
        r = c.post("/api/ask", files={"image": (fname, f, "image/png")}, data={"question": q}, **kw)
    return r.status_code, r.json(), round(time.time() - t, 2)

man = {m["file"]: m for m in json.load(open(f"{demo}/manifest.json"))}
cases = [("openi_cxr_00.png", "What abnormality is visible in this chest X-ray, and what could cause it?"),
         ("openi_cxr_02.png", "Is the heart enlarged? What does that mean?"),
         ("vqarad_01.png", "Is there evidence of an aortic aneurysm?"),
         ("vqarad_09.png", "What kind of scan is this and is anything abnormal?"),
         ("openi_cxr_06.png", "Does this chest X-ray look normal?")]
if mock:
    cases = cases[:2]
res["cases"] = []
for fname, q in cases:
    code, body, dt = ask(fname, q)
    gt = man[fname].get("qa") or man[fname].get("impression")
    res["cases"].append(dict(file=fname, question=q, ground_truth=gt, status=code, seconds=dt, response=body))
    print(f"\n== {fname} [{code}] {dt}s  GT: {gt}")
    if code == 200:
        print("findings:", json.dumps(body["findings"]))
        print("answer:", body["answer"][:700])
        print("cited:", [(x["n"], x["title"][:50]) for x in body["citations"] if x["cited"]], "timings:", body["timings_ms"])
    else:
        print(body)

# negative tests
code, body = c.post("/api/ask", files={"image": ("x.txt", b"not an image", "text/plain")}, data={"question": "what is this?"}).status_code, None
print("\nnon-image upload ->", code)
r = c.post("/api/ask", files={"image": ("a.png", open(f"{demo}/vqarad_01.png", "rb"), "image/png")}, data={"question": "x"})
print("too-short question ->", r.status_code, r.json())
res["negatives"] = {"non_image": code, "short_question": r.status_code}
if mock:  # rate limit: default 6/min per IP
    codes = []
    for i in range(8):
        codes.append(c.post("/api/ask", files={"image": ("a.png", open(f"{demo}/vqarad_01.png", "rb"), "image/png")},
                            data={"question": "Is this normal?"}, headers={"x-forwarded-for": "9.9.9.9"}).status_code)
    print("rate limit sequence (same IP, 8 calls):", codes)
    res["negatives"]["rate_limit_codes"] = codes
json.dump(res, open(out, "w"), indent=1)
