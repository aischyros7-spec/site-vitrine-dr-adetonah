#!/usr/bin/env python3
"""Génère les artboards .dc.html à partir des gabarits .tpl.html.

Injecte :
  <!--@FONTS@-->      les @font-face (Fredoka + Nunito Sans embarquées en base64)
  <!--@LOGO@-->       le logo Nouvelle Pharmacie Sainte Victoire redessiné en SVG
  <!--@MARK_WHITE@--> la marque seule (croix + feuille) en blanc, pour fonds foncés
"""
import base64, math, pathlib, re

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
FONTDIR = HERE / "fonts"

# ---------------------------------------------------------------- palette ---
VERT       = "#1A9E21"   # vert de marque
VERT_MOYEN = "#158A1B"
VERT_FONCE = "#0D6B14"
ORANGE     = "#F26A15"

# ------------------------------------------------------------------ polices --
def font_face(family, path, wmin, wmax):
    b64 = base64.b64encode(path.read_bytes()).decode()
    return (
        "@font-face{font-family:'%s';font-style:normal;"
        "font-weight:%d %d;font-display:block;"
        "src:url(data:font/woff2;base64,%s) format('woff2');}"
        % (family, wmin, wmax, b64)
    )

def fonts_css():
    return "\n".join([
        font_face("Fredoka", FONTDIR / "fredoka.sub.woff2", 300, 700),
        font_face("Nunito Sans", FONTDIR / "nunitosans.sub.woff2", 200, 1000),
    ])

# -------------------------------------------------------- géométrie feuille --
def leaf(bx, by, tx, ty, half_w, fill=VERT, vein=True, vein_fill="#FFFFFF",
         vein_op=".92", stroke=None, stroke_w=2.6):
    """Feuille : base en (bx,by), pointe en (tx,ty), demi-largeur half_w."""
    L = math.hypot(tx - bx, ty - by)
    ang = math.degrees(math.atan2(ty - by, tx - bx))
    W = half_w
    body = (f"M0,0 C{0.20*L:.1f},{-1.10*W:.1f} {0.60*L:.1f},{-1.00*W:.1f} {L:.1f},0 "
            f"C{0.64*L:.1f},{0.62*W:.1f} {0.26*L:.1f},{0.52*W:.1f} 0,0 Z")
    edge = ("" if not stroke
            else f' stroke="{stroke}" stroke-width="{stroke_w}" stroke-linejoin="round"')
    out = [f'<g transform="translate({bx:.1f},{by:.1f}) rotate({ang:.2f})">',
           f'<path d="{body}" fill="{fill}"{edge}/>']
    if vein:
        v = (f"M{0.06*L:.1f},{0.045*W:.1f} "
             f"C{0.32*L:.1f},{0.46*W:.1f} {0.66*L:.1f},{0.48*W:.1f} {0.95*L:.1f},{0.03*W:.1f} "
             f"C{0.68*L:.1f},{0.30*W:.1f} {0.34*L:.1f},{0.25*W:.1f} {0.06*L:.1f},{0.045*W:.1f} Z")
        out.append(f'<path d="{v}" fill="{vein_fill}" opacity="{vein_op}"/>')
    out.append("</g>")
    return "".join(out)

# ---------------------------------------------------- géométrie croix ronde --
def _round_poly(pts, radii):
    """Polygone à coins arrondis ; radii = rayon par sommet."""
    n = len(pts)
    d = []
    for i in range(n):
        p0, p1, p2 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n]
        r = radii[i]
        v1 = (p0[0] - p1[0], p0[1] - p1[1])
        v2 = (p2[0] - p1[0], p2[1] - p1[1])
        l1 = math.hypot(*v1) or 1.0
        l2 = math.hypot(*v2) or 1.0
        a = (p1[0] + v1[0] / l1 * r, p1[1] + v1[1] / l1 * r)
        b = (p1[0] + v2[0] / l2 * r, p1[1] + v2[1] / l2 * r)
        cross = v1[0] * v2[1] - v1[1] * v2[0]
        sweep = 0 if cross > 0 else 1
        d.append(("L %.2f,%.2f" % a) if i else ("M %.2f,%.2f" % a))
        d.append("A %.2f,%.2f 0 0 %d %.2f,%.2f" % (r, r, sweep, b[0], b[1]))
    d.append("Z")
    return " ".join(d)

def cross(cx, cy, size, thick, fill, r_out=11.0, r_in=7.0):
    h, t = size / 2.0, thick / 2.0
    pts = [(-t, -h), (t, -h), (t, -t), (h, -t), (h, t), (t, t),
           (t, h), (-t, h), (-t, t), (-h, t), (-h, -t), (-t, -t)]
    radii = [r_out, r_out, r_in, r_out, r_out, r_in,
             r_out, r_out, r_in, r_out, r_out, r_in]
    pts = [(x + cx, y + cy) for x, y in pts]
    return f'<path d="{_round_poly(pts, radii)}" fill="{fill}"/>'

