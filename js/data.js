/* Gratte Quest : contenu du jeu. */
const BRANCHES = [
  { id: 'gam', name: 'Gammes', icon: 'world-map', color: '#0B7769', soft: '#D5F5EE', tag: 'Connaître le manche' },
  { id: 'vit', name: 'Vitesse', icon: 'high-voltage', color: '#C22B26', soft: '#FFE1DA', tag: 'Main droite, métronome' },
  { id: 'imp', name: 'Impro', icon: 'game-die', color: '#926019', soft: '#FFEFBF', tag: 'Inventer en jouant' },
  { id: 'ore', name: 'Oreille', icon: 'ear', color: '#1F60D1', soft: '#DBE7FF', tag: 'Retrouver sans tablature' },
  { id: 'sol', name: 'Riffs et solos', icon: 'sign-of-the-horns', color: '#A93392', soft: '#F8DDF2', tag: 'Le jeu en notes seules' },
];

const PALIERS = {
  gam: [
    { id: 'g1', e: '🧱', t: 'Position 1 par cœur', d: 'Pentatonique mineure de La, case 5. Monte et descends sans regarder ta main gauche. Dis « La » à voix haute à chaque tonique.', test: '4 allers-retours sans faute à 60 bpm, en croches.', fb: ['pentaMin', 9, [0]] },
    { id: 'g2', e: '🧗', t: 'Positions 2 et 3', d: 'Mêmes notes, plus haut sur le manche. Apprends une position à la fois, puis enchaîne-les.', test: 'Chaque position : 4 allers-retours sans faute à 60 bpm.', fb: ['pentaMin', 9, [1, 2]] },
    { id: 'g3', e: '🏔️', t: 'Positions 4 et 5', d: 'Les deux dernières pièces du puzzle. La position 5 se rejoue aussi en bas du manche, cases 2 à 5.', test: 'Chaque position : 4 allers-retours sans faute à 60 bpm.', fb: ['pentaMin', 9, [3, 4]] },
    { id: 'g4', e: '🌉', t: 'Les ponts', d: 'Les notes bicolores du manche appartiennent à deux positions voisines : ce sont tes ponts. Passe d\'une position à l\'autre par un glissé, sur chaque paire.', test: 'Traverse le manche de la case 5 à la case 17 et reviens, sans t\'arrêter, à 60 bpm.', fb: ['pentaMin', 9, [0, 1]] },
    { id: 'g5', e: '🧭', t: 'Toutes les tonalités', d: 'Le dessin ne change jamais, seule la case de départ change. Repère la tonique sur la corde de Mi grave, pose la position 1 dessus.', test: 'Lance le dé des tonalités 5 fois : position 1 trouvée en moins de 5 secondes à chaque fois.', fb: ['pentaMin', 4, [0]] },
    { id: 'g6', e: '🔑', t: 'Mineure naturelle et majeure', d: 'Ajoute 2 notes à la penta de La mineur (Si et Fa) : tu obtiens La mineur naturel. Les mêmes notes en partant de Do donnent Do majeur.', test: 'La mineur naturel sur 2 zones reliées, puis Do majeur au même endroit, sans hésiter.', fb: ['minNat', 9, [0]] },
    { id: 'g7', e: '💙', t: 'Blue note et penta majeure', d: 'La blue note ajoute une note de tension à la penta. La penta majeure reprend les mêmes dessins, décalés de 3 cases vers le bas.', test: 'Gamme blues de La sur 2 positions, puis penta majeure de La, position 1.', fb: ['blues', 9, [0]] },
    { id: 'g8', e: '🧙', t: 'Dorien et mineur harmonique', d: 'Deux couleurs à une note de la mineure naturelle : le dorien (sixte majeure, plus lumineux) et le mineur harmonique (septième majeure, plus dramatique).', test: 'Joue les deux en La, zone 1, et nomme la note qui change par rapport à La mineur naturel.', fb: ['dorian', 9, [0]] },
  ],
  vit: [
    { id: 'v1', e: '🕷️', t: 'L\'araignée propre', d: 'Cases 1-2-3-4 sur chaque corde, un doigt par case, aller-retour strict du médiator. La propreté avant le tempo.', test: 'Doubles croches à 70 bpm pendant 1 minute, chaque note audible.' },
    { id: 'v2', e: '🐝', t: 'Trémolo endurant', d: 'Une seule note en doubles croches. Petit mouvement du poignet, médiator qui dépasse peu, épaule relâchée.', test: 'Trémolo en doubles croches à 100 bpm pendant 30 secondes, sans crispation.' },
    { id: 'v3', e: '🏃', t: 'Penta en doubles croches', d: 'Position 1, montée et descente, en aller-retour strict. Le changement de corde est le vrai obstacle.', test: 'Position 1 en doubles croches à 90 bpm, 2 allers-retours sans accroc.' },
    { id: 'v4', e: '🌪️', t: 'Trémolo de combat', d: 'Même geste, plus vite, et en changeant de note à la main gauche toutes les mesures.', test: 'Trémolo à 130 bpm en doubles croches, 4 mesures par note, 4 notes de suite.' },
    { id: 'v5', e: '🧬', t: 'Séquences par 3', d: 'Dans la penta : notes 1-2-3, puis 2-3-4, puis 3-4-5. Le motif qui donne l\'impression de vitesse dans les solos.', test: 'Séquences par 3 sur la position 1, montée et descente, à 110 bpm en doubles croches.' },
    { id: 'v6', e: '🚀', t: 'Vitesse de croisière', d: 'Trémolo, changements de corde et séquences au même tempo. C\'est le niveau qu\'il faut pour les mélodies rapides.', test: 'Trémolo à 150 bpm pendant 20 secondes, puis penta en doubles croches à 120 bpm.' },
  ],
  imp: [
    { id: 'i1', e: '🎯', t: 'Trois notes, pas une de plus', d: 'Sur la boucle en La mineur, improvise avec seulement La, Do et Ré. Le rythme fait tout le travail.', test: '2 minutes sans sortir des 3 notes et sans t\'arrêter.' },
    { id: 'i2', e: '💬', t: 'Question, réponse', d: 'Une phrase de 2 mesures, puis 2 mesures de silence. La deuxième phrase répond à la première.', test: '8 phrases d\'affilée, chacune terminée avant le silence.' },
    { id: 'i3', e: '🛬', t: 'Atterrir sur la tonique', d: 'Termine chaque phrase sur un La, tenu, avec du vibrato. Une phrase qui finit bien pardonne tout le reste.', test: '10 phrases de suite qui finissent sur la tonique.' },
    { id: 'i4', e: '😭', t: 'Faire pleurer la note', d: 'Place des bends d\'un ton et du vibrato dans tes phrases. Vérifie la justesse à l\'oreille ou avec l\'accordeur de la version PC.', test: '8 bends justes sur 10, au milieu d\'une impro.' },
    { id: 'i5', e: '🧳', t: 'Voyager sur le manche', d: 'Improvise en changeant de position au milieu d\'une phrase, en passant par les ponts.', test: '1 minute d\'impro avec au moins 6 changements de position, sans fausse note.' },
    { id: 'i6', e: '✍️', t: 'Ton premier solo composé', d: '16 mesures : un début calme, une montée, une fin. Enregistre-le dans Ableton pour pouvoir le réécouter.', test: 'Tu le rejoues deux fois de suite à l\'identique.' },
  ],
  ore: [
    { id: 'o1', e: '🔔', t: 'Note mystère', d: 'Le jeu installe un bourdon de La, puis joue une note de la penta. Chante-la, puis retrouve-la sur le manche.', test: '10 bonnes réponses d\'affilée au jeu « Note mystère », niveau penta.' },
    { id: 'o2', e: '📏', t: 'Intervalles de base', d: 'Tierce mineure, tierce majeure, quinte, octave, joués depuis la tonique sur un bourdon. Chante la deuxième note avant de répondre.', test: '10 bonnes réponses d\'affilée au jeu « Intervalles », niveau 1.' },
    { id: 'o3', e: '🧩', t: 'Tous les intervalles', d: 'Les 12 intervalles depuis la tonique, toujours sur un bourdon. Repère comment chaque note sonne dans la tonalité, stable ou tendue.', test: '8 bonnes réponses d\'affilée au jeu « Intervalles », niveau 2.' },
    { id: 'o4', e: '🎶', t: 'Mélodies de 4 notes', d: 'Le jeu joue une courte phrase dans la penta. Chante-la d\'abord, puis cherche-la.', test: '8 mélodies de 4 notes sur 10 rejouées juste.' },
    { id: 'o5', e: '🧝', t: 'Un thème entier, sans tablature', d: 'Choisis un thème de Zelda dans tes cartes. Écoute l\'original par petits bouts et retrouve-le note par note.', test: 'Thème complet joué de mémoire, sans avoir regardé de tab.' },
    { id: 'o6', e: '🕵️', t: 'Le riff volé', d: 'Retrouve à l\'oreille le riff principal d\'un morceau rock de ta collection, puis sa tonalité.', test: 'Comparaison avec la tab après coup : moins de 2 notes d\'écart.' },
  ],
  sol: [
    { id: 's1', e: '🔨', t: 'Hammer-on et pull-off', d: 'Le doigt frappe la corde comme un marteau, puis l\'arrache en repartant. Les deux notes doivent sonner au même volume.', test: 'Trille cases 5-7 sur chaque corde pendant 15 secondes, régulier.' },
    { id: 's2', e: '🏹', t: 'Glissés et bends justes', d: 'Bend d\'un ton case 7, corde de Sol : tu dois atteindre exactement le son de la case 9. Pousse avec trois doigts.', test: '8 bends justes sur 10 (accordeur de la version PC ou comparaison à l\'oreille).' },
    { id: 's3', e: '〰️', t: 'Un vibrato qui chante', d: 'Mouvement régulier du poignet, pas des doigts. Lent et large vaut mieux que rapide et nerveux.', test: 'Note tenue 4 temps avec un vibrato régulier, sur 3 cordes différentes.' },
    { id: 's4', e: '🤚', t: 'Palm mute et attaque', d: 'Tranche de la main droite posée sur le chevalet. Le son doit être étouffé mais la note reconnaissable.', test: 'Un riff en croches palm mute à 120 bpm pendant 1 minute, sans corde parasite.' },
    { id: 's5', e: '🐍', t: 'Legato longue distance', d: 'Enchaîne hammer-on et pull-off en n\'attaquant que la première note de chaque corde.', test: 'Une phrase de 12 notes, fluide, avec une seule attaque par corde.' },
    { id: 's6', e: '👆', t: 'Tapping d\'initiation', d: 'L\'index de la main droite vient frapper une case en hauteur, puis relâche vers la main gauche.', test: 'Un motif de tapping à 3 notes, 30 secondes en boucle, calé sur le métronome.' },
  ],
};

