/* ========================================================================== */
/*  Élégance — Internationalisation (FR / EN / AR / ES)                           */
/* ========================================================================== */

export type Locale = "fr" | "en" | "ar" | "es";

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
  es: "Español",
};

export interface Translations {
  nav: {
    models: string;
    howItWorks: string;
    pricing: string;
    clientSpace: string;
  };
  hero: {
    title1: string;
    titleHighlight: string;
    subtitle: string;
    cta1: string;
    cta2: string;
  };
  howItWorks: {
    heading: string;
    subheading: string;
    steps: { num: string; icon: string; title: string; desc: string }[];
  };
  templates: {
    heading: string;
    subheading: string;
    seeDemo: string;
    filters: { label: string; slug: string }[];
  };
  comparison: {
    heading: string;
    subheading: string;
    criteria: string;
    paper: string;
    digital: string;
    rows: { label: string; paper: string; digital: string }[];
  };
  qr: {
    heading1: string;
    heading2: string;
    desc: string;
    benefits: string[];
  };
  pricing: {
    heading: string;
    subheading: string;
    popular: string;
    order: string;
    tiers: {
      name: string;
      priceFcfa: number;
      features: string[];
      recommended?: boolean;
    }[];
  };
  testimonials: {
    heading: string;
    subheading: string;
    items: { name: string; location: string; text: string; role: string }[];
  };
  faq: {
    heading: string;
    subheading: string;
    items: { q: string; a: string }[];
  };
  footer: {
    terms: string;
    privacy: string;
    contact: string;
    copyright: string;
    staffAccess: string;
  };
}

/* -------------------------------------------------------------------------- */
/*  FR — Français (source)                                                  */
/* -------------------------------------------------------------------------- */

