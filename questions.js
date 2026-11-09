// Contenu du formulaire : textes du séminaire et questions, page par page.
// Les éléments entre [crochets] sont à compléter.

window.SEMINAIRE = {
  titre: "Séminaire ski",
  presentation: "[Texte de présentation du séminaire : programme, objectifs, ambiance…]",
  dates: "[dates à confirmer]",
  lieu: "[station à confirmer]",
  hotel: "[hôtel à confirmer]",
  image: "",                       // ex. "img/hotel.jpg" (fichier à déposer dans le dossier img/)
  dateAller: "[date à confirmer]",
  dateRetour: "[date à confirmer]",
  chambres: "[Présentation des chambres : chambres de 2 et de 3 personnes, équipements…]",
  // Créneaux de glisse proposés (sert aux forfaits). [à confirmer]
  joursGlisse: ["Jeudi toute la journée", "Vendredi matin *"],
  joursGlisseNote: "* Attention : soirée en boîte de nuit le jeudi soir !"
};

(function () {
  const S = window.SEMINAIRE;
  const SKI = ["Ski", "Ski et snowboard"];
  const SNOW = ["Snowboard", "Ski et snowboard"];
  const GLISSE = ["Ski", "Snowboard", "Ski et snowboard"];
  const NIVEAUX = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];
  const POINTURES = [];
  for (let p = 35; p <= 50; p += 0.5) POINTURES.push(String(p).replace(".5", ",5"));

  // Colocataire n : prénom et nom sur une même ligne.
  function colocataire(n) {
    return [
      { id: "colocataire_" + n + "_prenom", label: "Choix " + n + " : prénom", type: "text", required: false,
        format: "prenom", half: true, sharedRoomOnly: true },
      { id: "colocataire_" + n + "_nom", label: "Choix " + n + " : nom", type: "text", required: false,
        format: "nom", half: true, sharedRoomOnly: true }
    ];
  }

  // Types : select, radio, checkboxes, number, text, textarea.
  // showIf : { id, in: [...] } la question n'apparaît que si la réponse à "id" est dans la liste.
  // sharedRoomOnly : question masquée pour les grades ayant une chambre individuelle.
  // exclusive : option de cases à cocher qui ne peut pas être combinée avec les autres.
  // format : "nom" (MAJUSCULES) ou "prenom" (Première lettre en majuscule), appliqué automatiquement.
  // half : affiché sur une demi-largeur (à côté du champ suivant).
  // heading : simple intertitre, sans réponse.
  // display: "cards" : choix en cartes illustrées (icons = icône par option, details = sous-titre).
  window.STEPS = [
    {
      id: "presentation",
      title: "Le séminaire",
      showSeminaire: true,
      questions: [
        { id: "participation", label: "Participerez-vous au séminaire ?", type: "radio", required: true,
          options: ["Oui", "Non"], display: "cards",
          icons: { "Oui": "oui", "Non": "non" },
          details: { "Oui": "Je serai de la partie", "Non": "Je ne pourrai pas venir" } }
      ]
    },
    {
      id: "voyage",
      title: "Voyage",
      questions: [
        { id: "aller", label: "Aller (" + S.dateAller + ") : comment vous rendez-vous au séminaire ?",
          type: "radio", required: true, options: ["Train KPMG depuis Paris", "Par mes propres moyens"] },
        { id: "retour", label: "Retour (" + S.dateRetour + ") : comment rentrez-vous ?",
          type: "radio", required: true, options: ["Train KPMG vers Paris", "Par mes propres moyens"] },
        { id: "age", label: "Âge", type: "number", required: true, min: 16, max: 80,
          help: "Au moment du séminaire. Important pour le tarif de groupe et les réductions SNCF." }
      ]
    },
    {
      id: "activite",
      title: "Activité sportive et location de matériel",
      questions: [
        { id: "activite", label: "Quelle activité souhaitez-vous pratiquer ?", type: "radio", required: true,
          options: ["Ski", "Snowboard", "Ski et snowboard", "Autre activité", "Aucune activité"], display: "cards",
          icons: { "Ski": "ski", "Snowboard": "snowboard", "Ski et snowboard": "montagne",
            "Autre activité": "raquettes", "Aucune activité": "chalet" },
          details: { "Ski": "Pistes et forfait", "Snowboard": "Board et forfait", "Ski et snowboard": "Le meilleur des deux",
            "Autre activité": "Raquettes, luge…", "Aucune activité": "Détente au chalet" } },
        { id: "jours_glisse", label: "Quand souhaitez-vous skier / rider ?", type: "checkboxes", required: true,
          options: S.joursGlisse, help: "Pour réserver les forfaits. " + S.joursGlisseNote,
          showIf: { id: "activite", in: GLISSE } },
        { id: "niveau_ski", label: "Niveau de ski", type: "select", required: true, options: NIVEAUX,
          showIf: { id: "activite", in: SKI } },
        { id: "niveau_snowboard", label: "Niveau de snowboard", type: "select", required: true, options: NIVEAUX,
          showIf: { id: "activite", in: SNOW } },
        { id: "pointure", label: "Pointure de chaussures", type: "select", required: true, options: POINTURES,
          help: "Pour préparer la location du matériel.", showIf: { id: "activite", in: GLISSE } },
        { id: "taille_cm", label: "Taille (cm)", type: "number", required: true, min: 100, max: 220,
          help: "Pour définir la taille des skis.", showIf: { id: "activite", in: SKI } },
        { id: "poids_kg", label: "Poids (kg)", type: "number", required: false, min: 30, max: 200,
          help: "Pour le réglage des fixations (déchaussement). Vous n'êtes pas obligé(e) de communiquer cette " +
            "information à ce stade : elle vous sera redemandée au moment de l'attribution des skis.",
          showIf: { id: "activite", in: SKI } },
        { id: "autre_activite", label: "Quelle(s) activité(s) vous intéresse(nt) ?", type: "checkboxes", required: true,
          options: ["Randonnée en raquettes", "Luge", "Ski de fond", "Chiens de traîneau", "Balade à pied", "Autre"],
          showIf: { id: "activite", in: ["Autre activité"] } },
        { id: "autre_activite_precision", label: "Précisez l'activité", type: "text", required: true,
          showIf: { id: "autre_activite", in: ["Autre"] } },
        { id: "cours", label: "Je souhaite prendre des cours", type: "select", required: true,
          options: ["Oui, des cours de ski", "Oui, des cours de snowboard", "Non, je ne souhaite pas prendre de cours"],
          showIf: { id: "activite", in: GLISSE } }
      ]
    },
    {
      id: "regime",
      title: "Régime alimentaire",
      questions: [
        // 14 allergènes réglementaires (UE) + allergies fréquentes en France.
        { id: "allergies", label: "Avez-vous des allergies alimentaires ?", type: "checkboxes", required: true,
          exclusive: "Aucune allergie",
          options: ["Aucune allergie", "Arachides", "Fruits à coque (noix, noisettes, amandes…)", "Lait", "Œufs",
            "Gluten", "Poissons", "Crustacés", "Mollusques", "Soja", "Sésame", "Moutarde", "Céleri", "Sulfites",
            "Lupin", "Kiwi", "Pomme, pêche et autres rosacées", "Banane", "Agrumes", "Maïs", "Ail", "Autre"] },
        { id: "allergies_autre", label: "Précisez votre allergie", type: "text", required: true,
          showIf: { id: "allergies", in: ["Autre"] } },
        // Pas d'option explicitement religieuse (halal, casher) : donnée sensible (RGPD).
        // « Sans porc » conservé à la demande de l'organisateur, à valider.
        { id: "regime", label: "Suivez-vous un régime alimentaire particulier ?", type: "checkboxes", required: true,
          exclusive: "Aucun",
          options: ["Aucun", "Végétarien", "Végan", "Pescétarien", "Sans porc", "Sans gluten", "Sans lactose", "Autre"] },
        { id: "regime_precision", label: "Précisez votre régime", type: "text", required: true,
          showIf: { id: "regime", in: ["Autre"] } }
      ]
    },
    {
      id: "chambre",
      title: "Chambre",
      soloMessage: "Une chambre individuelle vous est réservée : vous n'avez rien à renseigner ici.",
      intro: S.chambres,
      notice: [
        "Les chambres ne sont pas mixtes.",
        "Nous essaierons d'attribuer les chambres selon vos choix. La répartition peut toutefois évoluer en fonction de contraintes extérieures."
      ],
      questions: [
        { id: "chambre_type", label: "Je préférerais être dans une chambre de", type: "radio", required: true,
          options: ["2 personnes", "3 personnes", "Pas de préférence"], sharedRoomOnly: true },
        { id: "colocataires_titre", type: "heading", label: "Je souhaite partager ma chambre en priorité avec :",
          sharedRoomOnly: true }
      ].concat(colocataire(1), colocataire(2), colocataire(3), [
        { id: "commentaire", label: "Commentaire libre", type: "textarea", required: false }
      ])
    }
  ];
})();