/* Exercices de vitesse (le tempo propre atteint est enregistré par exercice). */
const EXOS = {
  trem: { t: 'Trémolo sur une corde', fun: 'Opération Colibri', d: 'Corde de Sol, case 9, en doubles croches. 2 séries de 45 s au tempo propre, puis 3 pointes de 5 s à +20 bpm. Poignet souple, petit mouvement.' },
  penta16: { t: 'Penta en doubles croches', fun: 'Ascenseur express', d: 'Position du moment, montée et descente sans pause, aller-retour strict. 2 passages au tempo propre, puis 2 pointes à +15 bpm.' },
  seq3: { t: 'Séquences par 3', fun: 'Trois petits pas', d: 'Dans la penta : notes 1-2-3, puis 2-3-4, puis 3-4-5, jusqu\'en haut, et retour. Tempo propre, puis une pointe à +15 bpm.' },
  saut: { t: 'Saut de cordes', fun: 'Saute-mouton', d: 'Penta position 1 en sautant une corde : 6 puis 4, 5 puis 3, 4 puis 2, 3 puis 1. Le changement de corde est le vrai travail.' },
  legato: { t: 'Legato', fun: 'Main droite en vacances', d: 'Hammer-on et pull-off sur chaque corde de la position 1, une seule attaque par corde. Les notes liées doivent sonner aussi fort que l\'attaque.' },
  araignee: { t: 'L\'araignée', fun: 'L\'araignée fait sa gym', d: 'Cases 1-2-3-4 sur chaque corde, un doigt par case, aller-retour strict. Échauffement court, pas plus de 3 minutes.' },
};
const EXO_ROTATION = ['trem', 'penta16', 'trem', 'seq3', 'saut', 'trem', 'legato', 'araignee'];

