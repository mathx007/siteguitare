---
name: Gratte Quest
description: "Le Mur de cartes sous deux lumières : une vitrine, des rangées de tuiles et des œuvres du domaine public pour 30 minutes de guitare par jour."
colors:
  gold: "#FFD166"
  on-gold: "#1B1733"
  day-focus: "#4B3BEF"
  day-cue: "#8F6500"
  day-ok: "#177750"
  day-bad: "#B3203A"
  day-root: "#E8432A"
  night-ok: "#3DDC97"
  night-bad: "#FF8A8A"
  night-root: "#FF6B4F"
  rarity-common: "#8E96A8"
  rarity-rare: "#4D8DFF"
  rarity-epic: "#A46BFF"
  rarity-legendary: "#FFC93D"
  rarity-mythic: "#FF4D8D"
  rarity-locked: "#6E6A83"
  branch-gammes: "#0B7769"
  branch-vitesse: "#C22B26"
  branch-impro: "#926019"
  branch-oreille: "#1F60D1"
  branch-riffs: "#A93392"
  night-wall: "#0B0B12"
  night-row: "#12121C"
  night-tile: "#1A1A26"
  night-tile2: "#232333"
  night-line: "#2A2A3A"
  night-ink: "#EDEAE4"
  night-muted: "#ABA8BA"
  day-wall: "#F3F2F8"
  day-row: "#FFFFFF"
  day-tile: "#FFFFFF"
  day-tile2: "#ECEAF4"
  day-line: "#DEDBEA"
  day-ink: "#1B1733"
  day-muted: "#5A5674"
typography:
  display:
    fontFamily: "Archivo, 'Arial Black', sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 4rem)"
    fontWeight: 900
    lineHeight: 0.96
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  display-stage:
    fontFamily: "Archivo, 'Arial Black', sans-serif"
    fontSize: "clamp(2.4rem, 4.6vw, 4.4rem)"
    fontWeight: 900
    lineHeight: 0.94
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 125"
  numeral:
    fontFamily: "Archivo, 'Arial Black', sans-serif"
    fontSize: "clamp(3.4rem, 5.6vw, 5rem)"
    fontWeight: 900
    lineHeight: 0.9
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 125"
  stat:
    fontFamily: "Archivo, 'Arial Black', sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 1
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, 'Arial Black', sans-serif"
    fontSize: "1.3rem"
    fontWeight: 900
    fontVariation: "'wdth' 125"
  tile-title:
    fontFamily: "Archivo, 'Arial Black', sans-serif"
    fontSize: "1.08rem"
    fontWeight: 900
    lineHeight: 1.15
    fontVariation: "'wdth' 125"
  action:
    fontFamily: "Archivo, 'Arial Black', sans-serif"
    fontSize: "1.35rem"
    fontWeight: 900
    fontVariation: "'wdth' 125"
  lede:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 1.7vw, 1.55rem)"
    fontWeight: 500
    lineHeight: 1.42
  body:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
  button:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
  keycap:
    fontFamily: "Inter, 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  bar: "4px"
  key: "6px"
  sm: "10px"
  md: "12px"
  tile: "14px"
  lg: "16px"
  panel: "18px"
  vitrine: "24px"
  round: "50%"
spacing:
  icon-gap: "10px"
  control-gap: "12px"
  tile-gap: "14px"
  tile-pad: "16px"
  gutter-phone: "16px"
  page-gutter: "24px"
  stage-gutter: "32px"
  section-gap: "34px"
  vitrine-pad-y: "40px"
  vitrine-pad-x: "44px"