const fr: Translations = {
  nav: {
    models: "Nos Modèles",
    howItWorks: "Comment ça marche",
    pricing: "Tarifs",
    clientSpace: "Espace Client",
  },
  hero: {
    title1: "Des Invitations Numériques",
    titleHighlight: "d'Exception",
    subtitle:
      "Transformez chaque mariage en une expérience inoubliable avec des invitations sur mesure, un suivi RSVP intelligent et une galerie souvenir privée.",
    cta1: "Créer mon Invitation",
    cta2: "Découvrir nos Modèles",
  },
  howItWorks: {
    heading: "Comment ça Marche",
    subheading: "Trois étapes simples pour créer votre invitation de rêve.",
    steps: [
      { num: "01", icon: "palette", title: "Choisissez votre Modèle", desc: "Parmi notre collection exclusive de templates luxueux." },
      { num: "02", icon: "pen-tool", title: "Personnalisez Chaque Détail", desc: "Textes, photos, musique, programme — tout est modifiable." },
      { num: "03", icon: "send", title: "Invitez & Suivez en Temps Réel", desc: "Vos invités reçoivent un lien, confirment par QR code, et accèdent à la galerie." },
    ],
  },
  templates: {
    heading: "Nos Modèles d'Exception",
    subheading: "Chaque design est une œuvre unique, conçue avec passion.",
    seeDemo: "Voir la démo",
    filters: [
      { label: "Tous", slug: "all" },
      { label: "Porte Orientale", slug: "orientale" },
      { label: "Cachet de Cire", slug: "cire" },
      { label: "Ruban de Soie", slug: "ruban" },
      { label: "Bohème", slug: "boheme" },
      { label: "Minimaliste", slug: "minimaliste" },
    ],
  },
  comparison: {
    heading: "Papier Traditionnel vs Invitation Numérique",
    subheading: "Pourquoi des milliers de couples font le choix du digital.",
    criteria: "Critères",
    paper: "Papier Traditionnel",
    digital: "Élégance Numérique",
    rows: [
      { label: "Coût moyen (100 invités)", paper: "150 000 – 300 000 FCFA", digital: "5 000 – 15 000 FCFA" },
      { label: "Délai de production", paper: "2 – 4 semaines", digital: "Quelques heures" },
      { label: "Suivi RSVP", paper: "Manuel (appels, SMS)", digital: "Automatique en temps réel" },
      { label: "Mise à jour dernière minute", paper: "Impossible", digital: "Instantanée" },
      { label: "Galerie photo partagée", paper: "Non", digital: "Oui, protégée par QR" },
      { label: "Check-in Jour J", paper: "Liste papier", digital: "Scan QR instantané" },
      { label: "Impact écologique", paper: "Élevé (papier, transport)", digital: "Quasi nul" },
      { label: "Personnalisation", paper: "Limitée", digital: "Totale (texte, musique, couleurs)" },
    ],
  },
  qr: {
    heading1: "Vos Invités Scannent",
    heading2: "leur QR Code",
    desc: "Le jour J, chaque invité présente son QR code personnel à l'entrée. Un scan instantané valide sa présence — zéro file d'attente, zéro confusion.",
    benefits: [
      "Check-in instantané et sans contact",
      "Liste des présents mise à jour en temps réel",
      "Statistiques de fréquentation en direct",
      "Sécurité renforcée contre les intrusions",
    ],
  },
  pricing: {
    heading: "Tarifs & Formules",
    subheading: "Des formules conçues pour sublimer chaque mariage, quel que soit votre budget.",
    popular: "Populaire",
    order: "Commander",
    tiers: [
      {
        name: "Essentielle",
        priceFcfa: 5000,
        features: [
          "Invitation numérique personnalisée",
          "Suivi RSVP",
          "Pass PDF nominatif",
          "QR Code de sécurité",
        ],
      },
      {
        name: "Prestige",
        priceFcfa: 10000,
        recommended: true,
        features: [
          "Invitation numérique personnalisée",
          "Suivi RSVP",
          "Pass PDF nominatif",
          "QR Code de sécurité",
          "Galerie photo protégée",
          "Lecteur musique",
          "Éditeur en ligne avancé",
        ],
      },
      {
        name: "Privilège",
        priceFcfa: 15000,
        features: [
          "Invitation numérique personnalisée",
          "Suivi RSVP",
          "Pass PDF nominatif",
          "QR Code de sécurité",
          "Galerie photo protégée",
          "Lecteur musique",
          "Éditeur en ligne avancé",
          "Scanner QR Jour J",
          "Accès photographe dédié",
          "Support prioritaire",
        ],
      },
    ],
  },
  testimonials: {
    heading: "Ce que Disent nos Couples",
    subheading: "Des milliers de mariages réussis grâce à Élégance.",
    items: [
      {
        name: "Aminata & Karim",
        location: "Dakar, Sénégal",
        text: "Nos invités ont été émerveillés par l'animation d'ouverture ! Le suivi RSVP nous a évité des dizaines d'appels. Un gain de temps énorme.",
        role: "Mariage Prestige – 250 invités",
      },
      {
        name: "Fatou & Omar",
        location: "Abidjan, Côte d'Ivoire",
        text: "Le scanner QR le jour J a été un vrai plus. Pas de file d'attente, tout était fluide. La galerie photo est magnifique.",
        role: "Mariage Privilège – 400 invités",
      },
      {
        name: "Safiya & Youssef",
        location: "Casablanca, Maroc",
        text: "Le modèle Porte Orientale correspondait parfaitement à notre thème. L'outil est simple, même mes parents ont pu l'utiliser !",
        role: "Mariage Essentielle – 150 invités",
      },
    ],
  },
  faq: {
    heading: "Questions Fréquentes",
    subheading: "Tout ce que vous devez savoir avant de commencer.",
    items: [
      {
        q: "Combien de temps faut-il pour créer mon invitation ?",
        a: "En moyenne, la personnalisation complète prend entre 30 minutes et 2 heures selon la formule choisie. Une fois validée, votre invitation est immédiatement en ligne.",
      },
      {
        q: "Mes invités ont-ils besoin d'une application pour consulter l'invitation ?",
        a: "Non, absolument pas. Votre invitation est accessible via un simple lien URL ou QR code, directement dans le navigateur de n'importe quel téléphone.",
      },
      {
        q: "Puis-je modifier mon invitation après l'envoi ?",
        a: "Oui ! C'est l'un des grands avantages du numérique. Vous pouvez modifier les textes, horaires, lieu et même ajouter des photos à tout moment. Les changements sont instantanés.",
      },
      {
        q: "Comment fonctionne le paiement ?",
        a: "Le paiement se fait via un lien sécurisé ou directement par WhatsApp. Nous acceptons le paiement unique, sans abonnement ni frais cachés.",
      },
      {
        q: "Le scanner QR fonctionne-t-il sans connexion internet ?",
        a: "Le scanner de l'organisateur fonctionne mieux avec internet pour synchroniser en temps réel, mais il peut fonctionner en mode hors-ligne et se synchroniser dès la connexion rétablie.",
      },
    ],
  },
  footer: {
    terms: "Conditions d'utilisation",
    privacy: "Politique de confidentialité",
    contact: "Contact",
    copyright: "© 2026 Élégance. Tous droits réservés.",
    staffAccess: "Accès Staff / Photographe / Admin",
  },
};

