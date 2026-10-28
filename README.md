# Blockfacho Instagram (v1.0)

**Extension Brave / Chrome pour bloquer en masse sur Instagram les comptes d'extrême droite listés par l'annuaire collaboratif [onbloquelextremedroite.fun](https://onbloquelextremedroite.fun/).**

*English: a Brave / Chrome (Manifest V3) extension that bulk-blocks, on Instagram, the far-right accounts listed in the community directory onbloquelextremedroite.fun, using your already logged-in session.*

Blockfacho Instagram est la version Instagram de Blockfacho (qui fonctionne sur X). Tu cliques sur « Lancer »,
l'extension ouvre chaque profil de l'annuaire dans une fenêtre en arrière-plan et le bloque à ta place,
automatiquement, avec des pauses pour ne pas déclencher les limites d'Instagram.

> Projet non officiel, sans lien avec Instagram ni Meta. Il automatise des clics dans ta propre session :
> utilise-le à tes risques, avec les limites décrites plus bas.

## Sommaire

- [Comment ça marche](#comment-ça-marche)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Rate limit : les limites d'Instagram](#rate-limit--les-limites-dinstagram)
- [Langues](#langues)
- [Confidentialité](#confidentialité)
- [Un problème ? Ouvrir une issue](#un-problème--ouvrir-une-issue)
- [Contribuer](#contribuer)
- [Structure du projet](#structure-du-projet)
- [Questions fréquentes](#questions-fréquentes)

## Comment ça marche

1. **La liste vient de l'annuaire.** À chaque ouverture du panneau, l'extension relit
   `https://onbloquelextremedroite.fun/api/accounts` et garde les entrées `instagram`. Les comptes ajoutés
   et validés par la communauté apparaissent donc sans mise à jour de l'extension, et les comptes retirés
   de l'annuaire sont retirés de ta liste. Si l'annuaire est injoignable, l'extension s'arrête plutôt que de
   risquer de bloquer un compte retiré.
2. **Tu choisis les catégories** (Politiques, Partis & mouvements, Influenceurs, Médias, RN, Reconquête…),
   lues directement dans l'annuaire.
3. **Le blocage est automatique.** Pour chaque compte, l'extension ouvre le profil dans une fenêtre en
   arrière-plan, clique sur « ⋯ » puis « Bloquer » et confirme, comme tu le ferais à la main.
4. **Tout est mémorisé.** Les comptes déjà bloqués, déjà traités ou introuvables sont notés dans le stockage
   local du navigateur : un nouveau lancement reprend là où le précédent s'est arrêté.
5. **Un mode « À blanc »** vérifie les profils sans rien bloquer, pour tester avant de te lancer.

## Installation

1. Télécharge ce dépôt (bouton **Code > Download ZIP**) et décompresse-le, ou clone-le :
   `git clone https://github.com/9y25js754r-wq/blockfacho_insta.git`
2. Ouvre `brave://extensions` (ou `chrome://extensions`).
3. Active le **mode développeur**.
4. Clique sur **Charger l'extension non empaquetée** et choisis le dossier du projet.
5. Connecte-toi sur [instagram.com](https://www.instagram.com/) dans ce même navigateur.

## Utilisation

1. Clique sur l'icône **Blockfacho Instagram** : le panneau s'ouvre dans un onglet.
2. Coche les catégories à traiter.
3. Fais d'abord un essai en cochant **À blanc** avec « Blocages max » à 3.
4. Décoche « À blanc » puis clique sur **Lancer**. Le journal affiche chaque compte :
   `bloqué`, `déjà bloqué`, `introuvable ou suspendu` ou une erreur.
5. **Arrêter** termine proprement après le compte en cours.

Laisse la fenêtre du panneau ouverte pendant le lancement. Tu peux continuer à utiliser ton navigateur :
le travail se fait dans une fenêtre séparée qui se referme toute seule.

## Rate limit : les limites d'Instagram

Instagram surveille les actions répétitives. Bloquer trop de comptes trop vite peut **restreindre
temporairement ton compte** (actions refusées, message « Réessayez plus tard », demande de vérification).
Les réglages par défaut sont volontairement prudents, et la lenteur est voulue :

| Réglage | Valeur par défaut | Rôle |
|---|---|---|
| Blocages max par lancement | 25 | Plafond d'actions par session |
| Pause après un blocage | 15 à 40 s (aléatoire) | Évite un rythme régulier de robot |
| Pause après un profil sans blocage | 5 à 10 s | Ouvrir des profils compte aussi comme activité |
| Arrêt automatique | après 3 erreurs de suite | Limite atteinte ou interface changée |

**Conseils :**

- Reste à **25 blocages par lancement** et fais **un ou deux lancements par jour**. Avec plus de 800 comptes,
  compte plusieurs jours : c'est normal.
- Ne baisse pas les pauses « pour aller plus vite » : une restriction coûte bien plus de temps que la lenteur.
- Si l'extension affiche *« Instagram limite les actions »*, **arrête** et attends plusieurs heures
  (idéalement 24 h) avant de relancer. Ne réessaie pas en boucle.
- Si Instagram demande une vérification, fais-la à la main dans ton navigateur avant de relancer.
- Les blocages déjà faits restent faits. Pour les annuler, il faut les retirer à la main depuis Instagram.

## Langues

L'extension reconnaît les boutons d'Instagram d'après leur texte, dans la langue de l'interface **du compte**
(pas celle de ton ordinateur) : français, anglais, italien, espagnol, portugais et allemand.

- Le français et l'anglais ont été testés en conditions réelles.
- L'italien, l'espagnol, le portugais et l'allemand sont pris en charge d'après les libellés attendus,
  mais **non testés**. Si l'un d'eux échoue, ouvre une issue avec la ligne « repères présents ».
- Pour une autre langue, passe temporairement Instagram en français ou en anglais
  (Paramètres > Langue), le temps du blocage.

## Confidentialité

- Aucun mot de passe, cookie ni identifiant ne quitte ton navigateur : l'extension agit dans ta session déjà ouverte.
- Le seul serveur contacté en dehors d'Instagram est l'annuaire (`onbloquelextremedroite.fun`), en lecture seule,
  pour récupérer la liste.
- L'état d'avancement (quels comptes sont traités) est stocké localement avec `chrome.storage.local`.
- Pas de statistiques, pas de télémétrie.

## Un problème ? Ouvrir une issue

Avant d'ouvrir une [issue](https://github.com/9y25js754r-wq/blockfacho_insta/issues), vérifie le point de départ :
tu es connecté sur instagram.com dans le même navigateur, et tu n'es pas déjà restreint par Instagram.

Dans l'issue, indique :

1. Ton navigateur et sa version (Brave, Chrome…) et ton système.
2. La **langue de ton interface Instagram**.
3. Ce que tu as fait (« À blanc » ou blocage réel, nombre de comptes).
4. Les **lignes du journal** du panneau, surtout la ligne rouge et la ligne `repères présents`.
5. Si possible, la console du panneau (clic droit dans le panneau > Inspecter > Console).

Ne colle jamais de mot de passe, de cookie ni de jeton. Les erreurs de type
`erreur: page de profil non reconnue` ou `entrée Bloquer absente du menu` signalent en général que
l'interface d'Instagram a changé : la ligne `repères présents` permet de corriger les sélecteurs.

## Contribuer

Les contributions sont bienvenues : correction de sélecteurs après un changement d'Instagram, test et
correction d'une langue, amélioration du journal, documentation.

1. Fais un fork, crée une branche (`git checkout -b correction-selecteur`).
2. Garde le style du code existant : JavaScript sans dépendance, pas d'étape de build.
3. Teste en « À blanc » puis sur 1 blocage réel, dans ta langue.
4. Ouvre une pull request en décrivant ce qui a changé et comment tu l'as testé.

Pour proposer l'**ajout ou le retrait d'un compte**, passe par l'annuaire
[onbloquelextremedroite.fun](https://onbloquelextremedroite.fun/) : cette extension ne fait que lire sa liste.

## Structure du projet

| Fichier | Rôle |
|---|---|
| `manifest.json` | Déclaration de l'extension (Manifest V3, permissions) |
| `background.js` | Ouvre le panneau au clic sur l'icône |
| `panneau.html` | Interface du panneau |
| `panneau.js` | Chargement de l'annuaire, boucle de blocage, script injecté dans Instagram |

## Questions fréquentes

**Est-ce que ça marche sur Firefox ou Safari ?** Non, uniquement Brave, Chrome et les navigateurs Chromium.

**Est-ce que ça bloque aussi sur X, Facebook, TikTok ou YouTube ?** Non, celle-ci ne gère qu'Instagram.
La version X s'appelle Blockfacho.

**Pourquoi un compte est « introuvable ou suspendu » ?** Le profil n'existe plus, a changé de nom ou t'a
déjà bloqué. Il est noté comme traité.

**Je peux utiliser un autre compte Instagram ?** Oui : l'extension agit avec la session ouverte dans le navigateur.

---

*Mots-clés : bloquer en masse Instagram, bulk block Instagram, extension Brave Chrome, blocklist Instagram,
bloquer comptes extrême droite, anti-extrême droite, onbloquelextremedroite.fun, Manifest V3.*