# -------------------------------------------------------------------- logo --
CX, CY, R = 206.0, 193.0, 126.0     # cercle de marque
RING_W = 13.0

def _cross_block(green=VERT, orange=ORANGE, leaf_fill=VERT, leaf_vein="#FFFFFF",
                 leaf_edge="#FFFFFF"):
    parts = [
        cross(196, 126, 108, 40, orange),         # croix orange, décalée haut-gauche
        cross(230, 156, 108, 40, green),          # croix verte, décalée bas-droite
        # feuille centrale, posée sur l'intersection des deux croix
        leaf(236, 200, 216, 104, 17, fill=leaf_fill, vein_fill=leaf_vein),
    ]
    return "".join(parts)

def logo_svg(ident="lg"):
    body = [
        f'<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" '
        f'stroke="{VERT}" stroke-width="{RING_W}"/>',
        _cross_block(),
        # grande feuille de gauche (traverse l'anneau)
        leaf(95, 215, 136, 62, 30),
        # petite feuille en bas à gauche
        leaf(86, 196, 20, 146, 20),
        # grande feuille de droite
        leaf(228, 220, 352, 142, 32),
    ]
    txt = f'''
<g font-family="Nunito Sans, Trebuchet MS, sans-serif" font-weight="800">
  <text x="96" y="266" font-size="27" fill="{ORANGE}"
        textLength="32" lengthAdjust="spacingAndGlyphs">Ste</text>
  <text x="120" y="288" font-size="102" fill="{ORANGE}"
        textLength="62" lengthAdjust="spacingAndGlyphs">V</text>
  <text x="184" y="288" font-size="47" fill="{ORANGE}"
        textLength="112" lengthAdjust="spacingAndGlyphs">ictoire</text>
  <text x="213" y="230" font-size="21" fill="{VERT}" font-weight="600"
        textLength="70" lengthAdjust="spacingAndGlyphs">Nouvelle</text>
  <text x="213" y="253" font-size="21" fill="{VERT}" font-weight="600"
        textLength="82" lengthAdjust="spacingAndGlyphs">Pharmacie</text>
</g>'''
    return ('<svg viewBox="8 52 362 284" xmlns="http://www.w3.org/2000/svg" '
            'role="img" aria-label="Nouvelle Pharmacie Sainte Victoire" '
            'style="width:100%;height:auto;display:block">'
            + "".join(body) + txt + "</svg>")

def mark_white(fill="#FFFFFF", ident="a"):
    """Croix + feuille seules : lisible en petit, sur fond foncé comme clair.

    La feuille est évidée par un masque : la marque fonctionne donc sur
    n'importe quel fond, sans dépendre de sa couleur.
    """
    mid = f"npsv-mk-{ident}"
    box = 'x="157" y="85" width="112" height="112"'
    return (
        '<svg viewBox="157 85 112 112" xmlns="http://www.w3.org/2000/svg" '
        'aria-hidden="true" style="width:100%;height:auto;display:block">'
        f'<defs><mask id="{mid}" maskUnits="userSpaceOnUse" {box}>'
        + cross(213, 141, 108, 40, "#FFFFFF")
        + leaf(233, 187, 214, 96, 11, fill="#000000", vein=False,
               stroke="#000000", stroke_w=3.4)
        + '</mask></defs>'
        f'<rect {box} fill="{fill}" mask="url(#{mid})"/></svg>')


# --------------------------------------------------------- fournitures -----
CRAYON = """<g transform="translate({x},{y}) rotate({rot})">
  <path d="M0,36 L16,0 L32,36 Z" fill="#F6DEC0"/>
  <path d="M8.5,17 L16,0 L23.5,17 Z" fill="#37332C"/>
  <rect x="0" y="34" width="32" height="128" fill="{col}"/>
  <rect x="0" y="150" width="32" height="14" fill="{band}"/>
  <rect x="0" y="162" width="32" height="14" fill="#CBB79A"/>
  <path d="M0,172 h32 v9 a11,11 0 0 1 -11,11 h-10 a11,11 0 0 1 -11,-11 Z"
        fill="#E8541C"/>
</g>"""


