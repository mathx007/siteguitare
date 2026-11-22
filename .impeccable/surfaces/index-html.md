---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["js/app.js","app.css"]
---

Scope: toute l'application (Accueil, Collection, fiche de morceau, Paliers, Trophées, Progrès, Manche, Oreille). Mode : operate.
Audience et tâche : guitariste devant l'écran du PC, guitare en main ; jouer la séance du jour en un minimum de clics, puis voir sa progression et sa collection.
Contraintes : HTML/CSS/JS sans framework, aucune ressource externe nouvelle, illustrations du domaine public via Wikimedia, WCAG 2.1 AA, prefers-reduced-motion, rien ne déborde à 390 px.
Moment mémorable : la tuile qui grandit et se détaille quand on s'y pose, pendant que ses voisines glissent de côté et que les autres rangées s'assombrissent.
Décisions ouvertes : version téléphone détaillée de chaque page ; place du booster et du boss dans les rangées.

## Direction contract

THESIS: L'application est un mur de rangées d'œuvres qu'on parcourt un axe à la fois : la prochaine action occupe la vitrine, tout le reste (séance, collection, paliers, trophées) est une rangée qu'on balaie de côté sans changer de page. Refuse le tableau de bord de panneaux empilés et la fenêtre ouverte pour chaque action.
OWN-WORLD: Fond neutre très sombre #0B0B12, rangées sur #12121C, les peintures des cartes comme seuls champs de couleur, un unique accent or #FFD166 pour le focus et l'état actif ; cadres de rareté conservés en bordure fine ; Archivo 125 % graisse 900 pour les titres, Inter pour le texte ; tuiles à ratio fixe (5:7,4 pour les cartes, 16:10 pour missions et paliers).
STORY: Le visiteur voit sa prochaine mission et la lance d'un clic ; il voit la séance avancer dans sa rangée et sa collection grandir ; chaque autre page suit la même grammaire, une vitrine plus des rangées, donc il sait toujours où regarder.
FIRST VIEWPORT: Barre de navigation standard (liens Accueil à Progrès, série et niveau à droite), puis la vitrine sur le tiers supérieur : titre de la mission en grand, consigne, bouton principal Jouer et bouton secondaire Voir sur le manche, l'œuvre liée en fond fondu vers la gauche ; dessous, la rangée Ta séance avec la tuile en cours mise au point ; dessous, la rangée Ta collection en retrait.
FORM: Mur de cartes façon plateforme de streaming (catalogue pop-culture-shelf-streaming-title-card-wall), choisi par l'utilisateur parmi cinq ; seed: d5ded5adb1c0ae79. Geste signature : la tuile au point grandit (ressort 220 ms, sortie exponentielle) et révèle ses métadonnées, voisines poussées, rangée active éclairée et autres rangées à 55 % ; sans mouvement réduit, seul le contour or change.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
