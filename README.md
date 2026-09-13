# Site vitrine — Dr Fahrid Honorat ADETONAH

Site vitrine one-page pour **Dr Fahrid Honorat ADETONAH**, Docteur en Pharmacie
à Cotonou (Bénin), pharmacien titulaire de la Nouvelle Pharmacie Sainte Victoire,
fondateur de StockAid Pro et créateur de contenu santé.

---

## Parti pris

**« L'officine de nuit ».** Le fait le plus singulier du métier de Dr ADETONAH est que
sa pharmacie ne ferme jamais, et l'objet le plus reconnaissable de son monde est la croix
verte à LED restée allumée sur Fidjrossè. Le site est donc éclairé comme une enseigne :
fond de nuit vert-noir, vert LED réservé aux signaux, ambre des lampadaires pour la chaleur.

L'élément central est une **vraie croix de pharmacie à matrice de diodes**, dessinée sur
canvas : elle s'allume au chargement, respire, puis fait défiler ses messages comme les
enseignes réelles. À côté, l'heure de Cotonou en direct. Ce n'est pas un ornement, c'est
la démonstration du 24h/24.

Les services ne sont pas quatre cartes en grille mais un **meuble d'officine** : quatre
tiroirs que le visiteur ouvre. Le formulaire est réglé comme une ordonnance, en lignes
plutôt qu'en boîtes.

Le site assume une **identité sombre unique**, sans variante claire. Pour l'inverser, voir
« Changer la palette » plus bas.

## Stack

HTML5 + CSS3 + JavaScript natif. **Aucun framework, aucune étape de build,
aucune dépendance npm.** Ouvrez `index.html` dans un navigateur et c'est tout.

Ce choix est délibéré : pour une page unique statique, React aurait ajouté
~40 ko de JavaScript et une chaîne de build sans bénéfice fonctionnel.
N'importe quel développeur peut reprendre ce code immédiatement.

## Arborescence

```
.
├── index.html              Page complète (HTML sémantique, SEO, Open Graph, JSON-LD)
├── css/
│   └── style.css           Styles — variables, composants, responsive (12 sections numérotées)
├── js/
│   └── main.js             Header sticky, menu mobile, scrollspy, animations, formulaire
└── assets/
    └── img/
        ├── favicon.svg     Monogramme (croix de pharmacie)
        ├── portrait.svg    PLACEHOLDER — à remplacer par une photo
        └── og-image.svg    PLACEHOLDER — image de partage social
```

---

## À personnaliser avant mise en ligne

Tous les emplacements concernés sont marqués `TODO` dans `index.html`.

| # | Quoi | Où |
|---|------|-----|
| 1 | **Photo du portrait** | Remplacer `assets/img/portrait.svg` par une photo (ratio 4:5, ~900×1125 px, JPG ou WebP). Le traitement duotone vert est appliqué en CSS et se lève au survol : une photo couleur ordinaire s'intègre directement |
| 2 | **Email** | `contact@exemple.com` — présent dans le bloc coordonnées et dans l'attribut `data-mailto` du formulaire |
| 3 | **Téléphone** | `+229 00 00 00 00` — dans le bloc coordonnées (texte **et** attribut `href="tel:"`) |
| 4 | **Instagram / LinkedIn** | URL génériques dans la section Réseaux sociaux et dans le pied de page |
| 5 | **URL du site** | Balises `canonical`, `og:url` et `og:image` dans le `<head>` |
| 6 | **Image de partage** | Exporter `assets/img/og-image.svg` en JPG 1200×630 et mettre à jour `og:image` |

Le compte TikTok `@dr_adetonah` est déjà renseigné.

Le fuseau de l'horloge (`Africa/Porto-Novo`, UTC+1) est dans `js/main.js`, module 4.

---

## Configurer le formulaire de contact

Le formulaire fonctionne **sans backend**, selon deux modes pilotés par des
attributs `data-` sur la balise `<form>` dans `index.html` :

```html
<form id="contactForm" data-endpoint="" data-mailto="contact@exemple.com">
```