/* Pourquoi chaque mission : une ligne, sans promesse exagérée. */
const WHY = {
  vit: 'Tempo propre d\'abord, puis de courtes pointes plus rapides : alterner les deux fait monter la vitesse sans sacrifier la précision.',
  gam: 'Une position par jour, reliée à la précédente : c\'est ce lien entre positions qui te manque pour circuler sur tout le manche.',
  oreJeu: 'Les notes sont jouées dans une tonalité, sur un bourdon : c\'est ainsi que l\'oreille les entend dans la vraie musique. Chanter avant de répondre ancre le son.',
  oreSong: 'Retrouver un vrai morceau est l\'exercice le plus direct pour ton objectif : rejouer ce que tu entends.',
  song: 'Boucler le passage difficile au ralenti puis accélérer par petits paliers : plus efficace que rejouer tout le morceau en boucle.',
  imp: 'Une seule contrainte à la fois oblige à inventer au lieu de répéter tes plans habituels.',
};

const IMPRO_POOL = [
  ['Trois notes seulement : La, Do, Ré. Varie le rythme, pas les notes.', 'Une seule corde (celle de Sol). Monte et descends, glisse entre les notes.', 'Deux notes maximum par mesure. Laisse respirer.'],
  ['Question, réponse : 2 mesures jouées, 2 mesures de silence.', 'Répète ta première phrase 3 fois, puis change seulement la fin.', 'Commence chaque phrase sur le temps 2, jamais sur le 1.'],
  ['Chaque phrase finit sur un La tenu avec vibrato.', 'Phrase courte, phrase courte, phrase longue. Recommence.', 'Finis une phrase sur deux par un glissé vers la tonique.'],
  ['Un bend d\'un ton dans chaque phrase, tenu au moins un temps.', 'Joue tout doucement pendant 8 mesures, puis fort pendant 8.', 'Alterne une phrase aiguë et une phrase grave.'],
  ['Change de position au milieu de chaque phrase.', 'Démarre en position 1, termine en position 3, sans coupure.', 'Impro uniquement entre les cases 9 et 15.'],
  ['Construis 16 mesures : calme, montée, sommet, retombée.', 'Impro libre, mais enregistre-toi et note un passage à garder.', 'Reprends un plan d\'un solo que tu aimes et transforme-le.'],
];