/* -------------------------------------------------------------------------- */
/*  EN — English                                                            */
/* -------------------------------------------------------------------------- */

const en: Translations = {
  nav: {
    models: "Our Templates",
    howItWorks: "How It Works",
    pricing: "Pricing",
    clientSpace: "Client Space",
  },
  hero: {
    title1: "Exquisite Digital",
    titleHighlight: "Wedding Invitations",
    subtitle:
      "Transform every wedding into an unforgettable experience with bespoke invitations, intelligent RSVP tracking, and a private souvenir gallery.",
    cta1: "Create My Invitation",
    cta2: "Discover Our Templates",
  },
  howItWorks: {
    heading: "How It Works",
    subheading: "Three simple steps to create your dream invitation.",
    steps: [
      { num: "01", icon: "palette", title: "Choose Your Template", desc: "From our exclusive collection of luxury designs." },
      { num: "02", icon: "pen-tool", title: "Customise Every Detail", desc: "Texts, photos, music, schedule — everything is editable." },
      { num: "03", icon: "send", title: "Invite & Track in Real Time", desc: "Your guests receive a link, confirm with a QR code, and access the gallery." },
    ],
  },
  templates: {
    heading: "Our Exceptional Templates",
    subheading: "Each design is a unique work of art, crafted with passion.",
    seeDemo: "See demo",
    filters: [
      { label: "All", slug: "all" },
      { label: "Oriental Door", slug: "orientale" },
      { label: "Wax Seal", slug: "cire" },
      { label: "Silk Ribbon", slug: "ruban" },
      { label: "Bohemian", slug: "boheme" },
      { label: "Minimalist", slug: "minimaliste" },
    ],
  },
  comparison: {
    heading: "Traditional Paper vs Digital Invitation",
    subheading: "Why thousands of couples are choosing digital.",
    criteria: "Criteria",
    paper: "Traditional Paper",
    digital: "Élégance Digital",
    rows: [
      { label: "Average cost (100 guests)", paper: "150 000 – 300 000 FCFA", digital: "5 000 – 15 000 FCFA" },
      { label: "Production time", paper: "2 – 4 weeks", digital: "A few hours" },
      { label: "RSVP tracking", paper: "Manual (calls, SMS)", digital: "Automatic real-time" },
      { label: "Last-minute updates", paper: "Impossible", digital: "Instant" },
      { label: "Shared photo gallery", paper: "No", digital: "Yes, QR-protected" },
      { label: "Day-of check-in", paper: "Paper list", digital: "Instant QR scan" },
      { label: "Environmental impact", paper: "High (paper, transport)", digital: "Virtually zero" },
      { label: "Customisation", paper: "Limited", digital: "Full (text, music, colours)" },
    ],
  },
  qr: {
    heading1: "Your Guests Scan",
    heading2: "Their QR Code",
    desc: "On the big day, each guest presents their personal QR code at the entrance. An instant scan validates their attendance — zero queues, zero confusion.",
    benefits: [
      "Instant contactless check-in",
      "Real-time attendance list updates",
      "Live attendance statistics",
      "Enhanced security against gatecrashers",
    ],
  },
  pricing: {
    heading: "Pricing & Plans",
    subheading: "Plans designed to enhance every wedding, whatever your budget.",
    popular: "Popular",
    order: "Order Now",
    tiers: [
      {
        name: "Essential",
        priceFcfa: 5000,
        features: [
          "Personalised digital invitation",
          "RSVP tracking",
          "Named PDF pass",
          "Security QR code",
        ],
      },
      {
        name: "Prestige",
        priceFcfa: 10000,
        recommended: true,
        features: [
          "Personalised digital invitation",
          "RSVP tracking",
          "Named PDF pass",
          "Security QR code",
          "Protected photo gallery",
          "Music player",
          "Advanced online editor",
        ],
      },
      {
        name: "Privilege",
        priceFcfa: 15000,
        features: [
          "Personalised digital invitation",
          "RSVP tracking",
          "Named PDF pass",
          "Security QR code",
          "Protected photo gallery",
          "Music player",
          "Advanced online editor",
          "Day-of QR scanner",
          "Dedicated photographer access",
          "Priority support",
        ],
      },
    ],
  },
  testimonials: {
    heading: "What Our Couples Say",
    subheading: "Thousands of successful weddings thanks to Élégance.",
    items: [
      {
        name: "Aminata & Karim",
        location: "Dakar, Senegal",
        text: "Our guests were amazed by the opening animation! The RSVP tracking saved us dozens of calls. A huge time-saver.",
        role: "Prestige Wedding – 250 guests",
      },
      {
        name: "Fatou & Omar",
        location: "Abidjan, Ivory Coast",
        text: "The QR scanner on the big day was a real plus. No queues, everything was smooth. The photo gallery is beautiful.",
        role: "Privilege Wedding – 400 guests",
      },
      {
        name: "Safiya & Youssef",
        location: "Casablanca, Morocco",
        text: "The Oriental Door template matched our theme perfectly. The tool is simple, even my parents could use it!",
        role: "Essential Wedding – 150 guests",
      },
    ],
  },
  faq: {
    heading: "Frequently Asked Questions",
    subheading: "Everything you need to know before getting started.",
    items: [
      {
        q: "How long does it take to create my invitation?",
        a: "On average, full customisation takes between 30 minutes and 2 hours depending on the plan. Once validated, your invitation is immediately online.",
      },
      {
        q: "Do my guests need an app to view the invitation?",
        a: "Not at all. Your invitation is accessible via a simple URL link or QR code, directly in any phone's browser.",
      },
      {
        q: "Can I modify my invitation after sending it?",
        a: "Yes! That is one of the great advantages of digital. You can modify texts, times, venue and even add photos at any time. Changes are instant.",
      },
      {
        q: "How does payment work?",
        a: "Payment is made via a secure link or directly through WhatsApp. We accept one-time payments, no subscription or hidden fees.",
      },
      {
        q: "Does the QR scanner work without internet?",
        a: "The organiser scanner works best with internet for real-time sync, but it can work offline and synchronise as soon as the connection is restored.",
      },
    ],
  },
  footer: {
    terms: "Terms of Use",
    privacy: "Privacy Policy",
    contact: "Contact",
    copyright: "© 2026 Élégance. All rights reserved.",
    staffAccess: "Staff / Photographer / Admin Access",
  },
};