components:
  button-gold:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    typography: "{typography.action}"
    rounded: "{rounded.lg}"
    padding: "0 28px"
    height: "64px"
  button-gold-sm:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.on-gold}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "40px"
  button-night:
    backgroundColor: "{colors.night-tile}"
    textColor: "{colors.night-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "48px"
  button-night-pressed:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-wall}"
  button-day:
    backgroundColor: "{colors.day-tile}"
    textColor: "{colors.day-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "48px"
  button-day-pressed:
    backgroundColor: "{colors.day-ink}"
    textColor: "{colors.day-wall}"
  button-icon:
    rounded: "{rounded.round}"
    size: "44px"
  keycap-night:
    backgroundColor: "{colors.night-tile}"
    textColor: "{colors.night-ink}"
    typography: "{typography.keycap}"
    rounded: "{rounded.key}"
    padding: "0 6px"
    height: "24px"
  keycap-day:
    backgroundColor: "{colors.day-tile}"
    textColor: "{colors.day-ink}"
    typography: "{typography.keycap}"
    rounded: "{rounded.key}"
    padding: "0 6px"
    height: "24px"
  nav-link-active-night:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-wall}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  nav-link-active-day:
    backgroundColor: "{colors.day-ink}"
    textColor: "{colors.day-wall}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
  vitrine-night:
    backgroundColor: "{colors.night-row}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.vitrine}"
    padding: "40px 44px"
    height: "380px"
  vitrine-day:
    backgroundColor: "{colors.day-row}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.vitrine}"
    padding: "40px 44px"
    height: "380px"
  tile-mission-night:
    backgroundColor: "{colors.night-tile}"
    textColor: "{colors.night-ink}"
    typography: "{typography.tile-title}"
    rounded: "{rounded.lg}"
    padding: "16px"
    height: "160px"
  tile-mission-night-done:
    backgroundColor: "{colors.night-tile2}"
    textColor: "{colors.night-ink}"
  tile-mission-day:
    backgroundColor: "{colors.day-tile}"
    textColor: "{colors.day-ink}"
    typography: "{typography.tile-title}"
    rounded: "{rounded.lg}"
    padding: "16px"
    height: "160px"
  tile-mission-day-done:
    backgroundColor: "{colors.day-tile2}"
    textColor: "{colors.day-ink}"
  next-card-night:
    backgroundColor: "{colors.night-tile2}"
    textColor: "{colors.night-ink}"
    rounded: "{rounded.lg}"
    padding: "14px 18px"
  next-card-day:
    backgroundColor: "{colors.day-tile2}"
    textColor: "{colors.day-ink}"
    rounded: "{rounded.lg}"
    padding: "14px 18px"
  tool-tray:
    rounded: "{rounded.panel}"
    padding: "14px"
    width: "640px"
  toast-night:
    backgroundColor: "{colors.night-ink}"
    textColor: "{colors.night-wall}"
    rounded: "{rounded.tile}"
    padding: "12px 14px 12px 18px"
  toast-day:
    backgroundColor: "{colors.day-ink}"
    textColor: "{colors.day-wall}"
    rounded: "{rounded.tile}"
    padding: "12px 14px 12px 18px"
  drawer-night:
    backgroundColor: "{colors.night-row}"
    textColor: "{colors.night-ink}"
    padding: "24px 26px"
    width: "440px"
  drawer-day:
    backgroundColor: "{colors.day-row}"
    textColor: "{colors.day-ink}"
    padding: "24px 26px"
    width: "440px"
  song-card:
    backgroundColor: "#1F1C30"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    width: "150px"
  progress-segment-night:
    backgroundColor: "{colors.night-tile2}"
    rounded: "{rounded.bar}"
    height: "8px"
  progress-segment-day:
    backgroundColor: "{colors.day-tile2}"
    rounded: "{rounded.bar}"
    height: "8px"
---

# Design System: Gratte Quest

<!-- Relevé sur le code construit le 22 novembre 2026. Les deux lumières viennent de la maquette du mode séance (propositions/mode-seance/seance.css, seance.js, index.html), la plus récente et la seule complète de jour comme de nuit. Le Mur sombre en ligne vient de app.css (section « Mode sombre : Mur de cartes », classes w-*) et de js/app.js (wall*, wTile, wCard, wBill, wRow). Le design clair « Kyara » (haut de app.css) est le prédécesseur remplacé, pas le système. -->

## Overview

**Creative North Star: "Le Mur de cartes sous deux lumières"**

Gratte Quest est un mur d'œuvres qu'on parcourt un axe à la fois. En haut, la vitrine : la prochaine action de pratique, en très grand titre, avec son œuvre du domaine public fondue dans le fond depuis la droite. Dessous, des rangées de tuiles (la séance, la collection, les paliers, les trophées) qu'on balaie de côté sans changer de page. La séance du jour est cette même vitrine portée en plein écran : une mission à la fois, un chrono géant, le bouton or « Validée » toujours à la même place, et la mission suivante qui s'annonce comme un épisode.

Le Mur est né comme mode sombre du site. Depuis la décision du 22 novembre 2026, il est la grammaire des deux modes : mise en page, formes, typographie et mouvement sont identiques de jour comme de nuit, seules les valeurs de couleur changent (`:root` pour le jour, `:root[data-theme="dark"]` pour la nuit ; choix mémorisé dans `gq-theme`, sinon réglage de l'appareil, appliqué avant l'affichage). Les fonds sont neutres et froids, les surfaces se distinguent par paliers de ton, les peintures sont les seuls grands champs de couleur et un or unique porte l'action. Archivo, très large et très grasse, donne la voix des titres et des chiffres ; Inter porte tout le texte. La densité est basse par principe : la guitare est dans les mains, chaque clic coûte.