const STEPS_SONG = ['Riff ou thème principal', 'Toutes les parties, tempo lent', 'Passage difficile ou solo'];
const STEPS_EAR = ['Début retrouvé à l\'oreille', 'Thème entier à l\'oreille', 'Joué de mémoire, au tempo'];
const PASSES_NEEDED = 3;
const PASSES_PER_DAY = 2;
const RARITY = { C: 'Commune', R: 'Rare', E: 'Épique', L: 'Légendaire', M: 'Mythique' };

/* Morceaux. r = rareté (difficulté). art = œuvre du domaine public sur Wikimedia Commons. */
const SONGS = [
  { id: 'theone', t: 'THE ONE', a: 'BABYMETAL', r: 'M', boss: 'final', why: 'Le boss final. Le thème d\'ouverture est réputé délicat. Vérifie l\'accordage sur la tablature avant de te lancer : avec ton sillet bloquant, un changement d\'accordage demande un réglage.', art: ['Hiroshige-100-views-of-edo-fox-fires.jpg', 'Utagawa Hiroshige, Feux de renards du nouvel an, 1857', 'Domaine public'] },
  { id: 'hysteria', t: 'Hysteria', a: 'Muse', r: 'L', boss: 'mini', why: 'Mini-boss. Tu galères sur le solo : découpe-le en phrases de 2 mesures et travaille-les à 60 % du tempo.', art: ['Edvard Munch, 1893, The Scream, oil, tempera and pastel on cardboard, 91 x 73 cm, National Gallery of Norway.jpg', 'Edvard Munch, Le Cri, 1893', 'Domaine public'] },
  { id: 'cydonia', t: 'Knights of Cydonia', a: 'Muse', r: 'L', boss: 'mini', why: 'Mini-boss. Mélodies en trémolo picking : l\'application directe de ta branche Vitesse.', art: ['Albrecht Dürer, Knight, Death and Devil, 1513, NGA 6637.jpg', 'Albrecht Dürer, Le Chevalier, la Mort et le Diable, 1513', 'CC0'] },
  { id: 'newborn', t: 'New Born', a: 'Muse', r: 'E', boss: 'mini', why: 'Mini-boss. Riff nerveux et solo à effet de hauteur : ta pédale d\'expression Zoom va servir.', art: ['The Ancient of Days (Blake, Research Issues).jpg', 'William Blake, L\'Ancien des jours', 'Domaine public'] },
  { id: 'plugin', t: 'Plug In Baby', a: 'Muse', r: 'E', why: 'Un riff d\'intro devenu un classique. Très bon pour l\'agilité de la main gauche.', art: ["Plate 43 from 'Los Caprichos'- The sleep of reason produces monsters (El sueño de la razon produce monstruos) MET DP816991.jpg", 'Francisco de Goya, Le sommeil de la raison engendre des monstres, 1799', 'CC0'] },
  { id: 'sweet', t: 'Sweet Child O\' Mine', a: 'Guns N\' Roses', r: 'E', why: 'Intro en arpèges mélodiques et solos qui chantent. Rien de répétitif.', art: ['Rosa centifolia Burgundiaca.jpg', 'Pierre-Joseph Redouté, Les Roses (1817-1824)', 'Domaine public'] },
  { id: 'stairway', t: 'Stairway to Heaven', a: 'Led Zeppelin', r: 'E', why: 'Le solo repose surtout sur la penta de La mineur : parfait pour relier tes positions.', art: ["021.Jacob's Dream.jpg", 'Gustave Doré, Le Songe de Jacob, 1866', 'Domaine public'] },
  { id: 'comfortably', t: 'Comfortably Numb', a: 'Pink Floyd', r: 'E', why: 'Solos lents : chaque bend doit être juste, il n\'y a nulle part où se cacher.', art: ['Vincent van Gogh - Starry Night - Google Art Project.jpg', 'Vincent van Gogh, La Nuit étoilée, 1889', 'Domaine public'] },
  { id: 'johnny', t: 'Johnny B. Goode', a: 'Chuck Berry', r: 'E', why: 'L\'intro dont la moitié des plans de rock descendent.', art: ['Johannes Vermeer - The Guitar Player (ca. 1672).jpg', 'Johannes Vermeer, La Joueuse de guitare, vers 1672', 'Domaine public'] },
  { id: 'thunder', t: 'Thunderstruck', a: 'AC/DC', r: 'E', why: 'Intro sur une seule corde : un test d\'endurance et de régularité.', art: ['Rainstorm Beneath the Summit by Hokusai (Shimane Art Museum).jpg', 'Katsushika Hokusai, Orage sous le sommet', 'Domaine public'] },
  { id: 'gerudo', t: 'Gerudo Valley', a: 'Zelda : Ocarina of Time', r: 'E', why: 'Mélodie rapide aux couleurs flamenco : un vrai défi de vitesse.', art: ['David Roberts - Triumphal Arch Crossing the Ravine Leading to Petra - 1927.109 - Cleveland Museum of Art.jpg', 'David Roberts, Arche au-dessus du ravin menant à Pétra', 'CC0'] },
  { id: 'still', t: 'I\'m Still Standing', a: 'Elton John', r: 'R', boss: 'mini', why: 'Mini-boss. Tu as déjà terminé le solo : valide les étapes, puis les 3 passages à 100 %.', art: ['Tsunami by hokusai 19th century.jpg', 'Katsushika Hokusai, La Grande Vague de Kanagawa, vers 1831', 'Domaine public'] },
  { id: 'skyfall', t: 'Skyfall, version rock', a: 'Adele, avec ton groupe', r: 'R', why: 'Ton projet de groupe : ta partie de guitare, de l\'entrée rock jusqu\'au final.', art: ['Caspar David Friedrich - Wanderer above the sea of fog.jpg', 'Caspar David Friedrich, Le Voyageur contemplant une mer de nuages, vers 1818', 'Domaine public'] },
  { id: 'nothing', t: 'Nothing Else Matters', a: 'Metallica', r: 'R', why: 'Solo court et expressif : idéal pour les bends et le vibrato.', art: ['La Tour - La Madeleine à la veilleuse dite La Madeleine Terff, vers 1642 - 1644, RF 1949 11.jpg', 'Georges de La Tour, La Madeleine à la veilleuse, vers 1642-1644', 'Domaine public'] },
  { id: 'slave', t: 'I Wanna Be Your Slave', a: 'Måneskin', r: 'R', why: 'Riff très direct, son saturé et attitude glam rock : idéal pour l\'attaque et le palm mute.', art: ["Giovanni Battista Piranesi - Le Carceri d'Invenzione - First Edition - 1750 - 01 - Metropolitan DP828185.jpg", 'Giovanni Battista Piranesi, Prisons imaginaires, 1750', 'CC0'] },
  { id: 'kissrose', t: 'Kiss from a Rose', a: 'Seal', r: 'R', why: 'Ballade en arpèges et accords enrichis, avec une mélodie très chantante : travaille la régularité de la main droite et le son clair.', art: ['Henri Fantin-Latour - Roses in a Vase - Google Art Project.jpg', 'Henri Fantin-Latour, Roses dans un vase', 'Domaine public'] },
  { id: 'backinblack', t: 'Back in Black', a: 'AC/DC', r: 'R', why: 'Riff d\'accords ponctué de plans de penta : l\'école du rock.', art: ['Whistler-Nocturne in black and gold.jpg', 'James McNeill Whistler, Nocturne en noir et or, 1875', 'Domaine public'] },
  { id: 'snow', t: 'Snow (Hey Oh)', a: 'Red Hot Chili Peppers', r: 'R', why: 'Répétitif mais hypnotique : un riff en arpèges qui muscle la régularité.', art: ['Pieter Bruegel the Elder - Hunters in the Snow (Winter) - Google Art Project.jpg', 'Pieter Bruegel l\'Ancien, Chasseurs dans la neige, 1565', 'Domaine public'] },
  { id: 'cantstop', t: 'Can\'t Stop', a: 'Red Hot Chili Peppers', r: 'R', why: 'Riff funk avec cordes étouffées : précision rythmique obligatoire.', art: ['Turner - Rain, Steam and Speed - National Gallery file.jpg', 'William Turner, Pluie, vapeur et vitesse, 1844', 'Domaine public'] },
  { id: 'lostwoods', t: 'Lost Woods', a: 'Zelda : Ocarina of Time', r: 'R', ear: true, why: 'Mélodie sautillante en notes rapprochées : très bonne pour l\'oreille.', art: ['Gustav Klimt - Beech Grove I - Google Art Project.jpg', 'Gustav Klimt, Hêtraie I, 1902', 'Domaine public'] },
  { id: 'botw', t: 'Thème principal', a: 'Zelda : Breath of the Wild', r: 'R', ear: true, why: 'Thème ample, pensé pour le piano : adapte-le en mélodie de guitare.', art: ['Katsushika Hokusai - Fine Wind, Clear Morning (Gaifū kaisei) - Google Art Project.jpg', 'Katsushika Hokusai, Le Fuji rouge, vers 1831', 'Domaine public'] },
  { id: 'supermassive', t: 'Supermassive Black Hole', a: 'Muse', r: 'C', why: 'Riff simple et groovy : une victoire rapide pour remplir la collection.', art: ['FlammarionWoodcut.jpg', 'Gravure dite de Flammarion, 1888', 'Domaine public'] },
  { id: 'seven', t: 'Seven Nation Army', a: 'The White Stripes', r: 'C', ear: true, why: 'Le riff à retrouver à l\'oreille en 5 minutes. Interdiction de regarder une tab.', art: ['San Romano Battle (Paolo Uccello, London) 01.jpg', 'Paolo Uccello, La Bataille de San Romano, vers 1438-1440', 'Domaine public'] },
  { id: 'doiwanna', t: 'Do I Wanna Know?', a: 'Arctic Monkeys', r: 'C', ear: true, why: 'Riff lent et lourd, répétitif mais beau. À retrouver à l\'oreille.', art: ['Yoshitoshi - 100 Aspects of the Moon - 4.jpg', 'Tsukioka Yoshitoshi, Cent aspects de la lune', 'Domaine public'] },
  { id: 'storms', t: 'Song of Storms', a: 'Zelda : Ocarina of Time', r: 'C', ear: true, why: 'Thème court qui tourne en boucle : le meilleur premier thème à retrouver à l\'oreille.', art: ['Hiroshige, Sudden shower over Shin-Ōhashi bridge and Atake, 1857.jpg', 'Utagawa Hiroshige, Averse soudaine sur le pont Shin-Ōhashi, 1857', 'Domaine public'] },
  { id: 'lullaby', t: 'Zelda\'s Lullaby', a: 'Zelda : Ocarina of Time', r: 'C', ear: true, why: 'Lente et belle : travaille le son, le vibrato et la tenue des notes.', art: ['John William Waterhouse - The Lady of Shalott - Google Art Project.jpg', 'John William Waterhouse, La Dame de Shalott, 1888', 'Domaine public'] },
];
const MINI_BOSSES = ['hysteria', 'newborn', 'cydonia', 'still'];
const FIRST_BOSS = 'theone';

