/**
 * Blockfacho Instagram 1.0 : panneau de l'extension.
 * Charge l'annuaire, puis bloque sur Instagram les comptes choisis, depuis la session déjà ouverte.
 */

const ANNUAIRE = 'https://onbloquelextremedroite.fun';
const TERMINES = ['bloque', 'deja', 'introuvable'];
const LIBELLES = { bloque: 'bloqué', deja: 'déjà bloqué', introuvable: 'introuvable ou suspendu', serait_bloque: 'serait bloqué' };

const $ = (id) => document.getElementById(id);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let comptes = [];
let etat = {};
let arret = false;

function log(texte, classe = '') {
  const ligne = document.createElement('div');
  ligne.textContent = texte;
  ligne.className = classe;
  $('journal').append(ligne);
  $('journal').scrollTop = $('journal').scrollHeight;
}

async function recuperer(chemin) {
  const reponse = await fetch(ANNUAIRE + chemin, { cache: 'no-store' });
  if (!reponse.ok) throw new Error(`${chemin} : HTTP ${reponse.status}`);
  return reponse;
}

/** Pages d'Instagram qu'un « handle » de l'annuaire ne doit jamais viser (déconnexion, réglages…). */
const PAGES_INSTAGRAM = new Set(['accounts', 'explore', 'p', 'reel', 'reels', 'stories', 'direct', 'login', 'logout', 'about', 'legal', 'privacy', 'web', 'challenge', 'emailsignup', 'tv', 'directory', 'developer', 'press', 'api', 'static', 'oauth', 'nametag', 'session']);
const handleValide = (h) => typeof h === 'string' && /^[\w.]{1,30}$/.test(h) && !PAGES_INSTAGRAM.has(h.toLowerCase());

/** Extrait le handle d'une URL de profil Instagram, ou `undefined`. */
const handleDepuisUrl = (url) => url?.match(/^https?:\/\/(?:www\.)?instagram\.com\/([\w.]{1,30})/i)?.[1];

/**
 * Charge la liste des comptes Instagram depuis l'API de l'annuaire (entrées « new » moins « removal »).
 * Il n'y a pas de liste de base : sans l'API on s'arrête, sinon un compte retiré pourrait être bloqué.
 * @returns {Promise<Array<{id: string, name: string, handle: string, category: string}>>}
 */
async function chargerComptes() {
  const { entries } = await (await recuperer('/api/accounts')).json();
  const parId = new Map();

  for (const e of entries) {
    if (e.type !== 'new' || e.platform !== 'instagram') continue;
    const handle = handleDepuisUrl(e.profile_url);
    if (handleValide(handle)) parId.set(String(e.id).toLowerCase(), { id: e.id, name: e.name, handle, category: e.category || 'Autres' });
  }
  for (const e of entries) if (e.type === 'removal') parId.delete(String(e.target_id ?? '').toLowerCase());

  const parHandle = new Map();
  for (const c of parId.values()) {
    if (!parHandle.has(c.handle.toLowerCase())) parHandle.set(c.handle.toLowerCase(), c);
  }
  return [...parHandle.values()];
}

function afficherResume() {
  const faits = comptes.filter((c) => TERMINES.includes(etat[c.handle.toLowerCase()])).length;
  $('resume').textContent = `${comptes.length} comptes dans l'annuaire, ${faits} déjà traités.`;
}

function afficherCategories() {
  const parCat = Object.groupBy(comptes, (c) => c.category);
  $('categories').replaceChildren(
    ...Object.entries(parCat).map(([cat, liste]) => {
      const restants = liste.filter((c) => !TERMINES.includes(etat[c.handle.toLowerCase()])).length;
      const coche = Object.assign(document.createElement('input'), { type: 'checkbox', checked: restants > 0, value: cat });
      const label = document.createElement('label');
      label.append(coche, `${cat} (${restants} sur ${liste.length} à bloquer)`);
      return label;
    }),
  );
}

/**
 * Charge une URL dans l'onglet et rend la main à la fin du chargement.
 * Au bout de 30 s on rend la main quand même : agirSurProfil remontera l'erreur.
 */
function chargerOnglet(tabId, url) {
  return new Promise((resolve) => {
    const fin = () => {
      clearTimeout(minuteur);
      chrome.tabs.onUpdated.removeListener(ecoute);
      resolve();
    };
    const ecoute = (id, info) => id === tabId && info.status === 'complete' && fin();
    const minuteur = setTimeout(fin, 30000);
    chrome.tabs.onUpdated.addListener(ecoute);
    chrome.tabs.update(tabId, { url });
  });
}

/**
 * Traite le profil ouvert dans l'onglet. Injectée dans la page : elle doit rester autonome
 * et ne rien référencer de ce fichier.
 *
 * Les classes d'Instagram sont obfusquées : on se repère au texte des boutons, en français, anglais,
 * italien, espagnol, portugais et allemand. Seuls le français et l'anglais ont été testés en réel.
 *
 * @param {boolean} bloquer `false` pour seulement lire l'état du profil.
 * @returns {Promise<string>} `bloque`, `deja`, `introuvable`, `serait_bloque`, `a_verifier`,
 *   `deconnecte`, `limite`, ou `erreur: ...`.
 */
