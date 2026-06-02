# Mettre ton site en ligne + éditer le contenu toi-même

Ton site est maintenant prêt à être **publié sur Netlify** et **édité sans code** via une
page `/admin` (Decap CMS, le successeur de Netlify CMS). Tout ton contenu est dans des
fichiers de données ; tu les modifieras depuis une interface simple, en 3 langues.

Ce guide se fait **une seule fois** (≈ 20–30 min). Ensuite, éditer = se connecter et cliquer.

> Je (Claude) ne peux pas créer de comptes à ta place. Suis les étapes ; si tu bloques sur
> une, reviens me voir avec une capture d'écran et je te débloque.

────────────────────────────────────────────────────────────────────────
## PARTIE A — Mettre le site en ligne
────────────────────────────────────────────────────────────────────────

### 1. Créer un compte GitHub (gratuit)
- Va sur **https://github.com** → **Sign up**. Note ton identifiant + mot de passe.

### 2. Créer un dépôt et y déposer le site
- Sur GitHub : bouton **+** (en haut à droite) → **New repository**.
- Nom : par ex. `sara-gouzy-site`. Laisse **Public**. Clique **Create repository**.
- Sur la page du dépôt vide : lien **« uploading an existing file »**.
- Ouvre le dossier **`cms-site`** sur ton ordinateur, **sélectionne TOUT ce qu'il contient**
  (les fichiers `index.html`, etc. ET les dossiers `assets`, `content`, `admin`, `images`)
  et **glisse-les** dans la zone de dépôt GitHub.
  ⚠️ Important : dépose le **contenu** de `cms-site` (pas le dossier lui-même), pour que
  `index.html` soit bien à la racine du dépôt.
- En bas : **Commit changes**.

### 3. Créer un compte Netlify et publier
- Va sur **https://www.netlify.com** → **Sign up** → choisis **« Sign up with GitHub »**
  (le plus simple : ça relie les deux).
- Une fois connectée : **Add new site** → **Import an existing project** → **GitHub** →
  autorise → choisis ton dépôt `sara-gouzy-site`.
- Réglages de build (laisse tel quel) :
  - **Build command** : (vide)
  - **Publish directory** : (vide, ou un point `.`)
- Clique **Deploy**. Au bout d'une minute, ton site est **en ligne** à une adresse du type
  `https://un-nom-aleatoire.netlify.app`.
- (Tu peux renommer cette adresse : **Site configuration → Change site name**.)

────────────────────────────────────────────────────────────────────────
## PARTIE B — Activer l'édition (le CMS / page /admin)
────────────────────────────────────────────────────────────────────────

Dans le tableau de bord Netlify de ton site :

### 4. Activer Identity (la connexion)
- Menu **Integrations** (ou **Site configuration**) → **Identity** → **Enable Identity**.

### 5. Réglages Identity
- **Registration preferences** → mets **Invite only** (toi seule pourras te connecter).
- **Services → Git Gateway** → **Enable Git Gateway**.

### 6. T'inviter toi-même
- Onglet **Identity** → **Invite users** → saisis **ton adresse email** → **Send**.
- Tu reçois un email **« You've been invited… »** → clique **Accept the invite** →
  crée ton **mot de passe**.

### 7. Éditer !
- Va sur **`https://ton-site.netlify.app/admin/`** → connecte-toi avec ton email + mot de passe.
- Tu vois des rubriques : **Réglages, Concerts, Vidéos, Presse, Textes (3 langues)**.
- Modifie, puis clique **Publish**. Netlify reconstruit le site automatiquement (≈ 1 min).

> 💡 Astuce : dans **Réglages**, tu peux régler ton **email**, tes **réseaux** et ton
> **lien Formspree** sans toucher au code.

────────────────────────────────────────────────────────────────────────
## PARTIE C — Brancher ton domaine saragouzy.de (optionnel)
────────────────────────────────────────────────────────────────────────
- Netlify → **Domain management** → **Add a domain** → `saragouzy.de` → suis les
  instructions DNS (à reporter chez ton fournisseur de domaine).

────────────────────────────────────────────────────────────────────────
## CE QUE TU PEUX ÉDITER DANS LE CMS
────────────────────────────────────────────────────────────────────────
- **Réglages** : email, Instagram/YouTube/Facebook, lien Formspree, vidéo d'accueil.
- **Concerts** : ajouter/retirer des dates (à venir et passées), avec lien billetterie.
- **Vidéos** : ajouter/retirer des vidéos YouTube (colle juste l'ID).
- **Presse** : ajouter des citations de presse.
- **Textes (3 langues)** : ton accroche, ta biographie, les textes coaching, contact, etc.,
  en Français / English / Deutsch.
- **Images** : tu peux téléverser de nouvelles photos via la médiathèque du CMS.

────────────────────────────────────────────────────────────────────────
## BON À SAVOIR
────────────────────────────────────────────────────────────────────────
- **Aperçu local** : comme le site lit ses données via le réseau, ouvrir `index.html` par
  double-clic ne marche plus. Utilise plutôt l'adresse Netlify en ligne pour voir le rendu.
- **Le formulaire** : crée toujours ton formulaire gratuit sur https://formspree.io et colle
  l'adresse dans **Réglages → Lien Formspree**.
- **Le logo / favicon** : conservé (icône d'onglet `sg`).
- Si Netlify ne propose pas « Identity » (l'option évolue côté Netlify), reviens me voir :
  on passera à la connexion via GitHub (même CMS, autre méthode de login).

Bonne mise en ligne ! En cas de doute sur une étape, envoie-moi une capture, je te guide.
