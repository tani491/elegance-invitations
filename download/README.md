# Élégance — Invitations de Mariage et Événements sur Mesure

> Plateforme SaaS complète de création, personnalisation et gestion d’invitations numériques de luxe pour mariages et événements. Conçue avec un design raffiné, une expérience utilisateur immersive et un backend robuste.

---

## 🎯 Vue d’ensemble

**Élégance** est une application web full-stack construite avec **Next.js 16 (App Router + Turbopack)**, conçue pour le marché ouest-africain et francophone. Elle permet aux organisateurs de créer des invitations numériques d’exception, aux invités de confirmer leur présence via QR code, et aux photographes de téléverser les photos de l’événement.

### Points clés

- 🌟 **Design système luxe** : palette ivoire/or/bordeaux/ébène, typographies Cormorant Garamond + Great Vibes + Plus Jakarta Sans
- 🌍 **Internationalisation** : 4 langues (Français, Anglais, Arabe RTL, Espagnol)
- 💰 **Multi-devises** : FCFA, EUR, USD, GBP avec conversion en temps réel
- 📷 **Espace photographe** : upload dédié par token sécurisé
- 📦 **Base de données** : Prisma ORM + SQLite (migrable vers Supabase/PostgreSQL)
- 🎨 **Animations immersives** : ouverture d’enveloppe, rideaux de velours, parallaxe, transitions Framer Motion
- 🔐 **Sécurité** : tokens uniques, QR codes nominatifs, accès protégé par code

---

## 📍 Architecture & Zones de routes

L’application est organisée en **6 zones de routes** distinctes :

```
/                           →  Vitrine (landing page) publique
/m/[slug]                   →  Expérience invitation invité
/login                      →  Connexion (routing par email)
/dashboard                  →  Espace organisateur (CRUD invitation + invités)
/photographer/[token]       →  Portail photographe (upload photos)
/admin                      →  Administration (gestion commandes)
```

---

## 📦 Base de données (Prisma Schema)

### Modèle `Event`

Représente un événement (mariage, gala, baptême). Champs principaux :

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `String (cuid)` | Identifiant unique |
| `name` | `String` | Nom de l’événement |
| `organizerName` | `String` | Nom de l’organisateur |
| `organizerPhone` | `String` | Téléphone contact |
| `template` | `String` | Modèle (medina, roseraie, billet, velours, theatre) |
| `primaryColor` / `accentColor` | `String` | Couleurs personnalisées |
| `animationType` | `String` | Animation (envelope, curtain) |
| `brideName` / `groomName` | `String?` | Noms des mariés |
| `eventDate` / `eventTime` | `DateTime?` / `String?` | Date et heure |
| `venueName` / `venueAddress` | `String?` | Lieu de cérémonie |
| `mairieName` / `mairieAddress` | `String?` | Lieu de mairie |
| `receptionVenue` / `receptionAddress` | `String?` | Lieu de réception |
| `dressCode` / `coupleStory` | `String?` | Code vestimentaire / histoire du couple |
| `planType` | `String` | Formule (essentielle, prestige, privilege) |
| `photographerToken` | `String?` | Token d’accès photographe (unique) |
| `isActive` / `isPaid` | `Boolean` | Statut activation / paiement |

**Relations** : `Event → EventGuest[]`, `Event → EventPhoto[]` (cascade delete)

### Modèle `EventGuest`

Représente un invité avec son statut RSVP et check-in :

| Champ | Type | Description |
|-------|------|-------------|
| `accessCode` | `String (unique)` | Code d’accès format `AMIRA-2026-XX##` |
| `qrToken` | `String (unique)` | Token QR format `qr_nom_prenom_###` |
| `rsvpStatus` | `String` | pending / confirmed / declined |
| `plusOnes` | `Int` | Nombre d’accompagnateurs |
| `menuChoice` / `dietaryNotes` | `String?` | Préférences repas |
| `isCheckedIn` / `checkedInAt` | `Boolean` / `DateTime?` | Contrôle d’entrée Jour J |

