/* =================================================================
   Dr Fahrid Honorat ADETONAH — « L'officine de nuit »
   -----------------------------------------------------------------
   Aucune dépendance. Modules :
     1. Barre de navigation collante
     2. Menu mobile
     3. Lien actif au défilement
     4. Horloge de Cotonou (l'officine est-elle ouverte ? toujours)
     5. Enseigne à matrice de LED (canvas)
     6. Bandeau défilant
     7. Meuble d'officine (tiroirs)
     8. Formulaire de contact
     9. Année courante
   ================================================================= */

(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ===============================================================
     1. BARRE DE NAVIGATION COLLANTE
     =============================================================== */
  (function () {
    var bar = $('#topbar');
    if (!bar) return;
    var attente = false;

    function maj() {
      bar.classList.toggle('is-stuck', window.scrollY > 10);
      attente = false;
    }
    window.addEventListener('scroll', function () {
      if (!attente) { attente = true; requestAnimationFrame(maj); }
    }, { passive: true });
    maj();
  })();


  /* ===============================================================
     2. MENU MOBILE
     =============================================================== */
  (function () {
    var btn  = $('#menuBtn');
    var menu = $('#menu');
    if (!btn || !menu) return;

    function ouvrir(etat) {
      btn.setAttribute('aria-expanded', String(etat));
      menu.classList.toggle('is-open', etat);
      document.body.classList.toggle('is-locked', etat);
    }
    function estOuvert() { return btn.getAttribute('aria-expanded') === 'true'; }

    btn.addEventListener('click', function () { ouvrir(!estOuvert()); });

    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { ouvrir(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && estOuvert()) { ouvrir(false); btn.focus(); }
    });

    document.addEventListener('click', function (e) {
      if (estOuvert() && !menu.contains(e.target) && !btn.contains(e.target)) ouvrir(false);
    });

    /* Au-delà de 900px le menu redevient une barre : on lève le verrou */
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
      if (e.matches) ouvrir(false);
    });
  })();


  /* ===============================================================
     3. LIEN ACTIF AU DÉFILEMENT
     =============================================================== */
  (function () {
    var liens = $$('.menu__link');
    if (!liens.length || !('IntersectionObserver' in window)) return;

    var table = {}, sections = [];
    liens.forEach(function (l) {
      var href = l.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;
      var s = document.querySelector(href);
      if (!s) return;
      table[s.id] = l;
      sections.push(s);
    });

    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        liens.forEach(function (l) { l.classList.remove('is-here'); });
        if (table[e.target.id]) table[e.target.id].classList.add('is-here');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { obs.observe(s); });
  })();


  /* ===============================================================
     4. HORLOGE DE COTONOU
     Le Bénin est à UTC+1 toute l'année, sans changement d'heure.
     On lit le fuseau réel plutôt que de décaler l'heure du visiteur :
     l'information doit être juste depuis Paris comme depuis Montréal.
     =============================================================== */
  (function () {
    var cibles = $$('#clockNav, #clockHero, #clockContact');
    if (!cibles.length) return;

    var format;
    try {
      format = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Africa/Porto-Novo',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (err) {
      /* Repli si le fuseau n'est pas connu du navigateur : UTC+1 à la main */
      format = null;
    }

    function heure() {
      if (format) return format.format(new Date()).replace(':', 'h');
      var d = new Date(Date.now() + 3600000);
      return ('0' + d.getUTCHours()).slice(-2) + 'h' + ('0' + d.getUTCMinutes()).slice(-2);
    }

    function maj() {
      var h = heure();
      cibles.forEach(function (t) {
        t.textContent = h;
        t.setAttribute('datetime', h.replace('h', ':'));
      });
    }

    maj();
    setInterval(maj, 20000);
  })();


  /* ===============================================================
     5. L'ENSEIGNE
     -----------------------------------------------------------------
     Une croix de pharmacie en matrice de LED, dessinée sur canvas.
     Trois états, comme les enseignes réelles :
       « allumage »  les diodes s'allument une à une au chargement
       « veille »    la croix respire doucement
       « message »   un texte traverse la barre horizontale
     Le texte est transformé en points par échantillonnage d'un canvas
     hors écran : pas de fonte matricielle à embarquer, et les accents
     fonctionnent.
     =============================================================== */
  (function () {
    var cv = $('#signCanvas');
    if (!cv || !cv.getContext) return;

    var ctx = cv.getContext('2d');

    var N       = 29;   /* côté de la matrice, en diodes */
    var BRAS    = 11;   /* largeur des branches de la croix */
    var HAUT_TXT = 9;   /* hauteur du texte, en diodes */

    var deb = Math.floor((N - BRAS) / 2);        /* 9  */
    var fin = deb + BRAS - 1;                    /* 19 */
    var txtHaut = deb + Math.floor((BRAS - HAUT_TXT) / 2); /* 10 */

    var MESSAGES = [
      'OUVERT 24H/24',
      'NPSV FIDJROSSÈ',
      '100 000+ ABONNÉS',
      'DR ADETONAH'
    ];

    /* --- Texte → colonnes de diodes --- */
    function colonnes(texte) {
      var c = document.createElement('canvas');
      var g = c.getContext('2d');
      var police = 'bold ' + HAUT_TXT + 'px sans-serif';

      g.font = police;
      var largeur = Math.ceil(g.measureText(texte).width) + 2;

      c.width = largeur;
      c.height = HAUT_TXT + 2;
      g.font = police;              /* le redimensionnement remet le contexte à zéro */
      g.textBaseline = 'top';
      g.fillStyle = '#fff';
      g.fillText(texte, 1, 0);

      var px = g.getImageData(0, 0, c.width, c.height).data;
      var cols = [];
      for (var x = 0; x < c.width; x++) {
        var col = [];
        for (var y = 0; y < HAUT_TXT; y++) {
          col.push(px[(y * c.width + x) * 4 + 3] > 90);
        }
        cols.push(col);
      }
      return cols;
    }

    var rendus = MESSAGES.map(colonnes);

    /* --- Seuils d'allumage, pour que la croix s'allume en désordre --- */
    var seuils = [];
    for (var r = 0; r < N; r++) {
      seuils[r] = [];
      for (var c2 = 0; c2 < N; c2++) seuils[r][c2] = Math.random();
    }

    function dansLaCroix(r, c) {
      return (c >= deb && c <= fin) || (r >= deb && r <= fin);
    }

    /* --- Dimensionnement, densité d'écran comprise --- */
    var taille = 0, pas = 0;
    function dimensionner() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var boite = cv.getBoundingClientRect();
      if (!boite.width) return;
      taille = boite.width;
      cv.width  = Math.round(taille * dpr);
      cv.height = Math.round(taille * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pas = taille / N;
    }
    dimensionner();
    window.addEventListener('resize', dimensionner);

    /* --- Machine à états --- */
    var ALLUMAGE = 1000;   /* ms */
    var VEILLE   = 2400;
    var VITESSE  = 24;     /* colonnes par seconde */

    var etat = calme ? 'veille' : 'allumage';
    var t0 = performance.now();
    var iMsg = 0;

    function eclat(r, c, ms) {
      /* Respiration : une onde très lente partant du centre */
      var dx = c - (N - 1) / 2, dy = r - (N - 1) / 2;
      var d = Math.sqrt(dx * dx + dy * dy);
      return 0.78 + 0.22 * Math.sin(ms / 900 - d / 3.4);
    }

    function dessiner(ms) {
      if (!pas) { dimensionner(); if (!pas) return; }

      var ecoule = ms - t0;
      ctx.clearRect(0, 0, taille, taille);

      /* Progression du message en cours */
      var cols = rendus[iMsg];
      var decalage = 0;
      if (etat === 'message') {
        decalage = N - (ecoule / 1000) * VITESSE;
        if (decalage < -cols.length) { etat = 'veille'; t0 = ms; }
      } else if (etat === 'allumage' && ecoule > ALLUMAGE) {
        etat = 'veille'; t0 = ms;
      } else if (etat === 'veille' && ecoule > VEILLE && !calme) {
        etat = 'message'; t0 = ms;
        iMsg = (iMsg + 1) % rendus.length;
      }

      var avance = Math.min(ecoule / ALLUMAGE, 1);
      var rayon = pas * 0.33;

      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (!dansLaCroix(r, c)) continue;

          var v;
          if (etat === 'allumage') {
            v = seuils[r][c] < avance ? eclat(r, c, ms) : 0;
          } else if (etat === 'message' && r >= txtHaut && r < txtHaut + HAUT_TXT) {
            /* Bande de texte : la diode suit le pixel correspondant */
            var idx = Math.floor(c - decalage);
            var colonne = cols[idx];
            v = (colonne && colonne[r - txtHaut]) ? 1 : 0;
          } else {
            v = etat === 'message' ? 0.34 : eclat(r, c, ms);
          }

          ctx.fillStyle = 'rgba(59, 224, 125, ' + (0.055 + 0.945 * Math.max(v, 0)) + ')';
          ctx.beginPath();
          ctx.arc((c + 0.5) * pas, (r + 0.5) * pas, rayon, 0, 6.2832);
          ctx.fill();
        }
      }
    }

    /* Boucle bridée à 30 images/s : l'effet est identique, la batterie tient */
    var visible = true;
    var dernier = 0;

    function boucle(ms) {
      if (visible && ms - dernier > 33) { dessiner(ms); dernier = ms; }
      requestAnimationFrame(boucle);
    }
    requestAnimationFrame(boucle);

    /* Hors de l'écran, on arrête de dessiner */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; })
        .observe(cv);
    }
  })();


  /* ===============================================================
     6. BANDEAU DÉFILANT
     La piste est dupliquée pour que la boucle soit sans couture.
     =============================================================== */
  (function () {
    var piste = $('#tickerTrack');
    if (!piste) return;
    piste.appendChild(piste.firstElementChild.cloneNode(true));
  })();


  /* ===============================================================
     7. LE MEUBLE D'OFFICINE
     Les tiroirs sont indépendants : on peut en ouvrir plusieurs.
     Le premier est ouvert au chargement, pour que la section montre
     son contenu sans qu'il faille cliquer.
     =============================================================== */
  (function () {
    var boutons = $$('.drawer__btn');
    if (!boutons.length) return;

    boutons.forEach(function (b, i) {
      var panneau = document.getElementById(b.getAttribute('aria-controls'));
      if (!panneau) return;

      function basculer(ouvert) {
        b.setAttribute('aria-expanded', String(ouvert));
        panneau.classList.toggle('is-open', ouvert);
      }

      b.addEventListener('click', function () {
        basculer(b.getAttribute('aria-expanded') !== 'true');
      });

      if (i === 0) basculer(true);
    });
  })();


  /* ===============================================================
     8. FORMULAIRE DE CONTACT
     -----------------------------------------------------------------
     Réglage dans index.html, sur la balise <form> :
       data-endpoint="https://formspree.io/f/VOTRE_ID"  → envoi direct
       data-endpoint=""                                 → repli mailto:
       data-mailto="adresse@domaine.com"                → adresse de repli
     =============================================================== */
  (function () {
    var form = $('#contactForm');
    if (!form) return;

    var etat   = $('#formStatus');
    var envoi  = $('#submitBtn');
    var url    = (form.dataset.endpoint || '').trim();
    var mail   = (form.dataset.mailto || '').trim();

    var regles = {
      name: function (v) {
        if (!v) return 'Merci d’indiquer votre nom.';
        if (v.length < 2) return 'Ce nom semble trop court.';
        return '';
      },
      email: function (v) {
        if (!v) return 'Merci d’indiquer votre email.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Cette adresse semble invalide.';
        return '';
      },
      phone: function (v) {
        if (!v) return '';
        if (!/^[+0-9\s().-]{6,20}$/.test(v)) return 'Ce numéro semble invalide.';
        return '';
      },
      message: function (v) {
        if (!v) return 'Merci d’écrire votre demande.';
        if (v.length < 10) return 'Quelques mots de plus m’aideraient à vous répondre.';
        return '';
      }
    };

    var champs = $$('input, textarea', form).filter(function (c) { return regles[c.name]; });

    function signaler(champ, message) {
      var zone = form.querySelector('[data-error-for="' + champ.name + '"]');
      champ.classList.toggle('is-bad', Boolean(message));
      champ.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (zone) zone.textContent = message;
    }

    function verifier(champ) {
      var erreur = regles[champ.name](champ.value.trim());
      signaler(champ, erreur);
      return !erreur;
    }

    /* Contrôle à la sortie du champ, puis en direct une fois signalé */
    champs.forEach(function (c) {
      c.addEventListener('blur', function () { verifier(c); });
      c.addEventListener('input', function () {
        if (c.classList.contains('is-bad')) verifier(c);
      });
    });

    function dire(texte, type) {
      if (!etat) return;
      etat.textContent = texte;
      etat.className = 'rx__status' + (type ? ' is-' + type : '');
    }

    function parMail(d) {
      var corps = [
        'Nom : ' + d.name,
        'Email : ' + d.email,
        'Téléphone : ' + (d.phone || 'non renseigné'),
        '', 'Demande :', d.message
      ].join('\n');

      window.location.href = 'mailto:' + mail +
        '?subject=' + encodeURIComponent('Demande de contact — ' + d.name) +
        '&body=' + encodeURIComponent(corps);

      dire('Votre messagerie s’ouvre avec le message prêt. Il ne reste qu’à l’envoyer.', 'ok');
    }

    function parReseau(d) {
      envoi.disabled = true;
      dire('Envoi en cours…', '');

      fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(d)
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset();
          champs.forEach(function (c) { signaler(c, ''); });
          dire('Message reçu. Je vous réponds sous 48 heures.', 'ok');
        })
        .catch(function () {
          dire('L’envoi a échoué. Réessayez, ou écrivez à ' + (mail || 'l’adresse ci-contre') + '.', 'ko');
        })
        .then(function () { envoi.disabled = false; });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Piège à robots : rempli, donc automatisé. On n'envoie rien. */
      var piege = form.querySelector('[name="_gotcha"]');
      if (piege && piege.value) { dire('Message reçu.', 'ok'); return; }

      var premier = null;
      champs.forEach(function (c) {
        if (!verifier(c) && !premier) premier = c;
      });
      if (premier) {
        dire('Merci de corriger les champs signalés.', 'ko');
        premier.focus();
        return;
      }

      /* form.elements[...] : évite toute collision avec les propriétés
         natives du formulaire (form.name, form.method…). */
      var el = form.elements;
      var donnees = {
        name:    el['name'].value.trim(),
        email:   el['email'].value.trim(),
        phone:   el['phone'].value.trim(),
        message: el['message'].value.trim()
      };

      if (url) parReseau(donnees);
      else if (mail) parMail(donnees);
      else dire('Le formulaire n’est pas encore configuré. Utilisez les coordonnées ci-contre.', 'ko');
    });
  })();


  /* ===============================================================
     9. ANNÉE COURANTE
     =============================================================== */
  (function () {
    var an = $('#year');
    if (an) an.textContent = String(new Date().getFullYear());
  })();

})();