/* -------------------------------------------------------------------------- */
/*  ES — Español                                                            */
/* -------------------------------------------------------------------------- */

const es: Translations = {
  nav: {
    models: "Nuestros Modelos",
    howItWorks: "Cómo Funciona",
    pricing: "Precios",
    clientSpace: "Espacio Cliente",
  },
  hero: {
    title1: "Invitaciones Digitales de",
    titleHighlight: "Excepción",
    subtitle:
      "Transforma cada boda en una experiencia inolvidable con invitaciones a medida, seguimiento RSVP inteligente y una galería privada de recuerdos.",
    cta1: "Crear mi Invitación",
    cta2: "Descubrir Modelos",
  },
  howItWorks: {
    heading: "Cómo Funciona",
    subheading: "Tres simples pasos para crear la invitación de tus sueños.",
    steps: [
      { num: "01", icon: "palette", title: "Elige tu Modelo", desc: "De nuestra colección exclusiva de plantillas de lujo." },
      { num: "02", icon: "pen-tool", title: "Personaliza Cada Detalle", desc: "Textos, fotos, música, programa — todo es modificable." },
      { num: "03", icon: "send", title: "Invita y Sigue en Tiempo Real", desc: "Tus invitados reciben un enlace, confirman con código QR y acceden a la galería." },
    ],
  },
  templates: {
    heading: "Nuestros Modelos Excepcionales",
    subheading: "Cada diseño es una obra única, creada con pasión.",
    seeDemo: "Ver demo",
    filters: [
      { label: "Todos", slug: "all" },
      { label: "Puerta Oriental", slug: "orientale" },
      { label: "Sello de Cera", slug: "cire" },
      { label: "Cinta de Seda", slug: "ruban" },
      { label: "Bohemio", slug: "boheme" },
      { label: "Minimalista", slug: "minimaliste" },
    ],
  },
  comparison: {
    heading: "Papel Tradicional vs Invitación Digital",
    subheading: "Por qué miles de parejas eligen el formato digital.",
    criteria: "Criterios",
    paper: "Papel Tradicional",
    digital: "Élégance Digital",
    rows: [
      { label: "Coste medio (100 invitados)", paper: "150 000 – 300 000 FCFA", digital: "5 000 – 15 000 FCFA" },
      { label: "Tiempo de producción", paper: "2 – 4 semanas", digital: "Unas horas" },
      { label: "Seguimiento RSVP", paper: "Manual (llamadas, SMS)", digital: "Automático en tiempo real" },
      { label: "Cambios de última hora", paper: "Imposible", digital: "Instantáneo" },
      { label: "Galería de fotos compartida", paper: "No", digital: "Sí, protegida con QR" },
      { label: "Check-in el día de la boda", paper: "Lista en papel", digital: "Escaneo QR instantáneo" },
      { label: "Impacto ecológico", paper: "Alto (papel, transporte)", digital: "Prácticamente nulo" },
      { label: "Personalización", paper: "Limitada", digital: "Total (texto, música, colores)" },
    ],
  },
  qr: {
    heading1: "Tus Invitados Escanean",
    heading2: "su Código QR",
    desc: "El día de la boda, cada invitado presenta su código QR personal en la entrada. Un escaneo instantáneo valida su asistencia — cero colas, cero confusión.",
    benefits: [
      "Check-in instantáneo sin contacto",
      "Lista de asistentes actualizada en tiempo real",
      "Estadísticas de asistencia en directo",
      "Seguridad reforzada contra intrusos",
    ],
  },
  pricing: {
    heading: "Precios y Planes",
    subheading: "Planes diseñados para realzar cada boda, sea cual sea tu presupuesto.",
    popular: "Popular",
    order: "Pedir Ahora",
    tiers: [
      {
        name: "Esencial",
        priceFcfa: 5000,
        features: [
          "Invitación digital personalizada",
          "Seguimiento RSVP",
          "Pase PDF nominativo",
          "Código QR de seguridad",
        ],
      },
      {
        name: "Prestigio",
        priceFcfa: 10000,
        recommended: true,
        features: [
          "Invitación digital personalizada",
          "Seguimiento RSVP",
          "Pase PDF nominativo",
          "Código QR de seguridad",
          "Galería de fotos protegida",
          "Reproductor de música",
          "Editor avanzado online",
        ],
      },
      {
        name: "Privilegio",
        priceFcfa: 15000,
        features: [
          "Invitación digital personalizada",
          "Seguimiento RSVP",
          "Pase PDF nominativo",
          "Código QR de seguridad",
          "Galería de fotos protegida",
          "Reproductor de música",
          "Editor avanzado online",
          "Escáner QR día de la boda",
          "Acceso fotógrafo dedicado",
          "Soporte prioritario",
        ],
      },
    ],
  },
  testimonials: {
    heading: "Lo que Dicen Nuestras Parejas",
    subheading: "Miles de bodas exitosas gracias a Élégance.",
    items: [
      {
        name: "Aminata & Karim",
        location: "Dakar, Senegal",
        text: "Nuestros invitados quedaron maravillados con la animación de apertura. El seguimiento RSVP nos ahorró decenas de llamadas.",
        role: "Boda Prestigio – 250 invitados",
      },
      {
        name: "Fatou & Omar",
        location: "Abidjan, Costa de Marfil",
        text: "El escáner QR el día de la boda fue un verdadero plus. Sin colas, todo fluido. La galería de fotos es preciosa.",
        role: "Boda Privilegio – 400 invitados",
      },
      {
        name: "Safiya & Youssef",
        location: "Casablanca, Marruecos",
        text: "El modelo Puerta Oriental combinó perfectamente con nuestro tema. La herramienta es sencilla, hasta mis padres pudieron usarla.",
        role: "Boda Esencial – 150 invitados",
      },
    ],
  },
  faq: {
    heading: "Preguntas Frecuentes",
    subheading: "Todo lo que necesitas saber antes de empezar.",
    items: [
      {
        q: "¿Cuánto tiempo se tarda en crear mi invitación?",
        a: "De media, la personalización completa tarda entre 30 minutos y 2 horas según el plan. Una vez validada, tu invitación está inmediatamente online.",
      },
      {
        q: "¿Mis invitados necesitan una app para ver la invitación?",
        a: "Para nada. Tu invitación es accesible mediante un simple enlace URL o código QR, directamente en el navegador de cualquier teléfono.",
      },
      {
        q: "¿Puedo modificar mi invitación después de enviarla?",
        a: "¡Sí! Esa es una de las grandes ventajas del formato digital. Puedes modificar textos, horarios, lugar e incluso añadir fotos en cualquier momento.",
      },
      {
        q: "¿Cómo funciona el pago?",
        a: "El pago se realiza mediante un enlace seguro o directamente por WhatsApp. Aceptamos pago único, sin suscripción ni cargos ocultos.",
      },
      {
        q: "¿El escáner QR funciona sin internet?",
        a: "El escáner del organizador funciona mejor con internet para sincronizar en tiempo real, pero puede funcionar sin conexión y sincronizarse al restablecerse.",
      },
    ],
  },
  footer: {
    terms: "Condiciones de uso",
    privacy: "Política de privacidad",
    contact: "Contacto",
    copyright: "© 2026 Élégance. Todos los derechos reservados.",
    staffAccess: "Acceso Staff / Fotógrafo / Admin",
  },
};