### Modèle `EventPhoto`

Représente une photo uploadée par le photographe :

| Champ | Type | Description |
|-------|------|-------------|
| `category` | `String` | preparatifs, ceremonie, couple, cocktail, soiree |
| `originalUrl` / `thumbnailUrl` | `String?` | URLs Cloudinary |
| `width` / `height` | `Int?` | Dimensions |
| `cloudinaryPublicId` | `String?` | ID Cloudinary pour transformations |

---

## 📖 Déroulement complet de l’application

### Étape 1 — Vitrine publique (`/`)

La page d’accueil est la vitrine commerciale d’Élégance. Elle présente la plateforme aux futurs clients.

**Fonctionnalités :**

1. **Hero immersif** : plein écran avec fond bordeaux, particules d’or déterministes (pas de `Math.random`), effet parallaxe au scroll, et appel à l’action vers WhatsApp
2. **Comment ça marche** : 3 étapes illustrées (Choisir son modèle → Personnaliser → Envoyer)
3. **Catalogue de modèles** : 9 templates avec filtres par catégorie (Classique, Moderne, Orientale, Floral, Bohème, Minimaliste, Royal, Tropical, Art Déco) et aperçu dans un mockup téléphone animé
4. **Tableau comparatif** : invitations papier vs numériques Élégance (8 critères)
5. **Section QR Code** : explication des avantages du QR pour le check-in
6. **Tarification** : 3 formules (Essentielle 5 000 FCFA, Prestige 10 000 FCFA, Privilège 15 000 FCFA) avec conversion multi-devises
7. **Témoignages** : 3 couples avec étoiles et photos
8. **FAQ** : 5 questions en accordéon animé
9. **Appel à l’action final** : incitation à commander via WhatsApp
10. **Footer** : liens, réseaux sociaux, mentions légales

**Navbar** :
- Fixe, transparente puis ivoire au scroll (seuil 24px)
- Sélecteur de langue (FR/EN/AR/ES) avec support RTL pour l’arabe
- Sélecteur de devise (FCFA/EUR/USD/GBP)
- Menu mobile en `Sheet` (drawer)
- Hydratation contrôlée via `useMounted()` pour éviter les mismatchs SSR/CSR

---

### Étape 2 — Connexion (`/login`)

Page de connexion avec design luxueux (fond ivoire, motifs or subtils, carte avec bordure dorée).

**Fonctionnement actuel (mock) :**
- `admin@elegance.sn` → redirige vers `/admin`
- `photo@elegance.sn` → redirige vers `/photographer/demo-token`
- Tout autre email → redirige vers `/dashboard`

> En production, l’authentification serait gérée par NextAuth.js (déjà installé en dépendance).

---

### Étape 3 — Expérience invitation (`/m/[slug]`)

C’est la page vue par l’invité. Elle simule l’expérience complète de réception d’une invitation.

**Déroulement :**

1. **Animation d’ouverture** :
   - Mode **Enveloppe** : sceau de cire bordeaux avec initiales, qui se brise en 4 morceaux animés, puis le volet s’ouvre pour révéler la lettre
   - Mode **Rideau** : rideaux de velours bordeaux avec tringle dorée et gland, qui s’écartent
   - Auto-ouverture après 6 secondes si l’utilisateur ne clique pas

2. **Contenu de l’invitation** :
   - Noms du couple en typographie script (Great Vibes)
   - Date, lieu, carte d’invitation complète
   - Frise chronologique (cérémonie, réception, soirée)
   - Histoire du couple
   - Code vestimentaire

3. **RSVP** :
   - L’invité peut confirmer ou décliner
   - Sélection du nombre d’accompagnateurs
   - Choix du menu et notes alimentaires
   - Envoi vers `/api/rsvp` (POST)

4. **Pass d’accès PDF** :
   - Génération d’un pass nominatif au format PDF (120x80mm, paysage)
   - Inclut : nom, table, code d’accès, QR code, date, lieu
   - Design avec bordures dorées doubles et bandeau bordeaux
   - Téléchargement via jsPDF

