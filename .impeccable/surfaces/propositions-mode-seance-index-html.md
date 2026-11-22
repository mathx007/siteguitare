---
version: 1
slug: "propositions-mode-seance-index-html"
primary_target: "propositions/mode-seance/index.html"
related_targets: ["js/data.js"]
---

Scope : le mode séance plein écran (prototype cliquable avant intégration au site), avec l'entrée depuis l'Accueil « Mur de cartes » et le récapitulatif de fin. Mode : operate. Modes clair et sombre, même mise en page.
Audience et tâche : guitariste devant l'écran du PC, guitare en main ; enchaîner les 4 missions du jour sans viser de boutons qui bougent, au clavier si possible.
Contraintes : HTML/CSS/JS sans framework, aucune ressource externe nouvelle (œuvres via upload.wikimedia.org comme le site), contenu réel tiré de js/data.js, WCAG 2.1 AA, prefers-reduced-motion, rien ne déborde à 390 px. Règles du jeu inchangées : le boss ne perd pas de PV à la séance, effet visuel seulement.
Moment mémorable : la carte « Mission suivante dans 3 s » qui se remplit puis passe la main à la mission suivante.
Décisions ouvertes : intégration dans js/app.js (route ou couche plein écran), sort de l'Accueil clair actuel une fois le Mur étendu au mode clair.

## Direction contract

THESIS: La séance est la vitrine du Mur portée en plein écran : une mission à la fois, son œuvre en fond, la suivante qui s'annonce comme un épisode. Refuse la fenêtre modale posée sur un tableau de bord.
OWN-WORLD: Le Mur de cartes sous deux lumières : sombre #0B0B12 et rangées #12121C, clair #F3F2F8 et rangées #FFFFFF ; l'œuvre du domaine public de la mission est le seul grand champ de couleur, fondue dans le fond ; un seul accent or #FFD166 pour l'action principale, le focus et le compte à rebours ; Archivo 125 % graisse 900 pour les titres, Inter pour le texte ; couleurs de branche seulement sur les 4 segments de progression.
STORY: Tu lances la séance d'un clic ; chaque mission occupe l'écran avec sa consigne, un chrono géant et son outil déjà prêt ; tu valides avec Entrée, toujours au même endroit ; la suivante s'annonce pendant 3 secondes ; à la fin, le boss encaisse le coup et le récapitulatif montre ce que la séance a rapporté.
FIRST VIEWPORT: Barre fine en haut (séance, mission i sur 4, 4 segments, Quitter avec Échap). À gauche, le titre de la mission en très grand, une ligne de repères dessous, la consigne en grand corps, le chrono géant et l'outil de la mission ; le bouton or « Validée » à une place fixe. À droite, l'œuvre de la mission fondue vers la gauche. En bas, la rangée « À suivre » et la carte « Mission suivante dans 3 s ». Sur téléphone, l'œuvre passe en bandeau et « Validée » occupe le bas de l'écran.
FORM: Vitrine plein écran façon « épisode suivant », rang 1 de ma liste ordonnée, choisie par l'utilisateur parmi trois structures tirées ; seed:c09c6b5d5623e8a0. Geste signature : la carte « Mission suivante » se remplit en 3 s puis la mission suivante glisse en fondu ; tampon ✓ à la validation ; guide en tiroir latéral sur l'œuvre, chrono toujours visible.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