Les valeurs de ce document viennent de la maquette du mode séance. Le Mur sombre en ligne en est la première version et s'en écarte encore sur quelques points (bouton principal crème au lieu d'or, Archivo à largeur 112 % dans les rangées, autre courbe de sortie). Le design clair « Kyara » (pages claires, panneaux sombres et brillants, accent violet `#5B4BFF`, or `#F5C518`), encore servi en mode clair sur le site en ligne, est le prédécesseur : il est remplacé et ne fait pas partie de ce système. Refus confirmés par les contrats de direction : le tableau de bord de panneaux empilés, et la fenêtre modale posée par-dessus pour chaque action.

**Key Characteristics:**
- Une vitrine puis des rangées, sur chaque page ; la séance est la vitrine en plein écran.
- Deux lumières, une seule mise en page : nuit sur `night-wall`, jour sur `day-wall`.
- L'œuvre du domaine public est le seul grand champ de couleur, fondue dans le mur par un voile.
- Un seul or : action principale, mission au point, compte à rebours, et focus la nuit.
- Archivo largeur 125 % graisse 900 pour les titres, les tuiles et les chiffres ; Inter pour le texte.
- Coins doux partout, tuiles à bordure de 2 px, cadres de rareté fins sur les cartes.
- Mouvement court en sortie exponentielle, entièrement coupé en mouvement réduit.
- Raccourcis clavier affichés en touches dans les boutons de la séance.

## Colors

Une palette neutre et froide à deux lumières : les peintures apportent la couleur, un or unique désigne ce qu'on fait maintenant.