- **`data-endpoint` vide** (état actuel) → le formulaire ouvre le logiciel de
  messagerie du visiteur avec un message pré-rempli (`mailto:`). Rien à configurer.
- **`data-endpoint` renseigné** → envoi AJAX réel, sans rechargement de page.

Pour activer l'envoi réel avec [Formspree](https://formspree.io) (offre gratuite) :

1. Créer un compte et un nouveau formulaire.
2. Copier l'URL fournie (de la forme `https://formspree.io/f/xxxxxxx`).
3. La coller dans `data-endpoint`.

Tout service acceptant un `POST` en JSON fonctionne de la même manière
(Formspree, Web3Forms, Getform, Basin…). `data-mailto` reste utile : il sert
d'adresse de repli affichée en cas d'échec d'envoi.

Un champ piège invisible (`_gotcha`) filtre les robots spammeurs.

---

## Changer la palette

Toutes les couleurs sont des variables CSS regroupées en haut de `css/style.css`
(section 01, « Jetons »). Rien n'est codé en dur ailleurs.

| Rôle | Variable | Hex |
|------|----------|-----|
| Fond de nuit | `--ink` | `#03120F` |
| Surface posée | `--ink-2` | `#07201B` |
| Vert enseigne (signaux) | `--led` | `#3BE07D` |
| Ambre lampadaire (chaleur) | `--sodium` | `#E9A13B` |
| Texte | `--bone` | `#EFEAE0` |
| Texte secondaire | `--sage` | `#A3B8AF` |

**Typographie** : Bodoni Moda pour les titres — le Didone des étiquettes d'apothicaire —,
Archivo pour le texte courant, et la mono du système pour la voix « données » (aucune
requête réseau supplémentaire). Servies par Google Fonts avec `preconnect` et `display=swap`.

Pour passer le site en clair, il faut inverser les jetons de façon cohérente : `--ink`
devient un blanc cassé, `--bone` une encre sombre, et `--led` doit être assombri pour
rester lisible sur fond clair (`#0F8F49` environ). Le grain et la lueur de `body::before`
et `body::after` sont à retirer.

---

## Développement local

Aucune installation nécessaire. Double-cliquer sur `index.html` suffit.

Pour un serveur local (recommandé, évite les restrictions CORS) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mise en ligne

Site 100 % statique : déposer le dossier tel quel sur **Netlify**, **Vercel**,
**GitHub Pages**, **Cloudflare Pages** ou n'importe quel hébergement FTP
classique. Aucune configuration serveur requise.

---

## Choix techniques

- **Mobile first** — le CSS de base cible le mobile ; les media queries
  (`min-width` : 640 / 900 / 1200 px) n'ajoutent que ce qui concerne les
  écrans plus larges. La majorité du trafic venant de TikTok, c'est le mobile
  qui est optimisé en priorité.
- **Tailles fluides** — `clamp()` sur les titres et les espacements : la mise en
  page respire à toutes les tailles d'écran sans multiplier les breakpoints.
- **L'enseigne** — canvas, matrice de 29×29 diodes, boucle bridée à 30 images/s et
  suspendue dès que la croix quitte l'écran. Le texte défilant n'embarque aucune fonte
  matricielle : il est échantillonné depuis un canvas hors écran, ce qui fait fonctionner
  les accents. `prefers-reduced-motion` laisse la croix allumée mais arrête le défilement.
- **Tiroirs** — ouverture par `grid-template-rows: 0fr → 1fr`, sans hauteur calculée en
  JavaScript. Le premier est ouvert au chargement pour que la section montre son contenu.
- **Icônes SVG inline** — aucune bibliothèque d'icônes, donc aucune requête
  réseau supplémentaire.
- **Accessibilité** — HTML sémantique, lien d'évitement, `aria-expanded` sur le
  menu, `aria-live` sur le retour du formulaire, focus clavier visible,
  contrastes conformes AA.
- **SEO** — balises meta complètes, Open Graph, Twitter Card et données
  structurées JSON-LD (`Person` + `Pharmacy`).
- **Poids** — moins de 60 ko hors police et image.
