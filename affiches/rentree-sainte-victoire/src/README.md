# Affiche de rentrée — Nouvelle Pharmacie Sainte Victoire

Trois planches, publiées comme un canvas de design unique :

| Fichier              | Format      | Usage                        |
|----------------------|-------------|------------------------------|
| `Main.dc.html`       | A4 portrait | affiche à imprimer (vitrine) |
| `Carre.dc.html`      | 1080 × 1080 | Instagram / Facebook         |
| `DirectionB.dc.html` | A4 portrait | variante « bloc vert »       |

## Régénérer

Les `.dc.html` sont générés depuis `src/*.tpl.html` :

```bash
cd src && python3 build.py          # écrit les .dc.html à la racine
python3 preview.py Main.dc.html     # aperçu PNG (nécessite Chromium + Pillow)
```

`build.py` remplace ces marqueurs dans les gabarits :

- `<!--@FONTS@-->` — Fredoka + Nunito Sans, sous-ensemblées et embarquées en
  base64 (`src/fonts/`). Embarquées et non liées : c'est ce qui garantit une
  typographie correcte à l'export PDF/PNG.
- `<!--@LOGO@-->` — le logo redessiné en vectoriel.
- `<!--@MARK_WHITE@-->` / `<!--@MARK_GREEN@-->` — croix + feuille seules.
- `<!--@FOURNITURES@-->` — l'illustration des fournitures scolaires.
- `<!--@LEAF:bx,by,tx,ty,demi-largeur,couleur@-->` — une feuille décorative.

## Points d'attention

- Le logo est une **reconstitution vectorielle** d'après l'image transmise,
  pas le fichier d'origine. Pour la version exacte, remplacer `logo_svg()`
  dans `build.py` par le fichier fourni par la pharmacie.
- Les mentions entre crochets (`[ADRESSE]`, `[TÉLÉPHONE]`, `[HORAIRES]`)
  sont des emplacements à compléter.
