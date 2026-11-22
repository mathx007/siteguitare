# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Guitaristes électriques autodidactes qui veulent progresser chaque jour, ouvert à tous. Le premier utilisateur est l'auteur du site. Usage principal confirmé : sur l'écran du PC, guitare en main (carte son Focusrite branchée), en cliquant entre deux exercices ; le téléphone sert en complément.

## Product Purpose

Gratte Quest transforme 30 minutes de pratique quotidienne en jeu : une session du jour de 4 missions (vitesse, gammes, oreille, morceau ou impro), des paliers de compétences, des cartes de morceaux à collectionner, des trophées, un booster quotidien et un boss à battre. Le succès : on revient chaque jour, on pratique au lieu de naviguer, et on voit sa progression.

## Positioning

Un journal de progression guitare qui est un vrai jeu de collection : la progression technique (paliers, passages à 100 % du tempo) fait avancer la collection et fait perdre des PV au boss. Outils de musicien intégrés : métronome, accordeur et contrôle de gamme au micro, jeu d'oreille, manche interactif, sons de vraie guitare.

## Operating Context

- Séance d'environ 30 minutes, 6 jours sur 7, guitare dans les mains : chaque clic coûte, les mains sont prises.
- Gênes confirmées par l'utilisateur : trop de clics pour lancer, valider et enchaîner les missions ; transitions trop sèches entre écrans et fenêtres.
- Site statique sur GitHub Pages, installable (PWA, hors ligne), compte facultatif (Supabase, lien par e-mail) sinon tout reste sur l'appareil.

## Capabilities and Constraints

- Vues : Accueil, Paliers, Collection (morceaux, paliers, bonus), Trophées, Documentation (guides « Comment bien faire l'exo » et fiches de base), Progrès, Manche, Oreille ; fiches de morceaux ; ouverture de booster.
- HTML, CSS et JavaScript sans framework ni étape de compilation ; aucune ressource externe nouvelle (pas de CDN, pas de police distante) ; illustrations libres de Wikimedia Commons uniquement.
- Règles du jeu, textes et données enregistrées ne changent pas sans accord.
- Notation : Do Ré Mi dans le site, lettres anglo-saxonnes dans les blocs du manche de l'Accueil.

## Brand Commitments

- Nom « Gratte Quest », police Archivo (affichage, graisses 800-900, largeur 125 %) et Inter, hébergées sur le site.
- Univers visuel « Mur de cartes » (vitrine et rangées, œuvres du domaine public comme seuls grands champs de couleur, un seul accent or) dans les deux modes, clair et sombre : choix de l'utilisateur le 22 novembre 2026, qui remplace à terme l'esthétique claire « Kyara ». La séance du jour se joue en plein écran (validé après maquette) ; le mode clair passe au Mur sur l'Accueil, les autres pages claires restent en Kyara pour l'instant.

## Evidence on Hand

- 102 cartes de morceaux réelles avec œuvres du domaine public (`js/data.js`), paliers, trophées, bonus.
- Sons de guitare électrique en son clair (`assets/sounds/guitare-claire/`, CC BY 3.0).
- Aucun témoignage, chiffre d'audience ni avis d'utilisateur : rien de tel ne doit être inventé.

## Product Principles

1. Jouer plutôt que naviguer : chaque écran pousse vers la prochaine action de pratique.
2. Un geste par étape quand on a la guitare en main.
3. La progression se voit et se ressent : collection, boss, série.
4. Rien ne casse la séance : hors ligne, sans compte, sans attente.

## Accessibility & Inclusion

WCAG 2.1 AA (contrastes, clavier, lecteurs d'écran avec `aria-live`), respect de `prefers-reduced-motion`, aucun débordement horizontal à 390 px.