---

### Étape 4 — Espace Organisateur (`/dashboard`)

Le tableau de bord de l’organisateur regroupe toutes les fonctions de gestion.

**Sections :**

1. **Mon Invitation** :
   - Formulaire d’édition : noms des mariés, date, lieu, adresse, musique, histoire du couple
   - Saisie manuelle des données + sauvegarde

2. **Liste des Invités** :
   - Tableau complet : nom, statut RSVP, table, accompagnateurs, check-in
   - Ajout d’invités (formulaire inline)
   - Filtres par statut (tous, confirmés, en attente, déclinés)
   - Recherche par nom
   - Copie du code d’accès en un clic

3. **Scanner QR Check-in** :
   - Scanner de QR codes en temps réel via caméra (`html5-qrcode`)
   - Saisie manuelle du token QR ou du code d’accès
   - Feedback visuel immédiat : vert (succès), jaune (déjà enregistré), rouge (non trouvé)
   - Statistiques en temps réel : confirmés, présents, en attente
   - Tokens de test rapides (mock data)

4. **Éditeur No-Code** (`NoCodeEditor`) :
   - Sélection de template parmi 5 thèmes (Médina, Roseraie, Billet, Velours, Théâtre)
   - Personnalisation des couleurs (primaire + accent)
   - Choix du type d’animation (enveloppe / rideau)
   - Upload de photo de couverture
   - URL de musique personnalisée
   - Prévisualisation en direct

5. **Commande WhatsApp** (`WhatsAppOrderCheckout`) :
   - Sélection du forfait (Essentielle / Prestige / Privilège)
   - Récapitulatif automatique des détails
     - Redirection vers WhatsApp avec message pré-rempli

---

### Étape 5 — Portail Photographe (`/photographer/[token]`)

Espace dédié au photographe de l’événement, accessible uniquement via un token unique.

**Déroulement :**

1. **Validation du token** :
   - À l’arrivée sur la page, le token est envoyé à `/api/photographer/validate?token=...`
   - Si le token est invalide, un écran d’erreur s’affiche
   - Si valide, les informations de l’événement sont chargées (noms, date, lieu)

2. **Interface d’upload** :
   - Zone de drag & drop pour déposer des photos
   - Sélection de catégorie : Préparatifs, Cérémonie, Mairie, Cocktail, Soirée
   - Barre de progression par photo
   - File d’envoi avec états (pending, uploading, done, error)

3. **Galerie photo** :
   - Affichage en grille avec filtres par catégorie
   - Lightbox plein écran avec navigation (précédent/suivant)
   - Mode protégé par code d’accès (`ProtectedPhotoGallery`)
   - Téléchargement des photos en HD

4. **API Backend** :
   - `POST /api/photographer/upload` : réception des métadonnées photos + token
   - `GET /api/photographer/validate?token=...` : validation du token

---

### Étape 6 — Administration (`/admin`)

Panneau de gestion des commandes pour l’équipe Élégance.

**Fonctionnalités :**

1. **Statistiques** : 3 cartes KPI (commandes reçues, événements actifs, stockage utilisé)
2. **Tableau des commandes** :
   - Colonnes : Client, Événement, Formule, Statut, Date, Actions
   - Données réelles fusionnées avec données mock
   - Badge de statut coloré (Actif = vert, En attente = jaune, Suspendu = rouge)
   - Toggle pour activer/suspendre un événement (optimistic update + PATCH)
   - Skeleton loading pendant le chargement

---

## 📡 API Routes

| Méthode | Route | Description |
|----------|-------|-------------|
| `GET` | `/api` | Health check |
| `GET` | `/api/events` | Liste tous les événements (avec count invités/photos) |
| `POST` | `/api/events` | Crée un nouvel événement |
| `GET` | `/api/guests?eventId=xxx` | Liste les invités d’un événement |
| `POST` | `/api/rsvp` | Met à jour le statut RSVP d’un invité |
| `POST` | `/api/checkin` | Enregistre l’entrée d’un invité via QR token |
| `GET` | `/api/photographer/validate?token=xxx` | Valide le token photographe |
| `POST` | `/api/photographer/upload` | Enregistre les photos uploadées |
| `POST` | `/api/seed` | Initialise les données de démonstration |

