(function () {
  "use strict";

  const cfg = window.APP_CONFIG || {};
  const SEMINAIRE = window.SEMINAIRE || {};
  const STEPS = window.STEPS || [];
  const QUESTIONS = STEPS.reduce(function (all, s) { return all.concat(s.questions); }, []);
  const DEMO = !cfg.supabaseUrl || !cfg.supabaseAnonKey;

  // ---------- Accès aux données ----------
  // checkInvite -> { status: ok | not_invited | already_answered, chambre_individuelle }
  // submit      -> ok | not_invited | already_answered | invalid

  async function rpc(fn, args) {
    const res = await fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { apikey: cfg.supabaseAnonKey, "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
    if (!res.ok) {
      const err = new Error("HTTP " + res.status);
      err.server = true;
      throw err;
    }
    return res.json();
  }

  // Mode démo : mêmes invités fictifs que supabase/schema.sql (garder les deux listes alignées).
  // Les lignes entre DEMO-DEBUT et DEMO-FIN sont retirées de la version publiée (scripts/publier-page.ps1).
  const DEMO_INVITES = {};
  // Même règle que check_invite : grade commençant par « associ » ou « direct », ou « partner ».
  function isSoloGrade(grade) {
    const g = (grade || "").trim().toLowerCase();
    return g.indexOf("associ") === 0 || g.indexOf("direct") === 0 || g === "partner";
  }
  const DEMO_KEY = "ski-demo-responses";

  function demoLoad() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || {}; } catch (e) { return {}; }
  }
  function demoSave(all) {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(all)); } catch (e) { /* stockage indisponible */ }
  }

  const api = DEMO ? {
    checkInvite: async function (email) {
      if (!(email in DEMO_INVITES)) return { status: "not_invited" };
      if (demoLoad()[email]) return { status: "already_answered" };
      return { status: "ok", chambre_individuelle: isSoloGrade(DEMO_INVITES[email]) };
    },
    submit: async function (email, nom, prenom, answers) {
      if (!(email in DEMO_INVITES)) return "not_invited";
      const all = demoLoad();
      if (all[email]) return "already_answered";
      all[email] = { nom: nom, prenom: prenom, answers: answers, submitted_at: new Date().toISOString() };
      demoSave(all);
      return "ok";
    }
  } : {
    checkInvite: function (email) { return rpc("check_invite", { p_email: email }); },
    submit: function (email, nom, prenom, answers) {
      return rpc("submit_response", { p_email: email, p_nom: nom, p_prenom: prenom, p_answers: answers });
    }
  };

  // ---------- Utilitaires DOM ----------

  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") node.textContent = attrs[k];
      else if (attrs[k] === true) node.setAttribute(k, "");
      else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  // Icônes (tracés statiques, style lucide), utilisées par les cartes de choix et les infos.
  const ICONS = {
    oui: '<path d="M20 6 9 17l-5-5"/>',
    non: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    ski: '<path d="M3 16 16 3"/><path d="M8 21 21 8"/><path d="M16 3c1.5-.5 3 .5 2.5 2"/><path d="M21 8c.5-1.5-1-3-2.5-2.5"/>',
    snowboard: '<rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="m9 13.5 1.5-2"/><path d="m13.5 10.5 1.5-2"/>',
    montagne: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/><path d="M4.1 15.1c2.6-1.6 5.2-1.4 7.9.4 2.7 1.9 5.5 2 8.2.2"/>',
    raquettes: '<ellipse cx="8" cy="12" rx="4" ry="8"/><ellipse cx="16" cy="12" rx="4" ry="8"/><path d="M4 12h8M12 12h8"/>',
    chalet: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    calendrier: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    lieu: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    hotel: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6M2 18h20"/>'
  };

  function icon(name, cls) {
    const span = el("span", { class: cls, "aria-hidden": "true" });
    if (ICONS[name]) {
      span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" ' +
        'stroke-linecap="round" stroke-linejoin="round">' + ICONS[name] + "</svg>";
    }
    return span;
  }

  function show(viewId) {
    ["#view-login", "#view-form", "#view-done"].forEach(function (id) { $(id).hidden = id !== viewId; });
    window.scrollTo(0, 0);
    $(viewId + " h2").focus();
  }

  function setError(box, msg) {
    box.textContent = msg || "";
    box.hidden = !msg;
  }

  const MESSAGES = {
    not_invited: "Cette adresse email ne figure pas dans la liste des invités. Vérifiez l'orthographe ou contactez l'équipe d'organisation.",
    already_answered: "Une réponse a déjà été enregistrée pour cette adresse email. Une seule réponse est possible par personne.",
    invalid: "Certaines informations sont invalides. Vérifiez le formulaire.",
    network: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
    server: "Le service est momentanément indisponible. Réessayez plus tard ou contactez l'équipe d'organisation."
  };

  function failureMessage(err) {
    return err && err.server ? MESSAGES.server : MESSAGES.network;
  }

  // ---------- État ----------

  let person = null; // { email, nom, prenom, solo }
  let current = 0;   // index de l'étape affichée

  // ---------- Étape 0 : identification ----------

  $("#login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const box = $("#login-error");
    const btn = $("#login-btn");
    formatField($("#prenom"));
    formatField($("#nom"));
    const prenom = $("#prenom").value.trim();
    const nom = $("#nom").value.trim();
    const email = $("#email").value.trim().toLowerCase();
    setError(box, "");

    if (!prenom || !nom || !email) return setError(box, "Merci de renseigner tous les champs.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(box, "Adresse email invalide.");

    btn.disabled = true;
    try {
      const res = await api.checkInvite(email);
      if (!res || res.status !== "ok") return setError(box, MESSAGES[res && res.status] || MESSAGES.invalid);
      if (!person || person.email !== email) qForm.reset(); // pas de réponses d'une autre personne
      person = { email: email, nom: nom, prenom: prenom, solo: !!res.chambre_individuelle };
      $("#hello").textContent = "Bonjour " + prenom + ", voici la présentation du séminaire. " +
        "Une seule réponse est possible : vérifiez vos choix avant d'envoyer.";
      document.body.classList.toggle("solo-room", person.solo);
      applyConditions();
      goTo(0);
      show("#view-form");
    } catch (err) {
      setError(box, failureMessage(err));
    } finally {
      btn.disabled = false;
    }
  });

  // ---------- Mise en forme des noms ----------

  // "dupont" -> "DUPONT" ; "jean-pierre d'arc" -> "Jean-Pierre D'Arc"
  const FORMATS = {
    nom: function (v) { return v.toUpperCase(); },
    prenom: function (v) {
      return v.toLowerCase().replace(/(^|[\s\-'’])(\S)/g, function (m, sep, c) { return sep + c.toUpperCase(); });
    }
  };

  function formatField(f) {
    const fmt = FORMATS[f.dataset.format];
    if (fmt) f.value = fmt(f.value.trim().replace(/\s+/g, " "));
  }

  ["#prenom", "#nom"].forEach(function (sel) {
    $(sel).addEventListener("change", function (e) { formatField(e.target); });
  });

  // ---------- Questionnaire par étapes ----------

  function renderField(q) {
    if (q.type === "heading") return el("p", { class: "field subhead", "data-qid": q.id, text: q.label });
    const name = "q_" + q.id;
    const req = !!q.required;
    let control;

    if (q.type === "select") {
      control = el("select", { id: name, name: name, required: req }, [el("option", { value: "", text: "Choisir…" })]
        .concat(q.options.map(function (o) { return el("option", { value: o, text: o }); })));
    } else if (q.display === "cards") {
      // Choix illustrés : icône, titre, détail ; le bouton radio reste natif (clavier, lecteurs d'écran).
      const type = q.type === "radio" ? "radio" : "checkbox";
      control = el("div", { class: "cards" }, q.options.map(function (o, i) {
        return el("label", { class: "card-choice" }, [
          el("input", { type: type, name: name, value: o, required: type === "radio" && req, id: name + "_" + i }),
          icon((q.icons || {})[o], "card-icon"),
          el("span", { class: "card-title", text: o }),
          el("span", { class: "card-detail", text: (q.details || {})[o] || "" }),
          el("span", { class: "card-check", "aria-hidden": "true" })
        ]);
      }));
    } else if (q.type === "radio" || q.type === "checkboxes") {
      const type = q.type === "radio" ? "radio" : "checkbox";
      control = el("div", { class: "choices" }, q.options.map(function (o, i) {
        return el("label", { class: "choice" }, [
          el("input", { type: type, name: name, value: o, required: type === "radio" && req, id: name + "_" + i }),
          el("span", { text: o })
        ]);
      }));
    } else if (q.type === "textarea") {
      control = el("textarea", { id: name, name: name, rows: "3", maxlength: "1000", required: req });
    } else if (q.type === "number") {
      control = el("input", { id: name, name: name, type: "number", min: q.min, max: q.max, inputmode: "numeric", required: req });
    } else {
      control = el("input", { id: name, name: name, type: "text", maxlength: q.maxlength || 300, required: req,
        "data-format": q.format, autocomplete: "off" });
    }

    const isGroup = q.type === "radio" || q.type === "checkboxes";
    const label = el(isGroup ? "legend" : "label", isGroup ? {} : { for: name }, [
      document.createTextNode(q.label),
      req ? el("span", { class: "req", text: " *" }) : el("span", { class: "opt", text: " (facultatif)" })
    ]);
    const parts = [label];
    if (q.help) parts.push(el("p", { class: "help", text: q.help }));
    parts.push(control);
    return el(isGroup ? "fieldset" : "div", { class: q.half ? "field half" : "field", "data-qid": q.id }, parts);
  }

  function renderSeminaire() {
    const parts = [];
    if (SEMINAIRE.image) parts.push(el("img", { class: "seminaire-img", src: SEMINAIRE.image, alt: "" }));
    parts.push(el("p", { text: SEMINAIRE.presentation }));
    parts.push(el("div", { class: "infos" }, [
      ["calendrier", "Dates", SEMINAIRE.dates], ["lieu", "Lieu", SEMINAIRE.lieu], ["hotel", "Hôtel", SEMINAIRE.hotel]
    ].map(function (r) {
      return el("div", { class: "info" }, [
        icon(r[0], "info-icon"),
        el("div", {}, [el("span", { class: "info-key", text: r[1] }), el("span", { class: "info-value", text: r[2] })])
      ]);
    })));
    return el("div", { class: "seminaire" }, parts);
  }

  function renderStep(step, i) {
    const parts = [];
    if (step.showSeminaire) parts.push(renderSeminaire());
    if (step.intro) parts.push(el("p", { class: "intro shared-only", text: step.intro }));
    if (step.notice) {
      parts.push(el("div", { class: "notice shared-only" }, [
        el("strong", { text: "Règles importantes" }),
        el("ul", {}, step.notice.map(function (n) { return el("li", { text: n }); }))
      ]));
    }
    if (step.soloMessage) parts.push(el("p", { class: "notice solo-only", text: step.soloMessage }));
    step.questions.forEach(function (q) { parts.push(renderField(q)); });
    return el("section", { class: "step", "data-step": i, hidden: true }, parts);
  }

  // Valeurs cochées / sélectionnées d'une question (tableau, éventuellement vide).
  function values(id) {
    const fields = $$(qForm, '[name="q_' + id + '"]');
    if (!fields.length) return [];
    if (fields[0].type === "radio" || fields[0].type === "checkbox") {
      return fields.filter(function (f) { return f.checked && !f.disabled; }).map(function (f) { return f.value; });
    }
    return fields[0].disabled || !fields[0].value ? [] : [fields[0].value];
  }

  function isVisible(q) {
    if (q.sharedRoomOnly && person && person.solo) return false;
    if (!q.showIf) return true;
    return values(q.showIf.id).some(function (v) { return q.showIf.in.indexOf(v) !== -1; });
  }

  // Dans l'ordre du formulaire : une question masquée désactive ses champs, ce qui masque
  // aussi les questions qui en dépendent (conditions en chaîne).
  function applyConditions() {
    QUESTIONS.forEach(function (q) {
      const wrap = qForm.querySelector('[data-qid="' + q.id + '"]');
      const visible = isVisible(q);
      wrap.hidden = !visible;
      $$(wrap, "input, select, textarea").forEach(function (f) { f.disabled = !visible; });
    });
  }

  function declinesParticipation() {
    return values("participation")[0] === "Non";
  }

  function isLastStep() {
    return current === STEPS.length - 1 || (current === 0 && declinesParticipation());
  }

  function goTo(i) {
    const direction = i < current ? "enter-back" : "enter-fwd";
    current = i;
    $$(qForm, ".step").forEach(function (s, k) {
      s.hidden = k !== i;
      s.classList.remove("enter-fwd", "enter-back");
      if (k === i) { void s.offsetWidth; s.classList.add(direction); } // relance l'animation d'entrée
    });
    $("#step-title").textContent = STEPS[i].title;
    $("#progress").textContent = "Étape " + (i + 1) + " / " + STEPS.length;
    const bar = $("#progress-bar");
    if (!bar.children.length) STEPS.forEach(function () { bar.appendChild(el("span")); });
    $$(bar, "span").forEach(function (s, k) { s.className = k < i ? "done" : k === i ? "current" : ""; });
    $("#hello").hidden = i !== 0;
    updateNextLabel();
    setError($("#form-error"), "");
    window.scrollTo(0, 0);
    $("#step-title").focus();
    // Évite qu'un double clic sur « Suivant » envoie aussitôt l'étape suivante.
    const btn = $("#next-btn");
    btn.disabled = true;
    setTimeout(function () { btn.disabled = false; }, 600);
  }

  function updateNextLabel() {
    $("#next-btn .label").textContent = isLastStep() ? "Envoyer ma réponse" : "Suivant";
  }

  // Règles que la validation native ne couvre pas, sur les cases à cocher.
  function checkboxGroupError(q) {
    const chosen = values(q.id);
    if (q.exclusive && chosen.length > 1 && chosen.indexOf(q.exclusive) !== -1) {
      return "« " + q.exclusive + " » ne peut pas être combiné avec une autre option.";
    }
    return q.required && !chosen.length ? "Cochez au moins une option." : "";
  }

  function validateStep(i) {
    const section = $$(qForm, ".step")[i];
    STEPS[i].questions.forEach(function (q) {
      if (q.type !== "checkboxes") return;
      const first = qForm.querySelector('[name="q_' + q.id + '"]');
      first.setCustomValidity(first.disabled ? "" : checkboxGroupError(q));
    });
    const fields = $$(section, "input, select, textarea").filter(function (f) { return !f.disabled; });
    fields.forEach(function (f) {
      if (f.required && (f.type === "text" || f.tagName === "TEXTAREA")) {
        f.setCustomValidity(f.value.trim() ? "" : "Ce champ est obligatoire.");
      }
    });
    for (let k = 0; k < fields.length; k++) {
      if (!fields[k].checkValidity()) {
        fields[k].reportValidity();
        return false;
      }
    }
    return true;
  }

  function collectAnswers() {
    const answers = {};
    QUESTIONS.forEach(function (q) {
      if (declinesParticipation() && q.id !== "participation") return;
      if (q.type === "heading" || !isVisible(q)) return;
      const v = values(q.id);
      if (q.type === "checkboxes") answers[q.id] = v;
      else {
        const s = (v[0] || "").trim();
        answers[q.id] = q.format ? FORMATS[q.format](s) : s;
      }
    });
    if (person.solo && !declinesParticipation()) answers.chambre_type = "Individuelle";
    return answers;
  }

  const qForm = $("#questions-form");
  const stepsBox = $("#steps");
  STEPS.forEach(function (s, i) { stepsBox.appendChild(renderStep(s, i)); });
  qForm.addEventListener("change", function (e) {
    if (e.target.dataset && e.target.dataset.format) formatField(e.target);
    applyConditions();
    updateNextLabel();
  });

  $("#back-btn").addEventListener("click", function () {
    if (current === 0) {
      setError($("#form-error"), "");
      show("#view-login");
    } else {
      goTo(current - 1);
    }
  });

  qForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;
    if (!isLastStep()) return goTo(current + 1);

    const box = $("#form-error");
    const btn = $("#next-btn");
    const answers = collectAnswers();
    btn.disabled = true;
    try {
      const status = await api.submit(person.email, person.nom, person.prenom, answers);
      if (status !== "ok") return setError(box, MESSAGES[status] || MESSAGES.invalid);
      renderRecap(answers);
      show("#view-done");
      if (window.Effets) window.Effets.celebrate();
    } catch (err) {
      setError(box, failureMessage(err));
    } finally {
      btn.disabled = false;
    }
  });

  // ---------- Fin : confirmation ----------

  function renderRecap(answers) {
    const dl = $("#recap");
    dl.textContent = "";
    const rows = [["Nom", person.prenom + " " + person.nom], ["Email", person.email]];
    QUESTIONS.forEach(function (q) {
      if (q.id in answers) rows.push([q.id === "chambre_type" && person.solo ? "Chambre" : q.label,Array.isArray(answers[q.id]) ? answers[q.id].join(", ") : answers[q.id]]);
    });
    rows.forEach(function (row) {
      dl.appendChild(el("dt", { text: row[0] }));
      dl.appendChild(el("dd", { text: row[1] || "—" }));
    });
  }

  document.title = SEMINAIRE.titre || document.title;
  $("#hero-sub").textContent = [SEMINAIRE.dates, SEMINAIRE.lieu].filter(Boolean).join(" · ");
  if (DEMO) $("#demo-banner").hidden = false;
})();
