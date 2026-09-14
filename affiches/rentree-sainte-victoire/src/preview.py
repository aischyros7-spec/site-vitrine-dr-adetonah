#!/usr/bin/env python3
"""Prévisualise les artboards hors canvas (ils sont entièrement statiques)."""
import pathlib, re, subprocess, sys
from PIL import Image
HERE = pathlib.Path(__file__).resolve().parent
SHOT = pathlib.Path("/tmp/claude-0/-home-user-site-vitrine-dr-adetonah/"
                    "3b99c0ac-d8e4-5599-9b5d-d5d0112c6b17/scratchpad")

def to_plain(dc: str) -> str:
    dc = re.sub(r'<script src="\./support\.js"></script>', "", dc)
    dc = re.sub(r"<script data-dc-script.*?</script>", "", dc, flags=re.S)
    dc = dc.replace("<x-dc>", "").replace("</x-dc>", "")
    dc = dc.replace("<helmet>", "").replace("</helmet>", "")
    return dc

def main(names):
    for n in names:
        src = (HERE.parent / n).read_text(encoding="utf-8")
        w, h = re.search(r'"\$preview":\{"width":(\d+),"height":(\d+)\}', src).groups()
        tmp = SHOT / f"prev-{n.replace('.dc.html','')}.html"
        tmp.write_text(to_plain(src), encoding="utf-8")
        out = SHOT / f"prev-{n.replace('.dc.html','')}.png"
        W, H = int(w), int(h)
        subprocess.run(["/opt/pw-browsers/chromium", "--headless", "--no-sandbox",
                        "--disable-gpu", "--hide-scrollbars",
                        f"--window-size={W},{H + 160}", f"--screenshot={out}",
                        "--virtual-time-budget=4000", f"file://{tmp}"],
                       capture_output=True)
        Image.open(out).convert("RGB").crop((0, 0, W, H)).save(out)
        print(f"  {out}  ({W}x{H})")

if __name__ == "__main__":
    main(sys.argv[1:])