---

## 🌐 Internationalisation (i18n)

Le système i18n est basé sur du **Context React** (pas de middleware ni de routing par locale).

### Langues disponibles

| Code | Langue | Direction |
|------|--------|-----------|
| `fr` | Français | LTR |
| `en` | English | LTR |
| `ar` | العربية | **RTL** |
| `es` | Español | LTR |

### Fonctionnement

1. `LanguageProvider` (context) maintient la locale active
2. `translations.ts` (~600 lignes) contient toutes les clés pour les 4 langues
3. Chaque section (nav, hero, howItWorks, templates, comparison, qr, pricing, testimonials, faq, footer) a ses propres clés typées
4. `useLanguage()` retourne `{ locale, setLocale, t, dir }`
5. Le passage à l’arabe synchronise automatiquement `document.documentElement.dir = 'rtl'`

---

## 💰 Multi-Devises

### Devises supportées

| Code | Symbole | Taux (base FCFA) | Décimales |
|------|---------|-----------------|------------|
| `FCFA` | (aucun) | 1 | 0 |
| `EUR` | € | 0.00152 | 2 |
| `USD` | $ | 0.00164 | 2 |
| `GBP` | £ | 0.00128 | 2 |

### Fonctionnement

1. `CurrencyProvider` (context) maintient la devise active
2. `formatPrice(fcfaAmount)` convertit et formate : `5 000 FCFA` ou `€7.60`
3. `convert(fcfaAmount)` retourne le nombre converti brut
4. Tous les prix sont stockés en FCFA et convertis à l’affichage

---

## 🎨 Design System

### Palette

| Token | Couleur | Usage |
|-------|---------|-------|
| `--ivory` | `#FAF7F2` | Fond principal, crème ivoire |
| `--gold` | `#D4AF37` | Accent premium, bordures, boutons CTA |
| `--gold-light` | `#E8D48B` | Surbrillance or, dégradés |
| `--bordeaux` | `#5C1D24` | Bordelais royal, accents, bandes |
| `--ebony` | `#1A1818` | Texte principal, ébène profond |
| `--cream` | `#F0EBE3` | Fond secondaire, muet |

### Typographies

| Classe | Police | Usage |
|---------|--------|-------|
| `font-display` / `font-display-bold` | Cormorant Garamond | Titres, en-têtes |
| `font-body` | Plus Jakarta Sans | Corps de texte, UI |
| `font-script` | Great Vibes | Signatures, accents décoratifs |

### Effets CSS personnalisés

- `.card-luxury` : carte avec bordure dorée subtile et ombre légère
- `.card-luxury-elevated` : carte surélevée avec ombre renforcée
- `.border-gold-glow` : bordure dorée avec halo lumineux
- `.text-gold-gradient` : texte avec dégradé or 3 tons
- `.bg-champagne-shimmer` : fond animé champagne scintillant
- `.glass-luxury` : glassmorphism avec backdrop-filter
- `.btn-luxury` : bouton avec hover glow doré
- `.divider-ornament` : séparateur avec gradient doré central
- `.tracking-luxury` / `.tracking-luxury-wide` : espacement premium majuscule

### Animations

- `animate-fade-up` / `animate-fade-in` / `animate-scale-in`
- `animate-gold-pulse` : pulsation lumineuse dorée
- `animate-slide-in-bottom` : apparition par le bas
- `animate-delay-*` : utilitaires de délai (100ms à 1000ms)

---

## ⚙️ Composants clés

### Composants publics

| Fichier | Description |
|---------|-------------|
| `PublicNavbar.tsx` | Barre de navigation avec i18n, devise, scroll, mobile |

### Composants invitation