def supplies_svg():
    """Cartable, cahier, crayons, pomme : aplats vectoriels, palette de marque."""
    return f"""<svg viewBox="0 0 668 252" xmlns="http://www.w3.org/2000/svg"
     role="img" aria-label="Fournitures de rentrée"
     style="width:100%;height:auto;display:block;overflow:visible">
  <g transform="translate(26,44)">
    <path d="M36,48 C36,15 56,4 74,4 C92,4 112,15 112,48" fill="none"
          stroke="{VERT_FONCE}" stroke-width="14" stroke-linecap="round"/>
    <rect x="2" y="42" width="144" height="146" rx="31" fill="{VERT}"/>
    <path d="M2,74 C2,56 17,42 35,42 H113 C131,42 146,56 146,74 V101 H2 Z"
          fill="#12841A"/>
    <rect x="62" y="90" width="24" height="24" rx="7" fill="{ORANGE}"/>
    <rect x="32" y="130" width="84" height="44" rx="14" fill="#FFFCF4"/>
    <rect x="54" y="148" width="40" height="8" rx="4" fill="{VERT}"/>
  </g>

  <g transform="translate(198,82) rotate(-7)">
    <rect x="16" y="6" width="116" height="148" rx="9" fill="#FBEEDA"/>
    <rect x="7" y="0" width="116" height="148" rx="9" fill="{ORANGE}"/>
    <rect x="29" y="32" width="72" height="50" rx="8" fill="#FFFCF4"/>
    <rect x="41" y="48" width="48" height="7" rx="3.5" fill="#F7C49C"/>
    <rect x="41" y="62" width="30" height="7" rx="3.5" fill="#F7C49C"/>
    <g stroke="{VERT_FONCE}" stroke-width="7" stroke-linecap="round" fill="none">
      <path d="M13,16 C1,16 1,29 13,29"/><path d="M13,45 C1,45 1,58 13,58"/>
      <path d="M13,74 C1,74 1,87 13,87"/><path d="M13,103 C1,103 1,116 13,116"/>
      <path d="M13,132 C1,132 1,145 13,145"/>
    </g>
  </g>

  {CRAYON.format(x=382, y=36, rot=-10, col=VERT, band="#16901C")}
  {CRAYON.format(x=450, y=46, rot=11, col=ORANGE, band="#D9550D")}

  <g transform="translate(520,98)">
    <path d="M66,32 C55,15 27,13 15,36 C2,61 13,105 33,123 C46,135 57,127 66,127
             C75,127 86,135 99,123 C119,105 130,61 117,36 C105,13 77,15 66,32 Z"
          fill="{ORANGE}"/>
    <path d="M66,32 C66,17 71,7 83,1" fill="none" stroke="{VERT_FONCE}"
          stroke-width="8" stroke-linecap="round"/>
    {leaf(70, 27, 122, 4, 15, fill=VERT)}
    <ellipse cx="38" cy="56" rx="10" ry="18" fill="#FFFFFF" opacity=".30"
             transform="rotate(-24 38 56)"/>
  </g>
</svg>"""


# ------------------------------------------------------------------- build --
LEAF_RE = re.compile(r"<!--@LEAF:([^@]*)@-->")

def _expand_leaves(src):
    """<!--@LEAF:bx,by,tx,ty,demi-largeur,couleur[,veine]@--> -> une feuille SVG."""
    def sub(m):
        a = [x.strip() for x in m.group(1).split(",")]
        bx, by, tx, ty, w = (float(v) for v in a[:5])
        fill = a[5] if len(a) > 5 else VERT
        vein = len(a) > 6 and a[6] == "veine"
        return leaf(bx, by, tx, ty, w, fill=fill, vein=vein)
    return LEAF_RE.sub(sub, src)


def main():
    marks = iter(range(1, 99))
    subs = {
        "<!--@FONTS@-->": fonts_css(),
        "<!--@LOGO@-->": logo_svg(),
        "<!--@FOURNITURES@-->": supplies_svg(),
    }
    for tpl in sorted(HERE.glob("*.tpl.html")):
        src = tpl.read_text(encoding="utf-8")
        for k, v in subs.items():
            src = src.replace(k, v)
        while "<!--@MARK_GREEN@-->" in src:
            src = src.replace("<!--@MARK_GREEN@-->",
                              mark_white(fill=VERT_FONCE,
                                         ident=f"g{tpl.name[:3]}{next(marks)}"), 1)
        while "<!--@MARK_WHITE@-->" in src:          # id de masque unique par marque
            src = src.replace("<!--@MARK_WHITE@-->",
                              mark_white(ident=f"{tpl.name[:3]}{next(marks)}"), 1)
        src = _expand_leaves(src)
        left = re.findall(r"<!--@[A-Z_]+@-->", src)
        if left:
            raise SystemExit(f"{tpl.name}: marqueur non remplacé {left}")
        dest = OUT / tpl.name.replace(".tpl.html", ".dc.html")
        dest.write_text(src, encoding="utf-8")
        print(f"  {dest.name:24s} {len(src)/1024:7.1f} Ko")

if __name__ == "__main__":
    print("génération des artboards :")
    main()