async function agirSurProfil(bloquer) {
  const attendre = async (test, ms) => {
    const debut = Date.now();
    while (Date.now() - debut < ms) {
      const r = test();
      if (r) return r;
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  };
  const bouton = (re, racine = document) =>
    [...racine.querySelectorAll('button, [role="button"], [role="menuitem"]')].find((b) => re.test(b.textContent.trim()));
  /** En fenêtre étroite Instagram affiche plusieurs <header> (barre du haut et profil) : on les parcourt tous. */
  const boutonDansHeaders = (re) => [...document.querySelectorAll('header')].map((h) => bouton(re, h)).find(Boolean);
  /** L'icône « ⋯ » est reconnue à ses 3 cercles, ce qui évite de dépendre de la langue de son aria-label. */
  const iconeOptions = () => [...document.querySelectorAll('header svg')].find((s) => s.querySelectorAll('circle').length === 3);
  const texteDeLaPage = () => document.body.innerText;

  const LIMITE = /réessayer plus tard|action bloquée|try again later|action blocked|riprova più tardi|azione bloccata|inténtalo de nuevo más tarde|acción bloqueada|tente novamente mais tarde|später erneut versuchen|aktion blockiert/i;
  const INTROUVABLE = /cette page n.est pas disponible|page introuvable|page isn.t available|page not found|questa pagina non è disponibile|pagina non trovata|esta página no está disponible|página no encontrada|esta página não está disponível|diese seite ist nicht verfügbar|seite nicht gefunden/i;
  const DEBLOQUER = /^(débloquer|unblock|sblocca|desbloquear|blockierung aufheben|entsperren)$/i;
  const SUIVRE = /^(suivre|s.abonner|abonné|demande envoy|follow|requested|segui|seguendo|seguito|richiest|seguir|siguiendo|seguindo|solicitad|folgen|abonniert|angefragt)/i;
  const BLOQUER = /^(bloquer|block|blocca|bloquear|blockieren)$/i;
  const BLOQUER_PREFIXE = /^(bloquer|block|blocca|bloquear|blockieren)\b/i;
  /** Le menu « ⋯ » et la confirmation peuvent vivre dans n'importe quel calque : on cherche dans toute la page, libellé exact d'abord. */
  const trouverBloquer = () => bouton(BLOQUER) ?? bouton(BLOQUER_PREFIXE);

  const verifLimite = () => (/\/(challenge|accounts\/suspended)\//.test(location.pathname) || LIMITE.test(texteDeLaPage()) ? 'limite' : null);

  const pret = await attendre(
    () =>
      document.querySelector('a[href="/direct/inbox/"], a[href="/explore/"]') ||
      document.querySelector('input[name="username"]') ||
      verifLimite(),
    15000,
  );
  if (!pret) return 'limite';
  if (verifLimite()) return 'limite';
  if (document.querySelector('input[name="username"]')) return 'deconnecte';

  const statut = await attendre(
    () =>
      verifLimite() ||
      (INTROUVABLE.test(texteDeLaPage()) && 'introuvable') ||
      (boutonDansHeaders(DEBLOQUER) && 'deja') ||
      // L'icône « ⋯ » s'affiche avant les boutons d'action : on attend aussi « Suivre » pour ne pas prendre un profil bloqué pour un profil à bloquer.
      (iconeOptions() && boutonDansHeaders(SUIVRE) && 'a_bloquer'),
    20000,
  );
  if (statut !== 'a_bloquer') return statut ?? 'erreur: page de profil non reconnue';
  if (!bloquer) return 'serait_bloque';

  iconeOptions().closest('button, [role="button"]').click();
  const menu = await attendre(trouverBloquer, 10000);
  if (!menu) return 'erreur: entrée Bloquer absente du menu';
  menu.click();

  // La confirmation contient un second bouton « Bloquer », différent de l'entrée de menu cliquée.
  const confirmer = await attendre(() => {
    const b = trouverBloquer();
    return b && b !== menu && b.isConnected ? b : null;
  }, 10000);
  if (!confirmer) return 'erreur: confirmation absente';
  confirmer.click();
  return (await attendre(() => boutonDansHeaders(DEBLOQUER), 6000)) ? 'bloque' : 'a_verifier';
}

/** Liste les icônes et boutons visibles du profil, pour diagnostiquer une page non reconnue. Injectée dans la page. */
function reperesDeLaPage() {
  const labels = [...document.querySelectorAll('header svg[aria-label]')].map((e) => `svg:${e.getAttribute('aria-label')}`);
  const boutons = [...document.querySelectorAll('header button, [role="dialog"] button')].map((b) => `bouton:${b.textContent.trim().slice(0, 30)}`);
  return [...new Set([...labels, ...boutons])].join(', ');
}

/**
 * Injecte une fonction dans l'onglet et renvoie son résultat.
 * La page peut naviguer pendant l'injection (« Frame was removed ») : on réessaie 3 fois avec une pause.
 * Relancer agirSurProfil est sans danger, elle relit l'état du profil avant d'agir.
 */
async function executer(tabId, func, args = []) {
  for (let essai = 1; ; essai++) {
    try {
      const [{ result }] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
      return result;
    } catch (e) {
      if (essai >= 3 || !/frame|tab/i.test(e.message)) throw e;
      await pause(3000);
    }
  }
}

/**
 * Ouvre le profil et le bloque. Dans une fenêtre en arrière-plan Instagram n'affiche pas toujours
 * « Débloquer » après coup : on recharge alors le profil pour lire l'état réel côté serveur.
 * @returns {Promise<string>} Même valeurs que agirSurProfil, sans `a_verifier`.
 */
async function traiterCompte(tabId, handle, bloquer) {
  const url = `https://www.instagram.com/${encodeURIComponent(handle)}/`;
  try {
    await chargerOnglet(tabId, url);
    const resultat = await executer(tabId, agirSurProfil, [bloquer]);
    if (resultat !== 'a_verifier') return resultat;
    await pause(2000);
    await chargerOnglet(tabId, url);
    return (await executer(tabId, agirSurProfil, [false])) === 'deja' ? 'bloque' : 'erreur: toujours pas bloqué après rechargement';
  } catch (e) {
    return `erreur: ${e.message}`;
  }
}

/** Boucle principale : traite les comptes cochés avec des pauses aléatoires, jusqu'à la limite ou l'arrêt. */
async function lancer() {
  const categories = [...document.querySelectorAll('#categories input:checked')].map((i) => i.value);
  const max = Number($('max').value);
  const [dMin, dMax] = [Number($('delaiMin').value), Number($('delaiMax').value)];
  const aBlanc = $('aBlanc').checked;
  const aTraiter = comptes
    .filter((c) => categories.includes(c.category))
    .filter((c) => !TERMINES.includes(etat[c.handle.toLowerCase()]));

  log(`${aTraiter.length} comptes restants, ${max} blocages au plus${aBlanc ? ' (à blanc)' : ''}.`);
  if (!aTraiter.length) return;

  arret = false;
  $('lancer').disabled = true;
  $('arreter').disabled = false;
  const fenetre = await chrome.windows.create({ url: 'about:blank', focused: false });
  const tabId = fenetre.tabs[0].id;
  let erreursDeSuite = 0;
  let actions = 0;

  try {
    for (const [i, c] of aTraiter.entries()) {
      if (arret || actions >= max) break;
      const cle = c.handle.toLowerCase();
      const prefixe = `[${i + 1}/${aTraiter.length}] @${c.handle} (${c.name})`;
      const result = await traiterCompte(tabId, c.handle, !aBlanc);

      if (result === 'deconnecte') {
        log('Pas de session Instagram dans ce navigateur : connecte-toi sur instagram.com puis relance.', 'err');
        break;
      }
      if (result === 'limite') {
        log('Instagram limite les actions (page vide, défi ou « réessayez plus tard ») : attends plusieurs heures avant de relancer.', 'err');
        break;
      }
      if (result.startsWith('erreur')) {
        etat[cle] = 'erreur';
        erreursDeSuite++;
        log(`${prefixe} : ${result}`, 'err');
        log(`  repères présents : ${await executer(tabId, reperesDeLaPage).catch(() => 'page indisponible')}`, 'gris');
      } else {
        if (result !== 'serait_bloque') etat[cle] = result;
        erreursDeSuite = 0;
        log(`${prefixe} : ${LIBELLES[result]}`, result === 'bloque' ? 'ok' : 'gris');
      }
      await chrome.storage.local.set({ etat });

      // Échecs en série : limite d'Instagram ou interface changée, insister risque un verrouillage.
      if (erreursDeSuite >= 3) {
        log('3 erreurs de suite, arrêt. Réessaie plus tard.', 'err');
        break;
      }
      if (result === 'bloque' || result === 'serait_bloque') actions++;
      if (actions >= max || i === aTraiter.length - 1 || arret) continue;
      // Même sans blocage, enchaîner les profils peut déclencher la limite : on garde une pause courte.
      const aAgi = result === 'bloque' || result.startsWith('erreur');
      await pause(aAgi ? (dMin + Math.random() * (dMax - dMin)) * 1000 : (5 + Math.random() * 5) * 1000);
    }
  } finally {
    await chrome.windows.remove(fenetre.id).catch(() => {});
    $('lancer').disabled = false;
    $('arreter').disabled = true;
    log(arret ? 'Arrêté.' : 'Terminé.');
    afficherResume();
    afficherCategories();
  }
}

$('lancer').onclick = lancer;
$('arreter').onclick = () => {
  arret = true;
  log('Arrêt demandé, fin après le compte en cours.', 'gris');
};

({ etat = {} } = await chrome.storage.local.get('etat'));
try {
  comptes = await chargerComptes();
  afficherResume();
  afficherCategories();
  $('lancer').disabled = false;
} catch (e) {
  $('resume').textContent = `Annuaire injoignable (${e.message}). Recharge la page plus tard.`;
}