| Fichier | Description |
|---------|-------------|
| `EnvelopeHero.tsx` | Animation d’ouverture (enveloppe + sceau ou rideaux de velours) |
| `GuestRSVPModal.tsx` | Modal de réponse RSVP (confirmé/décliné, accompagnateurs, menu) |
| `GuestPassPDF.tsx` | Génération de pass d’accès PDF avec QR code |

### Composants organisateur

| Fichier | Description |
|---------|-------------|
| `QRCheckInScanner.tsx` | Scanner QR caméra + saisie manuelle pour le check-in Jour J |
| `NoCodeEditor.tsx` | Éditeur de template (couleurs, animation, musique, preview) |
| `WhatsAppOrderCheckout.tsx` | Sélection de forfait + redirection WhatsApp |

### Composants photographe

| Fichier | Description |
|---------|-------------|
| `PhotographerUpload.tsx` | Interface drag & drop d’upload avec progression |
| `ProtectedPhotoGallery.tsx` | Galerie protégée par code avec lightbox |

---

## 📱 State Management

L’état global est géré par **Zustand** (`useAppStore`) :

- Navigation entre les vues
- Données de l’événement mock (6 invités, 4 photos)
- État de l’animation d’enveloppe
- Modals (RSVP, Pass PDF, Scanner QR)
- Galerie protégée (code d’accès)
- Mise à jour RSVP et check-in d’un invité
- Plans tarifaires

---

## 📦 Cloudinary (Gestion médias)

Le module `src/lib/cloudinary.ts` fournit :

- `buildUrl(publicId, options)` : URL avec transformations (crop, resize, format, qualité)
- `buildThumbnailUrl(publicId)` : miniature WebP 400px
- `buildHDUrl(publicId)` : original HD JPEG qualité 95
- `buildSrcset(publicId, widths)` : attribut `srcset` responsive
- `getUploadEndpoint()` : URL d’upload Cloudinary
- `buildUploadPayload(file)` : FormData prêt à envoyer
- `processUploadResponse(response)` : parsing de la réponse Cloudinary
- `buildMediaUrl(publicId)` : URL pour vidéo/audio
- `getPlaceholderUrl(w, h)` : placeholder SVG pour démo

> En production, les variables `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` doivent être configurées.

---

## 🚀 Installation & Démarrage

### Prérequis

- **Node.js** 18+ ou **Bun** (recommandé)
- **npm** ou **bun** comme gestionnaire de paquets

### Installation

```bash
# Cloner le dépôt
cd elegance
git clone <repo-url> .

# Installer les dépendances
bun install
# ou
npm install
```

### Configuration de la base de données

```bash
# Générer le client Prisma
bun run db:generate

# Pousser le schéma vers la base SQLite
cp .env.example .env  # si applicable
bun run db:push
```

### Initialiser les données de démonstration

```bash
curl -X POST http://localhost:3000/api/seed
```

Cela crée :
- 1 événement « Mariage de Yasmine & Karim »
- 6 invités avec codes d’accès et tokens QR uniques
- Le token photographe : `photog-mariage-2026`

### Démarrage en développement

```bash
 
```