### Primary
- **Or de rampe** (#FFD166, `gold`) : le seul accent, identique dans les deux lumières. Aplat du bouton d'action principale (« Jouer la séance », « Validée », « Lancer », « Ouvrir le booster du jour »), bordure de la tuile de la mission au point et de la carte « Mission suivante », remplissage de la barre du compte à rebours, temps en cours du métronome, sélection de texte. La nuit, c'est aussi l'anneau de focus (13,6:1 sur `night-wall`).
- **Encre aubergine** (#1B1733, `on-gold`) : texte et touches posés sur l'or (11,97:1), dans les deux lumières.

### Secondary
États et repères, une valeur par lumière.
- **Violet de focus** (#4B3BEF, `day-focus`) : anneau de focus clavier du jour (5,95:1 sur `day-wall`). L'or n'y atteint pas 3:1, d'où ce relais.
- **Or des repères** (#8F6500, `day-cue`) : le jour, remplace l'or pâle sur les traits d'état (bordure de la mission au point et de la carte « Mission suivante », barre du compte à rebours, temps du métronome) : 5,2:1 sur le blanc, 4,7:1 sur `day-wall`. La nuit, ces traits restent en `gold`.
- **Vert sapin** (#177750, `day-ok`) et **Vert menthe** (#3DDC97, `night-ok`) : mission faite (pastille ✓ de 22 à 26 px en haut à droite de la tuile) et tampon ✓ de validation. Coche blanche sur le vert sapin, coche couleur `night-wall` sur la menthe.
- **Rouge grenat** (#B3203A, `day-bad`) et **Corail clair** (#FF8A8A, `night-bad`) : chrono dépassé, « À éviter » dans le guide.
- **Orange vermillon** (#E8432A, `day-root`) et **Orange tonique** (#FF6B4F, `night-root`) : la tonique sur les schémas de manche et la barre de PV du boss.

### Tertiary
- **Cadres de rareté** (`rarity-common` #8E96A8, `rarity-rare` #4D8DFF, `rarity-epic` #A46BFF, `rarity-legendary` #FFC93D, `rarity-mythic` #FF4D8D) : bordure de 3 px des cartes de morceaux. `rarity-locked` (#6E6A83) borde une carte pas encore acquise, dont l'œuvre passe en niveaux de gris à 60 % de luminosité ; une bordure blanche marque la version alt-mythique. Le jaune légendaire reste une bordure de carte, jamais un état ni une action. Ces cadres ne sont construits que sur fond de nuit.
- **Couleurs de branche** (`branch-gammes`, `branch-vitesse`, `branch-impro`, `branch-oreille`, `branch-riffs`, lues dans `BRANCHES` de `js/data.js`) : uniquement sur les segments de la barre de séance, un par mission, de largeur proportionnelle à sa durée.

### Neutral
Nuit :
- **Salle obscure** (#0B0B12, `night-wall`) : fond de page et de la séance plein écran ; sert aussi au voile de l'œuvre (`--fade: 11, 11, 18`).
- **Rangée de nuit** (#12121C, `night-row`) : vitrine, rangée « À suivre », tiroir du guide.
- **Tuile ardoise** (#1A1A26, `night-tile`) : tuiles, boutons secondaires, touches.
- **Ardoise relevée** (#232333, `night-tile2`) : second plan, plus clair que la tuile : tuile faite, carte « Mission suivante », pistes des barres, survol des onglets.
- **Filet de nuit** (#2A2A3A, `night-line`) : bordures de 2 px des tuiles, de 1 px des boutons et panneaux.
- **Papier crème** (#EDEAE4, `night-ink`) : texte principal (16,3:1 sur `night-wall`), aplat des boutons pressés et de l'onglet actif.
- **Gris lavande** (#ABA8BA, `night-muted`) : repères, sous-titres de tuiles, état du chrono (6,65:1 au plus faible, sur `night-tile2`).

Jour :
- **Papier lavande** (#F3F2F8, `day-wall`) : fond de page et de la séance ; voile de l'œuvre (`--fade: 243, 242, 248`). La vitrine d'accueil, blanche, fond son œuvre vers le blanc.
- **Blanc de toile** (#FFFFFF, `day-row` et `day-tile`) : vitrine, rangée « À suivre », tiroir, tuiles et boutons. Rangées et tuiles partagent le blanc et se séparent par leur filet.
- **Lavande enfoncée** (#ECEAF4, `day-tile2`) : second plan, plus sombre que la tuile : tuile faite, carte « Mission suivante », pistes.
- **Filet de jour** (#DEDBEA, `day-line`) : bordures.
- **Encre aubergine** (#1B1733, `day-ink`) : texte principal (15,5:1 sur `day-wall`), aplat des boutons pressés et de l'onglet actif.
- **Gris ardoise violet** (#5A5674, `day-muted`) : repères et sous-titres (5,85:1 au plus faible, sur `day-tile2`).

### Named Rules
**La règle de l'or unique.** Un seul élément or actif par écran. Quand une seconde action or apparaît (« Lancer » pendant le compte à rebours), la première reste à sa place, inerte, à 40 % d'opacité. L'or ne sert jamais de décor.

**La règle de l'œuvre seule couleur.** Les surfaces restent neutres ; la couleur vient de la peinture de la mission ou de la carte, toujours fondue dans le mur par un voile de la couleur exacte du fond.

**La règle des deux lumières.** Une même mise en page, deux jeux de valeurs. Tout nouveau composant lit ses couleurs dans les jetons (`--bg`, `--row`, `--tile`, `--tile2`, `--line`, `--ink`, `--muted`, `--gold`, `--on-gold`, `--focus`, `--ok`, `--bad`, `--root`, `--fade`, `--shadow`) et se vérifie dans les deux lumières.

## Typography

**Display Font:** Archivo (avec "Arial Black", sans-serif), hébergée sur le site (`assets/fonts/fonts.css`, axe de largeur 62 à 125 %, graisses 100 à 900)
**Body Font:** Inter (avec "Segoe UI", system-ui, sans-serif), hébergée sur le site
**Label/Mono Font:** pas de troisième famille ; les chiffres qui changent sont en chiffres tabulaires.

**Character:** Archivo poussée à sa largeur maximale (125 %) et à sa graisse maximale (900) donne des titres larges et compacts d'affiche, lisibles de loin, guitare en main. Inter, en 500 pour le texte et en 600 ou 700 pour les repères et les boutons, reste neutre et nette en dessous.

### Hierarchy
- **Display** (900, largeur 125 %, clamp(2.4rem, 5vw, 4rem), interligne 0,96, approche -0,02em) : titre de la vitrine d'accueil, équilibré sur ses lignes.
- **Display de scène** (`display-stage`, 900, largeur 125 %, clamp(2.4rem, 4.6vw, 4.4rem), 0,94) : titre de mission en plein écran et « Séance terminée ». Au-delà de 18 caractères, le titre descend à clamp(2.2rem, 3.6vw, 3.4rem) pour tenir en deux lignes sans pousser l'outil ; 2.6rem sur téléphone.
- **Numeral** (900, largeur 125 %, clamp(3.4rem, 5.6vw, 5rem), 0,9, chiffres tabulaires) : le chrono. Le tempo du métronome reprend la même voix à 2.6rem.
- **Stat** (900, largeur 125 %, 2rem, 1) : chiffres du récapitulatif de fin.
- **Title** (900, largeur 125 %, 1.3rem) : titres de rangée, suivis sur la même ligne d'un compteur en Label gris.
- **Tile title** (900, largeur 125 %, 1.08rem, 1,15) : titres de tuiles ; 1.02rem dans la rangée « À suivre », 1.35rem dans la carte « Mission suivante ».
- **Action** (900, largeur 125 %, 1.35rem) : texte du grand bouton or ; les petits boutons or gardent Archivo 900 à la taille du bouton.
- **Lede** (Inter 500, clamp(1.15rem, 1.7vw, 1.55rem), 1,42, 34 caractères par ligne au plus) : consigne de la mission. La vitrine d'accueil l'écrit à 1.15rem sur 40 caractères.
- **Body** (Inter 500, 1rem, 1,5) : texte courant, tiroir du guide.
- **Label** (Inter 600, 0.9rem) : ligne de repères sous un titre (« Vitesse · Séquences par 3 · 6 minutes »), sous-titres de tuiles, état du chrono, toujours en `muted`.
- **Button** (Inter 700, 1rem) : boutons secondaires ; les onglets sont en 600.
- **Keycap** (Inter 700, 0.75rem, 1) : touches clavier dans les boutons.

### Named Rules
**La règle de la largeur 125.** Dans le Mur, Archivo est toujours à largeur 125 % et graisse 900, titres de rangée et de tuile compris.

**La règle des chiffres fixes.** Tout chiffre qui change (chrono, tempo, XP, compteurs) est en chiffres tabulaires, pour que rien ne bouge pendant le décompte.

## Layout

La grammaire est la même partout : une vitrine, puis des rangées. Sur l'accueil, la vitrine montre la prochaine mission et ses rangées la séance, la collection, les paliers ; en séance, la vitrine occupe tout l'écran et une seule rangée, « À suivre », reste en bas.

- **Accueil (maquette) :** conteneur centré de 1280 px, marges latérales de 24 px, 34 px entre la vitrine et les rangées. Barre du haut sur une ligne : marque, onglets, bouton lune rond à droite. Vitrine de 380 px de haut au moins : l'œuvre occupe les 62 % de droite, le voile est plein jusqu'à 36 %, à 86 % à mi-largeur, transparent à 82 % ; la colonne de texte fait min(620px, 56%), marges de 40 px sur 44 px, 14 px entre les éléments. La rangée « Ta séance » est une grille de 5 colonnes à 14 px de gouttière.
- **Mur en ligne :** les rangées défilent de côté (rail horizontal, accroche `scroll-snap` en proximité, gouttière de 14 px), avec des tuiles de largeur fixe (236 px, 300 px en large, 132 px pour un jour de semaine) et des cartes de 150 px ; sur PC, une colonne de 176 px garde à gauche le repère des notes ; conteneur de 1180 px.
- **Séance plein écran :** une couche fixe sur tout l'écran, en grille de trois lignes : barre de séance (14 px sur 32 px), scène, rangée « À suivre » de hauteur fixe (188 px). L'œuvre occupe les 62 % de droite sous un double voile (de gauche à droite : plein, 88 % à 22 %, 22 % à 55 %, transparent ; de bas en haut sur 36 %). La colonne de mission fait min(820px, 58%) avec 32 px de marge et empile titre, ligne de repères, consigne, chrono et Pause, plateau d'outil ; elle défile seule si elle déborde. Le dock « Validée » est sous la colonne, à une place fixe. Dans « À suivre » : titre vertical, tuiles de 230 px, carte « Mission suivante » à droite, min(440px, 36%).
- **Écran moyen (1023 px et moins) :** grille de 3 colonnes, tuiles de la file masquées, carte « Mission suivante » sur toute la largeur, colonne de mission min(720px, 72%).
- **Téléphone (760 px et moins) :** barre du haut sur deux lignes, onglets défilants ; marges de 16 px ; l'œuvre devient un bandeau en haut (190 px à l'accueil, 210 px en séance) fondu vers le bas, le titre de mission démarre 120 px plus bas sur ce bandeau ; « Validée » occupe toute la largeur du dock collé au bas de l'écran (avec la marge de sécurité) ; les boutons secondaires du dock passent en icônes de 56 px ; les touches clavier disparaissent ; la carte « Mission suivante » n'apparaît que pendant le compte à rebours et porte « Annuler ».
- **Écran bas (761 px de large et plus, 820 px de haut et moins, portable 1280 × 720) :** tout se resserre pour que la colonne de mission tienne sans défilement : rangée « À suivre » de 142 px, chrono à 3.2rem, grand bouton de 56 px.
- Rien ne déborde horizontalement à 390 px.

### Named Rules
**La règle de la place fixe.** Le bouton principal de la séance ne bouge jamais : la rangée sous lui a une hauteur fixe, le compte à rebours le rend inerte sans le déplacer, et ce qui déborde défile dans la colonne de mission, pas autour du bouton.

## Elevation & Depth

Le système est hybride, d'abord tonal. La profondeur vient de l'empilement des tons (nuit : mur, puis rangée, tuile, tuile relevée, du plus sombre au plus clair ; jour : mur lavande sous des rangées et des tuiles blanches, et un second plan `day-tile2` qui s'enfonce au lieu de monter) et du voile qui fond l'œuvre dans le mur. Les ombres sont douces et réservées à ce qui flotte au-dessus du mur : vitrine, tiroir du guide, toast, et, sur le Mur en ligne, la tuile au point qui grandit. Le plateau d'outil de la séance est un verre léger posé sur l'œuvre : fond du mur à 72 %, flou de 6 px, filet de 1 px.

### Shadow Vocabulary
- **Portée de jour** (`box-shadow: 0 10px 30px rgba(27, 23, 51, .12)`) : vitrine, tiroir et toast en lumière de jour.
- **Portée de nuit** (`box-shadow: 0 12px 34px rgba(0, 0, 0, .5)`) : les mêmes la nuit.
- **Tuile au point** (`box-shadow: 0 16px 36px rgba(0, 0, 0, .55)`, avec un agrandissement à 104 %) : tuile survolée ou au point dans un rail du Mur en ligne.
- **Anneau or** (`box-shadow: 0 0 0 1px #FFD166`, en plus de la bordure or de 2 px) : tuile de la mission au point.

### Named Rules
**La règle du voile.** Une œuvre ne passe jamais sous le texte à pleine force : elle occupe la droite (un bandeau en haut sur téléphone) et un dégradé de la couleur exacte du mur (`--fade`) la fond vers le texte. Le crédit de l'œuvre est posé sur l'œuvre.

## Shapes

Coins doux partout, avec un rayon qui grandit avec la taille de l'élément : 4 px pour les barres, 6 px pour les touches clavier, 10 px pour les petits boutons et les onglets, 12 px pour les boutons et les cartes de morceaux, 14 à 16 px pour les tuiles et la carte « Mission suivante », 18 px pour le plateau d'outil, 24 px pour la vitrine. Les ronds servent aux boutons-icônes (44 px), aux pastilles ✓, au tampon de validation (160 px), aux temps du métronome (14 px) et aux notes des schémas de manche. Les tuiles portent une bordure de 2 px, les boutons et panneaux une bordure de 1 px. Les touches clavier imitent une vraie touche : bordure de 1 px, épaissie à 3 px en bas. Les cartes de morceaux gardent le ratio 5:7,4 avec leur cadre de rareté de 3 px ; l'œuvre y est recadrée en couverture.

## Components

### Buttons
Francs et tactiles : on les vise sans regarder, guitare en main.
- **Shape :** coins de 12 px (`rounded.md`) et 48 px de haut ; grand bouton de 64 px à coins de 16 px ; petit bouton de 40 px à coins de 10 px ; bouton-icône rond de 44 px.
- **Primary :** aplat `gold`, texte `on-gold` en Archivo 900 largeur 125 % (Action en grand), bordure de 1 px or. Un seul par écran.
- **Hover / Focus :** pression à 97 % au clic (140 ms, sortie exponentielle) ; au survol, la bordure du bouton or passe en `on-gold` et celle d'un bouton secondaire en `muted` ; focus : anneau de 3 px en `focus` (or la nuit, violet le jour), décalé de 3 px, qui suit les coins du bouton.
- **Secondaire :** aplat `tile`, texte `ink` en Inter 700, filet de 1 px.
- **Pressé (bascule, `aria-pressed="true"`) :** aplat `ink`, texte couleur du mur (métronome en marche, mode sombre actif).
- **Inerte :** 40 % d'opacité, sans pointeur, à la même place.
- **Touches :** chaque bouton de séance montre la touche qui le déclenche (Entrée, Espace, Échap, G, M, Ctrl Z) : 24 px de haut, au moins 26 px de large, Keycap, aplat `tile`, bordure de 1 px épaissie à 3 px en bas. Sur l'or ou sur un bouton pressé, la touche devient transparente et prend la couleur du texte. Masquées sur téléphone.

### Chips
- **Style :** filtres de la collection du Mur en ligne : pilule de 40 px, Inter 700 0.88rem en `muted` sur `tile`, bordure de 2 px `line`.
- **State :** survol, texte en `ink` ; choisi (`aria-pressed="true"`), aplat `ink` et texte couleur du mur.

### Cards / Containers
- **Vitrine :** coins de 24 px, fond `row` (blanc le jour), portée douce, sans bordure, 380 px de haut au moins, marges de 40 px sur 44 px. Dans l'ordre : titre Display, ligne de repères, consigne, actions (un bouton or, puis des secondaires), une note en `muted`, et le crédit de l'œuvre en bas à droite, sur une pastille (blanc sur noir à 62 % à l'Accueil, encre sur le fond à 82 % en séance) pour rester lisible quelle que soit la zone du tableau.
- **Tuile de mission :** coins de 16 px, fond `tile`, bordure de 2 px `line`, marges de 16 px, 160 px de haut au moins ; emoji de branche de 32 px en haut, titre et sous-titre (branche · durée) en bas. Survol : monte de 3 px, bordure `muted` (200 ms). Au point : bordure or et anneau or. Faite : fond `tile2`, pastille ✓ de 26 px en haut à droite, texte à pleine opacité, inerte. Verrouillée (booster) : inerte.
- **Tuile du Mur en ligne :** même tuile en bouton, lien ou bloc, 236 px de large et 14 px de coins. Au survol ou au point, elle grandit à 104 % avec la portée « tuile au point », ses voisines passent à 70 % et les autres rangées à 55 % ; sa description, cachée au repos, apparaît.
- **Plateau d'outil :** coins de 18 px, verre sur l'œuvre (fond du mur à 72 %, flou de 6 px), filet de 1 px, marges de 14 px, 640 px au plus. Il porte l'outil déjà prêt : tempo et métronome, schéma de gamme et écoute, étapes d'oreille, bourdon d'impro.
- **Shadow Strategy :** voir Elevation & Depth ; les tuiles sont à plat au repos.

### Navigation
- **Barre du haut :** marque (emoji guitare de 28 px et « Gratte Quest » en Archivo 900 largeur 125 % 1.15rem), onglets en Inter 600 (marges de 10 px sur 12 px, coins de 10 px), bouton lune rond à droite, pressé la nuit. Onglet actif : aplat `ink`, texte couleur du mur ; survol : `tile2`. Sur téléphone, les onglets passent sur une seconde ligne défilante.
- **Barre de séance :** « Séance du jour » en Archivo 900 1.05rem, quatre segments de progression (420 px au plus), « Mission i sur 4 » en `muted`, bouton lune, « Quitter » avec sa touche Échap. Sur téléphone, le titre disparaît et les segments passent sur toute la largeur.

### Cartes de morceaux
Les cartes à collectionner du Mur en ligne, construites sur fond de nuit seulement.
- 150 px de large (128 px sur téléphone), ratio 5:7,4, coins de 12 px, cadre de rareté de 3 px, œuvre en couverture sous un voile qui monte du bas (presque noir à 10 %, transparent à 58 %).
- Légende en bas : titre en Archivo 900 0.88rem blanc, puis artiste et état en Inter 600 0.74rem.
- Drapeau en haut à gauche pour les boss (« Boss final », « Mini-boss », « Boss ») : Inter 800 0.7rem en capitales, blanc sur rouge `#C7321F`, coins de 5 px.
- Pas encore acquise : œuvre en niveaux de gris à 60 %, cadre `rarity-locked`. Sans œuvre : le titre s'affiche en affiche, Archivo 900 largeur 125 % en capitales.

### Séance plein écran
La pièce maîtresse : la vitrine portée en plein écran.
- **Chrono :** Numeral, suivi du bouton Pause (Espace) et de son état ; temps dépassé en `bad`, avec « Temps écoulé : valide quand tu as fini ».
- **Carte « Mission suivante » :** coins de 16 px, fond `tile2`, bordure or de 2 px, marges de 14 px sur 18 px. Titre d'abord (1.35rem), puis une barre de 8 px qui se remplit d'or en 3 s à vitesse constante, sa légende (« Mission suivante dans 3 s ») et deux boutons : « Lancer » (petit bouton or, Entrée) et « Attendre » (Espace). Hors compte à rebours, elle annonce simplement la mission suivante.
- **Tampon ✓ :** rond de 160 px en `ok` au centre de l'écran, coche épaisse ; il apparaît en 0,9 s (60 %, 106 %, 100 %, puis fondu).
- **Toast d'annulation :** en haut à droite sur l'œuvre (32 px du bord, 76 px du haut), aplat `ink` et texte couleur du mur, coins de 14 px, Inter 700 : « Mission validée · +25 XP » et un bouton « Annuler » (Ctrl Z) bordé de la couleur du texte ; il reste 6 s.
- **Tiroir du guide :** glisse depuis la droite par-dessus l'œuvre (min(440px, 92vw), 380 ms), fond `row`, filet de 1 px à gauche, portée douce ; le chrono reste visible à gauche. Les erreurs à éviter sont des blocs `tile2` à coins de 12 px, « À éviter » en `bad`.
- **Changement de mission :** la mission sort vers la gauche (28 px, 260 ms) et la suivante entre depuis la droite (36 px, 500 ms) ; entre l'accueil et la séance, l'œuvre et le titre passent par une transition de vue partagée (`view-transition-name: art` et `title`).
- **Récapitulatif :** « Séance terminée » en Display de scène, trois chiffres en Stat (temps joué, XP, série), bouton or « Ouvrir le booster du jour » ; dans la rangée du bas, la carte du boss (fond `tile`, coins de 16 px) avec sa barre de PV de 12 px en `root`, qui encaisse une secousse de 600 ms.

### Barres de progression
- **Segments de séance :** 8 px, coins de 4 px, piste `tile2`, remplissage à la couleur de la branche par mise à l'échelle horizontale (600 ms) ; le segment en cours avance avec le temps écoulé.
- **Compte à rebours :** 8 px, piste `line`, remplissage or.
- **Mur en ligne :** 6 px (10 px en grand), piste sombre, remplissage or ; boosters, boss, trophées, expérience.

## Do's and Don'ts

### Do:
- **Réserver** l'or à une seule action active par écran, à la mission au point et au compte à rebours, toujours avec du texte `on-gold` dessus.
- **Construire** chaque écran en vitrine puis rangées, l'œuvre à droite (en bandeau en haut sur téléphone), fondue vers le texte par un voile de la couleur du mur.
- **Écrire** les titres, les titres de tuile et les chiffres en Archivo largeur 125 % graisse 900, tout le reste en Inter.
- **Vérifier** chaque composant dans les deux lumières : seules les valeurs des jetons changent, jamais la mise en page.
- **Garder** le bouton principal de la séance à une place fixe et la rangée « À suivre » à hauteur fixe (188 px, 142 px sur écran bas).
- **Prendre** les œuvres dans le domaine public de Wikimedia Commons (`SONGS[].art`, `ART_PATH`), les demander sans référent et afficher leur crédit sur l'œuvre.
- **Montrer** les raccourcis de la séance en touches dans les boutons (Entrée, Espace, Échap, G, M), et les masquer sur téléphone.
- **Animer** en sortie exponentielle (`cubic-bezier(.16, 1, .3, 1)`), de 140 à 600 ms (0,9 s pour le tampon ✓, 3 s à vitesse constante pour le compte à rebours), et couper toutes les durées sous `prefers-reduced-motion` (la barre du compte à rebours s'affiche alors pleine).
- **Utiliser** les emoji Fluent en SVG de `assets/emoji` (20 à 32 px, texte alternatif vide) et, pour les icônes de trait, des SVG inline en `currentColor`.

### Don't:
- **Ne pas** poser de fenêtre modale sur le Mur pour pratiquer : la séance passe en plein écran, le guide en tiroir latéral, et le chrono reste visible.
- **Ne pas** empiler des panneaux façon tableau de bord.
- **Ne pas** laisser l'or porter seul un texte, un trait ou un état sur un fond de jour (1,3:1 sur `day-wall`, sous le 3:1 requis) : le jour, l'or est un aplat sous un texte `on-gold`, le focus est violet, et un trait or y double toujours un repère lisible (texte, encre ou violet).
- **Ne pas** teinter les surfaces avec les couleurs de branche : elles ne servent qu'aux segments de la barre de séance.
- **Ne pas** placer de surtitre au-dessus d'un titre : le titre d'abord, la ligne de repères dessous.
- **Ne pas** afficher d'emoji en caractères du système.
- **Ne pas** charger de police, de feuille de style, de script ou d'image venant d'un autre domaine que le site et `upload.wikimedia.org`.