const BONUS = [
  { id: 'b-palm', r: 1, e: '🤚', t: 'Palm Mute', d: 'Joue ton exercice de vitesse du jour entièrement en palm mute.' },
  { id: 'b-hammer', r: 1, e: '🔨', t: 'Hammer-on', d: 'Monte la position 1 en n\'attaquant que la première note de chaque corde.' },
  { id: 'b-pull', r: 1, e: '🪝', t: 'Pull-off', d: 'Descends la position 1 en pull-off uniquement.' },
  { id: 'b-slide', r: 1, e: '🛝', t: 'Glissé', d: 'Relie deux positions par un glissé sur chaque corde, l\'une après l\'autre.' },
  { id: 'b-power', r: 1, e: '💪', t: 'Power Chord', d: 'Invente un riff de 4 power chords et joue-le 8 fois sans t\'arrêter.' },
  { id: 'b-altern', r: 1, e: '↕️', t: 'Aller-retour', d: 'Une minute de croches sur une corde en fixant ta main droite : bas, haut, sans exception.' },
  { id: 'b-bend', r: 1, e: '🏹', t: 'Bend d\'un ton', d: 'Cinq bends d\'un ton justes d\'affilée, vérifiés à l\'oreille.' },
  { id: 'b-vib', r: 1, e: '〰️', t: 'Vibrato', d: 'Tiens une note 8 temps avec un vibrato lent et régulier.' },
  { id: 'b-ghost', r: 1, e: '👻', t: 'Notes fantômes', d: 'Ajoute des coups étouffés entre les notes d\'un riff que tu connais.' },
  { id: 'b-harm', r: 2, e: '✨', t: 'Harmonique naturelle', d: 'Fais sonner les harmoniques des cases 12, 7 et 5 sur les 6 cordes.' },
  { id: 'b-pinch', r: 2, e: '🐷', t: 'Harmonique sifflée', d: 'Fais couiner 3 notes de suite en saturation. Le pouce frôle la corde juste après le médiator.' },
  { id: 'b-dstop', r: 2, e: '👯', t: 'Double-stop', d: 'Improvise 1 minute en jouant toujours deux cordes voisines à la fois.' },
  { id: 'b-trem', r: 2, e: '🌪️', t: 'Trémolo picking', d: 'Joue une mélodie que tu connais entièrement en trémolo.' },
  { id: 'b-unison', r: 2, e: '🫂', t: 'Bend à l\'unisson', d: 'Corde de Si case 5 tenue, corde de Sol case 7 tirée d\'un ton : les deux notes doivent se fondre.' },
  { id: 'b-skip', r: 2, e: '🦘', t: 'Saut de cordes', d: 'Monte la position 2 en sautant une corde à chaque fois.' },
  { id: 'b-blue', r: 2, e: '💙', t: 'Blue note', d: 'Glisse la blue note dans 5 phrases d\'impro, sans jamais t\'arrêter dessus.' },
  { id: 'b-oct', r: 2, e: '🎯', t: 'Octaves', d: 'Joue une mélodie simple en octaves, cordes intermédiaires étouffées.' },
  { id: 'b-tap', r: 3, e: '👆', t: 'Tapping', d: 'Un motif de tapping sur la corde de Si, déplacé sur 3 positions.' },
  { id: 'b-dive', r: 3, e: '💣', t: 'Bombe en piqué', d: 'Règle un effet de hauteur sur ta pédale d\'expression et fais plonger la dernière note d\'un solo.' },
  { id: 'b-sweep', r: 3, e: '🧹', t: 'Balayage', d: 'Un arpège mineur sur 3 cordes en un seul mouvement de médiator, lentement, 20 fois.' },
  { id: 'b-hybrid', r: 3, e: '🦞', t: 'Hybrid picking', d: 'Médiator sur la corde grave, majeur sur la corde aiguë : joue un riff ainsi.' },
  { id: 'b-harmmin', r: 3, e: '🧛', t: 'Mineur harmonique', d: 'Improvise 2 minutes en La mineur harmonique. Insiste sur le Sol dièse.' },
  { id: 'b-blind', r: 4, e: '🙈', t: 'Les yeux fermés', d: 'Une position entière, montée et descente, dans 3 tonalités, sans regarder le manche.' },
  { id: 'b-marathon', r: 4, e: '🔥', t: 'Le Marathon', d: 'Atteins 30 jours de série. Cette carte se mérite deux fois.' },
  { id: 'b-film', r: 4, e: '🎥', t: 'Prise unique', d: 'Filme une minute d\'impro sans coupure, et regarde-la en entier.' },
];

