# Gratte Quest

Journal de progression guitare électrique sous forme de jeu : missions du jour (30 min), paliers, cartes à collectionner, trophées et boss final.

## Utiliser

- En ligne : https://mathx007.github.io/siteguitare/ (une fois GitHub Pages activé).
- Installable comme une application : dans Chrome ou Edge, icône « Installer » dans la barre d'adresse ; sur téléphone, « Ajouter à l'écran d'accueil ».
- Le micro (accordeur, contrôle des gammes, réponses du jeu d'oreille) fonctionne sur PC et téléphone, car le site est servi en https.

## Règles principales

- Session du jour : 4 missions (vitesse, gammes, oreille, morceau ou impro). 3 missions valident le jour, les 4 ouvrent un booster. Un jour manqué par semaine ne casse pas la série.
- Cartes de morceaux : 3 étapes, puis 3 passages en entier à 100 % du tempo, 2 au maximum par jour. La carte reste grisée jusqu'au troisième passage. La rareté dépend de la difficulté.
- Boss : THE ONE de BABYMETAL. Paliers, mini-boss et étapes du boss lui retirent des PV ; acquérir sa carte le bat. Récompenses : bannière, carte alt-mythique, choix du boss suivant.

## Développement

Site statique, sans étape de compilation. Tests de la logique :

```
node --test test/core.test.js test/data.test.js
```

Fichiers : `index.html`, `app.css`, `js/core.js` (logique pure), `js/data.js` (contenu), `js/audio.js` (son), `js/cloud.js` (compte et sauvegarde Supabase), `js/app.js` (interface), `sw.js` (hors ligne).

Crédits et licences : voir `LICENSES.md`.
