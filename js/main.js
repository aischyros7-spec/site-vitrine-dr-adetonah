/* =================================================================
   Dr Fahrid Honorat ADETONAH — Script principal
   -----------------------------------------------------------------
   Aucune dépendance externe. Tout est en API navigateur native.
   Modules :
     1. Header sticky (ombre au défilement)
     2. Menu mobile (burger)
     3. Navigation active (scrollspy)
     4. Animations d'apparition au scroll
     5. Formulaire de contact (validation + Formspree ou mailto)
     6. Année courante dans le pied de page
   ================================================================= */

(function () {
  'use strict';

  /* Raccourcis de sélection */
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* L'utilisateur a-t-il demandé à réduire les animations ? */
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ===============================================================
     1. HEADER STICKY
     Ajoute la classe .is-scrolled dès que la page défile un peu.
     Le calcul est délégué à requestAnimationFrame pour rester fluide.
     =============================================================== */
  (function initStickyHeader() {
    var header = $('#header');
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  })();


  /* ===============================================================
     2. MENU MOBILE
     Le bouton burger ouvre/ferme le panneau de navigation.
     aria-expanded pilote à la fois le style (CSS) et l'accessibilité.
     =============================================================== */
  (function initMobileNav() {
    var toggle = $('#navToggle');
    var menu   = $('#navMenu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    /* Fermeture après un clic sur un lien du menu */
    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });

    /* Fermeture à la touche Échap, avec retour du focus sur le bouton */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Fermeture si l'on clique en dehors du menu */
    document.addEventListener('click', function (e) {
      if (isOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) {
        setOpen(false);
      }
    });

    /* Le menu redevient une barre horizontale au-delà de 900px :
       on nettoie l'état mobile pour éviter un scroll bloqué. */
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
      if (e.matches) setOpen(false);
    });
  })();


  /* ===============================================================
     3. NAVIGATION ACTIVE (scrollspy)
     Surligne le lien correspondant à la section affichée à l'écran.
     =============================================================== */
  (function initScrollSpy() {
    var links = $$('.nav__link');
    if (!links.length || !('IntersectionObserver' in window)) return;

    /* Associe chaque section à son lien de navigation */
    var map = {};
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href');
      if (!id || id.charAt(0) !== '#') return;
      var section = document.querySelector(id);
      if (!section) return;
      map[section.id] = link;
      sections.push(section);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        var active = map[entry.target.id];
        if (active) active.classList.add('is-active');
      });
    }, {
      /* La section est considérée active quand elle occupe la bande
         centrale de l'écran (sous le header, au-dessus du bas de page). */
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(function (s) { observer.observe(s); });
  })();


  /* ===============================================================
     4. ANIMATIONS D'APPARITION AU SCROLL
     Chaque élément .reveal reçoit .is-visible lorsqu'il entre dans
     le champ de vision. On cesse ensuite de l'observer (animation
     jouée une seule fois, meilleure performance).
     =============================================================== */
  (function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;

    /* Repli : sans IntersectionObserver ou en mode animations réduites,
       tout est affiché immédiatement. */
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    items.forEach(function (el) { observer.observe(el); });
  })();


  /* ===============================================================
     5. FORMULAIRE DE CONTACT
     -----------------------------------------------------------------
     CONFIGURATION (dans index.html, sur la balise <form>) :
       data-endpoint="https://formspree.io/f/VOTRE_ID"  → envoi AJAX
       data-endpoint=""                                 → repli mailto:
       data-mailto="adresse@domaine.com"                → adresse du repli
     Aucun backend n'est nécessaire dans les deux cas.
     =============================================================== */
  (function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;

    var status   = $('#formStatus');
    var submit   = $('#submitBtn');
    var endpoint = (form.dataset.endpoint || '').trim();
    var mailto   = (form.dataset.mailto || '').trim();

    /* --- Règles de validation, champ par champ --- */
    var rules = {
      name: function (v) {
        if (!v) return 'Merci d’indiquer votre nom.';
        if (v.length < 2) return 'Le nom semble trop court.';
        return '';
      },
      email: function (v) {
        if (!v) return 'Merci d’indiquer votre email.';
        /* Contrôle volontairement simple : le serveur mail reste juge */
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Cette adresse email semble invalide.';
        return '';
      },
      phone: function (v) {
        if (!v) return ''; /* champ facultatif */
        if (!/^[+0-9\s().-]{6,20}$/.test(v)) return 'Ce numéro semble invalide.';
        return '';
      },
      message: function (v) {
        if (!v) return 'Merci d’écrire votre message.';
        if (v.length < 10) return 'Votre message est un peu court (10 caractères minimum).';
        return '';
      }
    };

    /* Affiche ou efface le message d'erreur d'un champ */
    function setFieldError(field, message) {
      var holder = form.querySelector('[data-error-for="' + field.name + '"]');
      field.classList.toggle('has-error', Boolean(message));
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (holder) holder.textContent = message;
    }

    function validateField(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var error = rule(field.value.trim());
      setFieldError(field, error);
      return !error;
    }

    /* Validation en direct, mais seulement après une première erreur :
       on n'agresse pas l'utilisateur pendant qu'il tape. */
    $$('.field__input', form).forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.classList.contains('has-error')) validateField(field);
      });
    });

    function setStatus(message, type) {
      if (!status) return;
      status.textContent = message;
      status.className = 'form__status' + (type ? ' is-' + type : '');
    }

    /* --- Repli sans service externe : ouverture du client mail --- */
    function sendByMailto(data) {
      var subject = 'Demande de contact — ' + data.name;
      var body = [
        'Nom : ' + data.name,
        'Email : ' + data.email,
        'Téléphone : ' + (data.phone || 'non renseigné'),
        '',
        'Message :',
        data.message
      ].join('\n');

      window.location.href = 'mailto:' + mailto +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      setStatus('Votre logiciel de messagerie va s’ouvrir avec le message pré-rempli. Il ne reste qu’à l’envoyer.', 'success');
    }

    /* --- Envoi via Formspree (ou tout service acceptant du JSON) --- */
    function sendByFetch(data) {
      submit.disabled = true;
      setStatus('Envoi en cours…', '');

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          setStatus('Message envoyé, merci ! Je vous réponds sous 48 heures.', 'success');
        })
        .catch(function () {
          setStatus('L’envoi a échoué. Réessayez ou écrivez directement à ' + (mailto || 'notre adresse email') + '.', 'error');
        })
        .then(function () {
          submit.disabled = false;
        });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Piège anti-spam : si le champ caché est rempli, c'est un robot.
         On simule un succès sans rien envoyer. */
      var honeypot = form.querySelector('[name="_gotcha"]');
      if (honeypot && honeypot.value) {
        setStatus('Message envoyé, merci !', 'success');
        return;
      }

      /* Validation de tous les champs avant envoi */
      var fields = $$('.field__input', form);
      var firstInvalid = null;

      fields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        setStatus('Merci de corriger les champs signalés.', 'error');
        firstInvalid.focus();
        return;
      }

      /* form.elements[...] plutôt que form[...] : évite toute collision avec
         les propriétés natives du formulaire (form.name, form.method...). */
      var el = form.elements;
      var data = {
        name:    el['name'].value.trim(),
        email:   el['email'].value.trim(),
        phone:   el['phone'].value.trim(),
        message: el['message'].value.trim()
      };

      if (endpoint) {
        sendByFetch(data);
      } else if (mailto) {
        sendByMailto(data);
      } else {
        setStatus('Le formulaire n’est pas encore configuré. Merci d’utiliser les coordonnées ci-contre.', 'error');
      }
    });
  })();


  /* ===============================================================
     6. ANNÉE COURANTE DANS LE PIED DE PAGE
     =============================================================== */
  (function initYear() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  })();

})();