const BONUS_RAR = ['', 'C', 'R', 'E', 'L'];
const DROP = [0, 60, 28, 10, 2];

const XP = { mission: 25, day: 50, palier: 120, step: 80, pass: 60, own: 150, ear: 3, dupe: 15, mic: 10, trophy: 50, boss: 500 };

/* Trophées. p(f) renvoie [valeur, objectif] à partir des faits calculés par l'app. */
const TIER = { bronze: { n: 'Bronze', c: '#EBC7A4' }, argent: { n: 'Argent', c: '#DDE2EC' }, or: { n: 'Or', c: '#FFE08A' } };
const TROPHIES = [
  { id: 't-premier', e: 'sparkles', tier: 'bronze', n: 'Premier pas', g: 'Terminer une session complète', p: (f) => [Math.min(1, f.fullDays), 1] },
  { id: 't-sang', e: 'crossed-swords', tier: 'argent', n: 'Premier sang', g: 'Battre un mini-boss (carte acquise)', p: (f) => [Math.min(1, f.miniOwned), 1] },
  { id: 't-semaine', e: 'spiral-calendar', tier: 'argent', n: 'Semaine pleine', g: '6 jours validés dans la même semaine', p: (f) => [Math.min(6, f.maxWeekOk), 6] },
  { id: 't-marathon', e: 'fire', tier: 'or', n: 'Marathon', g: '30 jours de série', p: (f) => [Math.min(30, f.bestStreak), 30] },
  { id: 't-carto', e: 'world-map', tier: 'argent', n: 'Cartographe', g: 'Valider les 5 positions de la penta (paliers 1 à 3 des gammes)', p: (f) => [f.pentaPaliers, 3] },
  { id: 't-ponts', e: 'bridge-at-night', tier: 'or', n: 'Bâtisseur de ponts', g: 'Valider le palier « Les ponts »', p: (f) => [f.ponts, 1] },
  { id: 't-colibri', e: 'high-voltage', tier: 'argent', n: 'Colibri', g: 'Trémolo propre à 130 bpm', p: (f) => [Math.min(130, f.tremMax), 130] },
  { id: 't-mur', e: 'rocket', tier: 'or', n: 'Mur du son', g: 'Trémolo propre à 150 bpm', p: (f) => [Math.min(150, f.tremMax), 150] },
  { id: 't-lynx', e: 'ear', tier: 'argent', n: 'Oreille de lynx', g: '10 bonnes réponses d\'affilée au jeu d\'oreille', p: (f) => [Math.min(10, f.earBest), 10] },
  { id: 't-detective', e: 'detective', tier: 'or', n: 'Détective', g: 'Retrouver un thème entier à l\'oreille (étape 2 d\'une carte oreille)', p: (f) => [Math.min(1, f.earSongs), 1] },
  { id: 't-sansfaute', e: 'bullseye', tier: 'bronze', n: 'Sans-faute', g: 'Contrôler une position au micro sans erreur', p: (f) => [Math.min(1, f.micClean), 1] },
  { id: 't-collec', e: 'card-file-box', tier: 'or', n: 'Collectionneur', g: 'Réunir 25 cartes (morceaux, paliers et bonus)', p: (f) => [Math.min(25, f.cards), 25] },
  { id: 't-boss', e: 'crown', tier: 'or', hidden: true, n: 'Tueur de boss', g: 'Vaincre THE ONE', p: (f) => [Math.min(1, f.defeated), 1] },
  { id: 't-insatiable', e: 'dragon-face', tier: 'or', hidden: true, n: 'Insatiable', g: 'Vaincre un deuxième boss', p: (f) => [Math.min(2, f.defeated), 2] },
];