L’application est accessible sur [http://localhost:3000](http://localhost:3000).

### Build de production

```bash
bun run build
bun run start
```

Le serveur démarre sur le port 3000 en mode standalone.

---

## 🔍 Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| `dev` | `bun run dev` | Serveur de développement (port 3000, Turbopack) |
| `build` | `bun run build` | Build de production (standalone) |
| `start` | `bun run start` | Serveur de production |
| `lint` | `bun run lint` | Linting ESLint |
| `db:push` | `bun run db:push` | Pousser le schéma Prisma vers la DB |
| `db:generate` | `bun run db:generate` | Générer le client Prisma |
| `db:migrate` | `bun run db:migrate` | Migrations Prisma |
| `db:reset` | `bun run db:reset` | Réinitialiser la base de données |

---

## 📋 Formules tarifaires

| Formule | Prix | Invités | Photos | Fonctionnalités clés |
|---------|------|---------|--------|-------------------|
| **Essentielle** | 5 000 FCFA | 50 | 20 | Invitation numérique, QR RSVP, Pass PDF, support WhatsApp |
| **Prestige** ⭐ | 10 000 FCFA | 200 | 100 | + Animations premium, musique, scanner check-in, frise chronologique |
| **Privilège** | 15 000 FCFA | 500 | Illimité | + Espace photographe, galerie HD, domaine personnalisé, assistance 24/7 |

---

## 🌐 Technologies

| Catégorie | Technologies |
|-------------|---------------|
| **Framework** | Next.js 16 (App Router, Turbopack, Standalone output) |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Framer Motion 12 |
| **UI** | shadcn/ui (Radix primitives), Sonner (toasts) |
| **State** | Zustand, React Context (i18n + devise) |
| **ORM** | Prisma 6 (SQLite, migrable vers PostgreSQL/Supabase) |
| **Fonts** | Google Fonts (Cormorant Garamond, Plus Jakarta Sans, Great Vibes) |
| **PDF** | jsPDF |
| **QR** | qrcode.react, html5-qrcode |
| **Médias** | Cloudinary SDK (upload, transformations, galerie) |
| **Formulaires** | React Hook Form + Zod |
| **Auth** | NextAuth.js (prêt à configurer) |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit |
| **Éditeur** | @mdxeditor/editor |
| **Runtime** | Bun (par défaut), Node.js compatible |

---

## 📁 Structure des fichiers

```
élégance/
├ prisma/
│  └ schema.prisma              # Schéma de base de données
├ public/
│  └ logo.svg                   # Logo Élégance
├ src/
│  ├ app/
│  │  ├ layout.tsx               # Layout racine (fonts, providers, metadata)
│  │  ├ globals.css              # Design system CSS complet
│  │  ├ page.tsx                  # Vitrine (landing page) ~1050 lignes
│  │  ├ login/page.tsx            # Page de connexion
│  │  ├ dashboard/page.tsx        # Espace organisateur
│  │  ├ admin/page.tsx            # Panneau d’administration
│  │  ├ m/[slug]/page.tsx         # Expérience invitation invité
│  │  └ photographer/[token]/page.tsx  # Portail photographe
│  ├ api/
│  │  ├ route.ts                # Health check
│  │  ├ events/route.ts         # CRUD événements
│  │  ├ guests/route.ts         # Liste invités
│  │  ├ rsvp/route.ts           # Mise à jour RSVP
│  │  ├ checkin/route.ts        # Check-in QR
│  │  ├ seed/route.ts           # Initialisation démo
│  │  └ photographer/
│  │     ├ validate/route.ts    # Validation token
│  │     └ upload/route.ts      # Upload photos
│  ├ components/
│  │  ├ public/
│  │  │  └ PublicNavbar.tsx        # Navigation i18n + devise
│  │  ├ invitation/
│  │  │  ├ EnvelopeHero.tsx        # Animation ouverture
│  │  │  ├ GuestRSVPModal.tsx     # Modal RSVP
│  │  │  └ GuestPassPDF.tsx       # Pass PDF + QR
│  │  ├ organizer/
│  │  │  ├ QRCheckInScanner.tsx   # Scanner QR caméra
│  │  │  ├ NoCodeEditor.tsx       # Éditeur no-code
│  │  │  └ WhatsAppOrderCheckout.tsx # Commande WhatsApp
│  │  ├ photographer/
│  │  │  ├ PhotographerUpload.tsx  # Upload drag & drop
│  │  │  └ ProtectedPhotoGallery.tsx # Galerie protégée
│  │  ├ ui/                       # Composants shadcn/ui (40+ composants)
│  │  └ Providers.tsx            # Wrapper LanguageProvider + CurrencyProvider
│  ├ context/
│  │  ├ LanguageContext.tsx       # i18n (FR/EN/AR/ES)
│  │  └ CurrencyContext.tsx       # Multi-devises (FCFA/EUR/USD/GBP)
│  ├ i18n/
│  │  └ translations.ts           # ~600 lignes de traductions
│  ├ store/
│  │  └ useAppStore.ts           # État global Zustand
│  ├ lib/
│  │  ├ db.ts                    # Client Prisma singleton
│  │  ├ cloudinary.ts            # Utilitaires Cloudinary
│  │  └ utils.ts                 # Utilitaires généraux (cn, etc.)
│  └ hooks/
│     ├ use-toast.ts             # Hook de toast
│     └ use-mobile.ts            # Détection mobile
├ package.json
├ tailwind.config.ts
├ next.config.ts                 # Output standalone + images
├ tsconfig.json
├ components.json                # Config shadcn/ui
└ Caddyfile                     # Reverse proxy (déploiement)
```

---

## 🏁 Parcours utilisateur typique

### Pour le client (organisateur)

```
1. Visite la vitrine (/) → Découvre les modèles et tarifs
2. Clique « Commander » → Redirigé vers WhatsApp
3. Reçoit ses identifiants → Se connecte (/login)
4. Arrive sur le dashboard (/dashboard)
5. Personnalise son invitation (éditeur no-code)
6. Ajoute ses invités (nom, email, téléphone, table)
7. Partage le lien /m/[slug] à ses invités
8. Le Jour J : ouvre le scanner QR pour le check-in
9. Après l’événement : reçoit les photos du photographe
```

### Pour l’invité

```
1. Reçoit le lien /m/[slug] par WhatsApp ou SMS
2. Ouvre l’invitation → Animation d’enveloppe/rideau
3. Découvre les détails (date, lieu, programme, dress code)
4. Remplit le RSVP (confirmation, accompagnateurs, menu)
5. Télécharge son Pass PDF avec QR code
6. Le Jour J : présente son QR à l’entrée
7. Après l’événement : accède à la galerie photo protégée
```

### Pour le photographe

```
1. Reçoit le lien /photographer/[token] par l’organisateur
2. Le token est validé automatiquement
3. Sélectionne la catégorie de photos
4. Glisse-dépose ses photos (ou parcourt)
5. Les photos sont uploadées et optimisées
6. Les invités peuvent voir les photos dans la galerie protégée
```

### Pour l’administrateur

```
1. Se connecte avec admin@elegance.snc&a"eéa"ea
2. Voit le tableau de bord (/admin)
3. Consulte les statistiques (commandes, événements actifs)
4. Gère les activations/suspensions de commandes
5. Suivi du stockage utilisé
```

---

## 💡 Notes techniques

### Prévention des mismatchs d’hydratation

Le hook `useMounted()` est utilisé dans la navbar pour différer l’application des styles dépendants du scroll (scrolled state) jusqu’après le montage côté client. Sans cela, la navbar serait transparente pendant le SSR mais dorée après le hydratation, causant un erreur React.

### Animations déterministes

Les particules d’or du hero et la grille QR sont générées de manière déterministe (tableaux pré-calculés) plutôt qu’avec `Math.random()`. Cela garantit que le rendu SSR et le rendu client produisent exactement le même résultat.

### Mode sombre

Le design system inclut un thème sombre complet (ébène profond + or lumineux) géré par la classe `.dark` sur `<html>`. Les tokens CSS basculent automatiquement via les mêmes variables.

### Output standalone

Le build utilise `output: 'standalone'` pour générer un bundle auto-suffisant, déployable sans `node_modules`. Le script de build copie également les assets statiques et le dossier `public/` dans le répertoire standalone.

---

## 🛑 Configuration Cloudinary (production)

Variables d’environnement à définir :

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=votre-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=votre-preset
CLOUDINARY_API_KEY=votre-api-key
CLOUDINARY_API_SECRET=votre-api-secret
DATABASE_URL=file:./db/custom.db
```

---

## 🏠 Déploiement

L’application est configurée pour être déployée derrière un reverse proxy Caddy (fichier `Caddyfile` inclus).

```bash
# Build
bun run build

# Démarrer
caddy run
# ou
bun run start
```

---

## 📜 Licence

Projet privé © Élégance. Tous droits réservés.