/* -------------------------------------------------------------------------- */
/*  AR — العربية                                                            */
/* -------------------------------------------------------------------------- */

const ar: Translations = {
  nav: {
    models: "قوالبنا",
    howItWorks: "كيف يعمل",
    pricing: "الأسعار",
    clientSpace: "مساحة العميل",
  },
  hero: {
    title1: "دعوات رقمية",
    titleHighlight: "استثنائية",
    subtitle:
      "حوّلوا كل زفاف إلى تجربة لا تُنسى بدعوات مخصصة وتتبع ذكي للردود ومعرض صور خاص.",
    cta1: "أنشئ دعوتي",
    cta2: "اكتشف القوالب",
  },
  howItWorks: {
    heading: "كيف يعمل",
    subheading: "ثلاث خطوات بسيطة لإنشاء الدعوة المثالية.",
    steps: [
      { num: "01", icon: "palette", title: "اختاروا القالب", desc: "من مجموعتنا الحصرية من القوالب الفاخرة." },
      { num: "02", icon: "pen-tool", title: "خصصوا كل تفصيل", desc: "نصوص، صور، موسيقى، برنامج — كل شيء قابل للتعديل." },
      { num: "03", icon: "send", title: "ادعوا وتابعوا في الوقت الفعلي", desc: "يتلقى ضيوفكم رابطًا، يؤكدون برمز QR ويطلعون على المعرض." },
    ],
  },
  templates: {
    heading: "قوالبنا الاستثنائية",
    subheading: "كل تصميم عمل فني فريد، صُنع بشغف.",
    seeDemo: "عرض تجريبي",
    filters: [
      { label: "الكل", slug: "all" },
      { label: "باب شرقي", slug: "orientale" },
      { label: "ختم شمع", slug: "cire" },
      { label: "ربيط حرير", slug: "ruban" },
      { label: "بوهيمي", slug: "boheme" },
      { label: "بسيط", slug: "minimaliste" },
    ],
  },
  comparison: {
    heading: "الورق التقليدي مقابل الدعوة الرقمية",
    subheading: "لماذا يختار آلاف الأزواج التنسيق الرقمي.",
    criteria: "المعايير",
    paper: "الورق التقليدي",
    digital: "Élégance الرقمية",
    rows: [
      { label: "التكلفة المتوسطة (100 ضيف)", paper: "150 000 – 300 000 فرانك", digital: "5 000 – 15 000 فرانك" },
      { label: "مدة الإنتاج", paper: "2 – 4 أسابيع", digital: "بضع ساعات" },
      { label: "متابعة الردود", paper: "يدوية (مكالمات، رسائل)", digital: "تلقائية في الوقت الفعلي" },
      { label: "تعديلات اللحظة الأخيرة", paper: "مستحيل", digital: "فورية" },
      { label: "معرض صور مشترك", paper: "لا", digital: "نعم، محمي بـ QR" },
      { label: "تسجيل الدخول يوم الحدث", paper: "قائمة ورقية", digital: "مسح QR فوري" },
      { label: "الأثر البيئي", paper: "مرتفع (ورق، نقل)", digital: "شبه معدوم" },
      { label: "التخصيص", paper: "محدود", digital: "كامل (نص، موسيقى، ألوان)" },
    ],
  },
  qr: {
    heading1: "ضيوفكم يمسحون",
    heading2: "رمز QR الخاص بهم",
    desc: "في يوم الحدث، يقدم كل ضيف رمز QR الشخصي عند المدخل. مسح فوري يؤكد الحضور — بدون طابور، بدون ارتباك.",
    benefits: [
      "تسجيل دخول فوري بلا تماس",
      "قائمة الحاضرين محدثة في الوقت الفعلي",
      "إحصائيات الحضور مباشرة",
      "أمان معزز ضد التسلل",
    ],
  },
  pricing: {
    heading: "الأسعار والباقات",
    subheading: "باقات مصممة لإظهار كل زفاف، أيا كان ميزانيتكم.",
    popular: "الأكثر شعبية",
    order: "اطلب الآن",
    tiers: [
      {
        name: "الأساسية",
        priceFcfa: 5000,
        features: [
          "دعوة رقمية مخصصة",
          "متابعة RSVP",
          "تاج ملف PDF بالاسم",
          "رمز QR للأمان",
        ],
      },
      {
        name: "البريستيج",
        priceFcfa: 10000,
        recommended: true,
        features: [
          "دعوة رقمية مخصصة",
          "متابعة RSVP",
          "تاج ملف PDF بالاسم",
          "رمز QR للأمان",
          "معرض صور محمي",
          "مشغل موسيقى",
          "محرر انترنتي متقدم",
        ],
      },
      {
        name: "الامتياز",
        priceFcfa: 15000,
        features: [
          "دعوة رقمية مخصصة",
          "متابعة RSVP",
          "تاج ملف PDF بالاسم",
          "رمز QR للأمان",
          "معرض صور محمي",
          "مشغل موسيقى",
          "محرر انترنتي متقدم",
          "ماسح QR يوم الحدث",
          "دخول مصور مخصص",
          "دعم أولوي",
        ],
      },
    ],
  },
  testimonials: {
    heading: "ماذا يقول أزواجنا",
    subheading: "آلاف الأزواج الناجحة بفضل Élégance.",
    items: [
      {
        name: "أميناتا وكريم",
        location: "داكار، السنغال",
        text: "تأثر ضيوفنا بإنفتاح الأنيميشن! متابعة RSVP وفرت علينا عشرات المكالمات.",
        role: "زفاف بريستيج – 250 ضيف",
      },
      {
        name: "فاتو وعمر",
        location: "أبيدجان، ساحل العاج",
        text: "ماسح QR في يوم الحدث كان إضافة حقيقية. بدون طوابير، كل شيء كان سلسًا.",
        role: "زفاف امتياز – 400 ضيف",
      },
      {
        name: "صافية ويوسف",
        location: "الدار البيضاء، المغرب",
        text: "قالب الباب الشرقي طابق موضوعنا بشكل مثالي. الأداة بسيطة، حتى والديّ استطاعوا استخدامها!",
        role: "زفاف أساسية – 150 ضيف",
      },
    ],
  },
  faq: {
    heading: "الأسئلة الشائعة",
    subheading: "كل ما تحتاجون معرفته قبل البدء.",
    items: [
      {
        q: "كم يستغرق إنشاء دعوتي؟",
        a: "في المتوسط، تستغرق التخصيص الكامل 30 دقيقة إلى ساعتين. بعد التحقق، الدعوة فورا أونلاين.",
      },
      {
        q: "هل يحتاج ضيوفي تطبيقًا لعرض الدعوة؟",
        a: "لا بالتأكيد. الدعوة متاحة عبر رابط URL أو رمز QR، مباشرة في متصفح الهاتف.",
      },
      {
        q: "هل أستطيع تعديل الدعوة بعد الإرسال؟",
        a: "نعم! هذا من أكبر مميزات التنسيق الرقمي. يمكنكم تعديل النصوص والمواعيد وإضافة صور في أي وقت.",
      },
      {
        q: "كيف يعمل الدفع؟",
        a: "الدفع عبر رابط آمن أو WhatsApp. دفع مرة واحدة، بدون اشتراك أو رسوم خفية.",
      },
      {
        q: "هل يعمل الماسح بدون إنترنت؟",
        a: "يعمل أفضل مع إنترنت للمزامنة الفورية، لكنه يعمل أيضًا بدون اتصال ويتزامن عند استعادة الاتصال.",
      },
    ],
  },
  footer: {
    terms: "شروط الاستخدام",
    privacy: "سياسة الخصوصية",
    contact: "اتصل بنا",
    copyright: "© 2026 Élégance. جميع الحقوق محفوظة.",
    staffAccess: "دخول الموظفين / المصور / المسؤول",
  },
};

/* -------------------------------------------------------------------------- */
/*  Export map                                                               */
/* -------------------------------------------------------------------------- */

export const TRANSLATIONS: Record<Locale, Translations> = { fr, en, ar, es };