const INTERVALS = [
  { st: 1, n: 'Seconde mineure' }, { st: 2, n: 'Seconde majeure' }, { st: 3, n: 'Tierce mineure' },
  { st: 4, n: 'Tierce majeure' }, { st: 5, n: 'Quarte' }, { st: 6, n: 'Triton' }, { st: 7, n: 'Quinte' },
  { st: 8, n: 'Sixte mineure' }, { st: 9, n: 'Sixte majeure' }, { st: 10, n: 'Septième mineure' },
  { st: 11, n: 'Septième majeure' }, { st: 12, n: 'Octave' },
];

const Data = { BRANCHES, PALIERS, EXOS, EXO_ROTATION, WHY, IMPRO_POOL, STEPS_SONG, STEPS_EAR, PASSES_NEEDED, PASSES_PER_DAY, RARITY, SONGS, MINI_BOSSES, FIRST_BOSS, BONUS, BONUS_RAR, DROP, XP, TIER, TROPHIES, INTERVALS };
if (typeof module !== 'undefined' && module.exports) module.exports = Data;

/* Dossier Wikimedia de chaque illustration (2 premiers caractères du MD5 du nom de fichier) : permet de charger
   la miniature directement sur upload.wikimedia.org, sans cookie (crossorigin="anonymous"). Vérifié par test/data.test.js. */
const ART_PATH = {
  "Hiroshige-100-views-of-edo-fox-fires.jpg": "8/8a",
  "Edvard Munch, 1893, The Scream, oil, tempera and pastel on cardboard, 91 x 73 cm, National Gallery of Norway.jpg": "c/c5",
  "Albrecht Dürer, Knight, Death and Devil, 1513, NGA 6637.jpg": "0/0a",
  "The Ancient of Days (Blake, Research Issues).jpg": "1/1b",
  "Plate 43 from 'Los Caprichos'- The sleep of reason produces monsters (El sueño de la razon produce monstruos) MET DP816991.jpg": "2/21",
  "Rosa centifolia Burgundiaca.jpg": "3/30",
  "021.Jacob's Dream.jpg": "1/14",
  "Vincent van Gogh - Starry Night - Google Art Project.jpg": "0/01",
  "Johannes Vermeer - The Guitar Player (ca. 1672).jpg": "a/ad",
  "Rainstorm Beneath the Summit by Hokusai (Shimane Art Museum).jpg": "8/89",
  "David Roberts - Triumphal Arch Crossing the Ravine Leading to Petra - 1927.109 - Cleveland Museum of Art.jpg": "2/23",
  "Tsunami by hokusai 19th century.jpg": "a/a5",
  "Caspar David Friedrich - Wanderer above the sea of fog.jpg": "b/b9",
  "La Tour - La Madeleine à la veilleuse dite La Madeleine Terff, vers 1642 - 1644, RF 1949 11.jpg": "6/69",
  "Giovanni Battista Piranesi - Le Carceri d'Invenzione - First Edition - 1750 - 01 - Metropolitan DP828185.jpg": "3/39",
  "Henri Fantin-Latour - Roses in a Vase - Google Art Project.jpg": "a/a2",
  "Whistler-Nocturne in black and gold.jpg": "b/b1",
  "Pieter Bruegel the Elder - Hunters in the Snow (Winter) - Google Art Project.jpg": "d/d8",
  "Turner - Rain, Steam and Speed - National Gallery file.jpg": "9/96",
  "Gustav Klimt - Beech Grove I - Google Art Project.jpg": "a/a3",
  "Katsushika Hokusai - Fine Wind, Clear Morning (Gaifū kaisei) - Google Art Project.jpg": "2/25",
  "FlammarionWoodcut.jpg": "d/dd",
  "San Romano Battle (Paolo Uccello, London) 01.jpg": "9/98",
  "Yoshitoshi - 100 Aspects of the Moon - 4.jpg": "0/08",
  "Hiroshige, Sudden shower over Shin-Ōhashi bridge and Atake, 1857.jpg": "7/72",
  "John William Waterhouse - The Lady of Shalott - Google Art Project.jpg": "1/1e"
  };
