import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'es';

const STORAGE_KEY = 'preferredLanguage';

const translations = {
  en: {
    nav: {
      howItWorks: 'How It Works',
      ourWork: 'Our Work',
      signIn: 'Sign in',
      discussionDesk: 'Discussion Desk',
      clientInbox: 'Client Inbox',
      growthPartner: 'Growth Partner',
      signOut: 'Sign out',
      getStarted: 'Get started',
      landingOverview: 'Landing Overview',
      live: 'Live',
      liveChat: 'Live Chat'
    },
    hero: {
      headlineLine1: 'Custom software.',
      headlineLine2: 'Built for your needs, budget and timeframe',
      subheadline: 'We scope first. You pay for what matters. No bloat, no surprises.',
      cta: 'Contact us in minutes',
      stat1Value: '1-3 Days',
      stat1Label: 'Average diagnostic',
      stat2Value: '100%',
      stat2Label: 'Code & IP retained',
      stat3Value: 'Your Budget',
      stat3Label: 'We scope around it',
      cardTitle: 'How It Works',
      cardBadge: 'Simple 3-Step Process',
      step1Title: 'Understand What You Need',
      step1Desc: 'Whatever you’re building, we dig into your goals and requirements to figure out exactly what to build — and shape it around your budget.',
      step2Title: 'Get a Clear Plan & Timeline',
      step2Desc: 'We map out the exact solution and adapt it to your budget, timeframe and project. No confusing tech jargon, no hidden fees.',
      step3Title: 'We Build & Hand It Over',
      step3Desc: 'Ready to use in weeks. You fully own 100% of your software.',
      resultLabel: 'The Result',
      resultText: 'Software that saves your team real time and pays for itself.'
    },
    methodology: {
      eyebrow: 'Our Methodology',
      title: 'A simple, predictable path to operating software.',
      subtitle: 'Four clear steps from problem identification to full production handover.',
      step1Title: 'We understand your project',
      step1Desc: 'Whatever you’re building, we dig into your goals and requirements and shape the right solution around your budget, timeframe and needs.',
      step1Tag: 'Needs & scope review',
      step2Title: 'We propose a solution',
      step2Desc: "Tell you what we'd build, how it works and delivery timeline.",
      step2Tag: 'Solution roadmap & spec',
      step3Title: 'We build it',
      step3Desc: 'Custom software, built for you.',
      step3Tag: 'Shipped in 2–4 weeks',
      step4Title: 'You own it',
      step4Desc: 'Training, handoff, done.',
      step4Tag: 'Full code repository & keys'
    },
    projects: {
      eyebrow: 'Common Projects',
      title: "A few examples of what we've built.",
      subtitle: "Client names stay private but here's the kind of work we do — and there's no fixed price list. Tell us what you're solving for and your budget and we'll shape a plan around it.",
      anonymizedNote: "Details anonymized to protect client privacy. Your project won't look exactly like these — every plan and cost comes out of a conversation with us.",
      ownershipBanner: 'No recurring user licenses or vendor lock-in. You own everything we build.',
      ownershipTitle: '100% Code Ownership:',
      ownershipBadge: 'Complete IP & Code Handover'
    },
    signupCard: {
      title: 'Create your account',
      subtitle: 'Start discussing your project in minutes.',
      signInTitle: 'Welcome back',
      signInSubtitle: 'Sign in to continue your conversation.',
      google: 'Continue with Google',
      emailToggle: 'Log in with email',
      orEmail: 'or with email',
      workEmail: 'Work Email',
      createPassword: 'Create Password',
      password: 'Password',
      minChars: 'Min 8 characters',
      forgotPassword: 'Forgot password?',
      submitting: 'Setting up your workspace...',
      createAccount: 'Create Account & Get Started',
      signIn: 'Sign In',
      alreadyHaveAccount: 'Already have an account? ',
      noAccount: "Don't have an account? ",
      signInLink: 'Sign in to Discussion Desk',
      createAccountLink: 'Create an account',
      alreadyHaveAccountShort: 'I already have an account',
      successCreatedTitle: 'Account Created',
      successWelcomeTitle: 'Welcome Back',
      successSubtitle: 'Setting up your workspace and connecting you with Alexis Cervantes...'
    },
    footer: {
      tagline: 'Custom software. No fluff. Just results.',
      howItWorks: 'How It Works',
      engagementModels: 'Engagement Models',
      getStarted: 'Get started',
      copyright: '© 2025 Socio Software Inc. All rights reserved.',
      budgetFirst: 'Budget-First Scoping',
      codeOwnership: '100% Client Code Ownership',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service'
    },
    affiliate: {
      dashboard: {
        eyebrow: 'Growth Partner Dashboard',
        welcomeBack: 'Welcome back',
        shareLinkDesc: 'Share your link below. You earn 23% of the value of any deal that closes from it.',
        copyLink: 'Copy link',
        copied: 'Copied',
        statLeads: 'Leads referred',
        statDeals: 'Deals closed',
        statPayouts: 'Total payouts',
        referredClientsTitle: 'Your Referred Clients',
        noReferralsYet: 'No referrals yet',
        clientsReferredOne: '1 client referred',
        clientsReferredOther: '{n} clients referred',
        shareLinkPrompt: 'Share your link to start referring clients.',
        tableClient: 'Client',
        tableStatus: 'Status',
        tableDealValue: 'Deal Value',
        tableCommission: 'Your Commission',
        tableAmountPaid: 'Amount Paid',
        statusPaid: 'Paid',
        statusInterested: 'Interested',
        statusNew: 'New Client',
        contactTitle: 'Contact Admin or request a payout',
        contactSubtitle: 'Send a message about your referrals, commission or anything else',
        loadingConversation: 'Loading conversation...',
        noMessagesYet: 'No messages yet — say hello.',
        youLabel: 'You',
        adminLabel: 'Admin',
        messagePlaceholder: 'Message Admin...',
        send: 'Send',
        leadsTitle: 'Proven ways to find high-quality leads',
        leadsSubtitle: "Bigger clients pay you more — here's how to find them",
        statsFooterNote: 'Stats update once our team records a closed deal. Questions about a payout? Reach us at',
        recruitPromptTitle: "Know someone who'd want a remote job?",
        recruitPromptBody: 'Share Socio with them so they can apply as a Growth Partner too.',
        recruitPromptNote: "You don't earn anything for recruiting other Growth Partners — this is completely optional, just a way to spread the word if you'd like to.",
        recruitPromptContinue: 'Continue to playbook'
      },
      clientAccountBlock: {
        eyebrow: 'Growth Partner Program',
        title: 'This account is already a client account',
        desc: "is signed in with a client account, so it can't also register as a growth partner. Sign up for the growth partner program with a different email instead."
      },
      becomeAffiliate: {
        eyebrow: 'Growth Partner Program',
        titlePrefix: 'Become a growth partner as',
        desc: "You're already signed in. Just confirm a couple details to register this account as a growth partner and get your referral link.",
        ageLabel: 'Age',
        ageHint: '(must be 18+)',
        countryLabel: 'Country',
        countryPlaceholder: 'United States',
        settingUp: 'Setting up...',
        becomeButton: 'Become a Growth Partner',
        errorEnterAge: 'Enter your age.',
        errorMinAge: 'You must be at least 18 years old to join the growth partner program.',
        errorEnterCountry: 'Enter your country.',
        errorGeneric: 'Something went wrong. Please try again.'
      },
      onboarding: {
        stepOf7Prefix: 'Step',
        stepOf7Suffix: 'of 7',
        leadsPrompt: 'If you send us',
        avgDealValue: 'avg. $2,500 USD per client',
        confirmedLeadSingular: 'confirmed lead/month',
        confirmedLeadPlural: 'confirmed leads/month',
        youCouldEarn: 'You could earn',
        back: 'Back',
        continue: 'Continue',
        createAccountTitle: 'Create your growth partner account',
        signInTitle: 'Sign in',
        createAccountSubtitle: "Last step — create an account and we'll generate your referral link.",
        signInSubtitle: 'Already a growth partner? Sign in to see your link and stats.',
        fullNamePlaceholder: 'Full name',
        emailPlaceholder: 'Email',
        passwordPlaceholder: 'Password',
        pleaseWait: 'Please wait...',
        createAccountButton: 'Create Account',
        alreadyPartnerSignIn: 'Already a growth partner? Sign in',
        needAccountSignUp: 'Need an account? Sign up'
      }
    },
    affiliateGuide: {
      backToDashboard: 'Back to dashboard',
      eyebrow: 'Growth Partner Playbook',
      title: 'Growth Partner Lead Generation Playbook',
      subtitle: 'Find high-quality software leads without spending hours researching one business.',
      yourReferralLink: 'Your referral link',
      howItWorks: 'How it works',
      whyItWorks: 'Why it works',
      yourAdvantage: 'Your advantage'
    },
    workspace: {
      loading: 'Loading your workspace...',
      briefing: {
        role: 'Lead Systems Architect',
        messageFrom: 'Message from Alexis',
        avgResponse: 'Avg response: 1–5h',
        intro: "Hi, I'm Alexis. I personally read every message that comes in here. Tell me what's slowing your team down or what you'd like us to build, in plain terms, no need to know any technical jargon. I'll ask follow-up questions and let you know what we can do and roughly what it would cost.",
        suggestedStarters: 'Suggested starting points:'
      },
      messageInput: {
        placeholder: 'Explain your ideas, workflow bottlenecks or questions for Alexis...',
        markdownSupported: 'Markdown supported',
        cmdEnterToSend: 'Cmd + Enter to send',
        sendIdea: 'Send Idea'
      },
      attachTooltip: 'Attach file, spec mockup or export',
      schemaTooltip: 'Insert system flow diagram or schema sketch',
      you: 'You',
      architectReplyLabel: 'Reply',
      profileCard: {
        email: 'Email',
        company: 'Company',
        seeOtherExamples: 'See other project examples →'
      },
      filesCard: {
        filesSharedTitle: "Files You've Shared",
        upload: '+ Upload',
        uploading: 'Uploading...',
        dragDrop: 'Drag & drop files here',
        fileTypesHint: 'PDF, CSV, Excel, JSON, YAML, PNG or JPG — up to 20MB each',
        downloadTitle: 'Download file',
        removeTitle: 'Remove file'
      },
      privacyCard: {
        title: 'How We Handle Your Info',
        ndaBadge: "We'll sign an NDA if you'd like one",
        noSellBadge: "We don't sell or share your data",
        questionsLabel: 'Questions? Reach us directly:'
      },
      howThisWorks: {
        title: 'How This Works',
        step1Title: 'We learn about your business',
        step1Desc: "Alexis figures out what's slowing you down (in progress)",
        step2Title: 'We show you the plan and price',
        step2Desc: "You see exactly what we'll build and what it costs before anything starts",
        step3Title: 'We hand everything over',
        step3Desc: 'All the code and access, fully yours'
      },
      fileSharedNoticePrefix: 'Shared file(s):',
      fileReceivedNoticeSingle: 'Alexis received your file and will take a look.',
      fileReceivedNoticeMultiple: 'Alexis received your {n} files and will take a look.',
      systemNoticeSenderName: 'System Notice'
    }
  },
  es: {
    nav: {
      howItWorks: 'Cómo Funciona',
      ourWork: 'Nuestro Trabajo',
      signIn: 'Iniciar sesión',
      discussionDesk: 'Mesa de Discusión',
      clientInbox: 'Bandeja de Clientes',
      growthPartner: 'Socio de Crecimiento',
      signOut: 'Cerrar sesión',
      getStarted: 'Comenzar',
      landingOverview: 'Vista General',
      live: 'En vivo',
      liveChat: 'Chat en vivo'
    },
    hero: {
      headlineLine1: 'Software a medida.',
      headlineLine2: 'Creado para tus necesidades, presupuesto y plazos',
      subheadline: 'Primero definimos el alcance. Pagas solo por lo que importa. Sin relleno, sin sorpresas.',
      cta: 'Contáctanos en minutos',
      stat1Value: '1-3 Días',
      stat1Label: 'Diagnóstico promedio',
      stat2Value: '100%',
      stat2Label: 'Código y PI retenidos',
      stat3Value: 'Tu Presupuesto',
      stat3Label: 'Definimos el alcance en base a él',
      cardTitle: 'Cómo Funciona',
      cardBadge: 'Proceso simple de 3 pasos',
      step1Title: 'Entendemos lo que necesitas',
      step1Desc: 'Sin importar qué estés construyendo, profundizamos en tus objetivos y requisitos para saber exactamente qué construir — y lo adaptamos a tu presupuesto.',
      step2Title: 'Recibes un plan y cronograma claros',
      step2Desc: 'Definimos la solución exacta y la adaptamos a tu presupuesto, plazos y proyecto. Sin jerga técnica confusa, sin cargos ocultos.',
      step3Title: 'Construimos y te lo entregamos',
      step3Desc: 'Listo para usar en semanas. Eres dueño del 100% de tu software.',
      resultLabel: 'El Resultado',
      resultText: 'Software que le ahorra tiempo real a tu equipo y se paga solo.'
    },
    methodology: {
      eyebrow: 'Nuestra Metodología',
      title: 'Un camino simple y predecible hacia el software en producción.',
      subtitle: 'Cuatro pasos claros desde la identificación del problema hasta la entrega completa en producción.',
      step1Title: 'Entendemos tu proyecto',
      step1Desc: 'Sin importar qué estés construyendo, profundizamos en tus objetivos y requisitos, y damos forma a la solución correcta según tu presupuesto, plazos y necesidades.',
      step1Tag: 'Revisión de necesidades y alcance',
      step2Title: 'Proponemos una solución',
      step2Desc: 'Te contamos qué construiríamos, cómo funciona y el cronograma de entrega.',
      step2Tag: 'Hoja de ruta y especificación',
      step3Title: 'Lo construimos',
      step3Desc: 'Software a medida, creado para ti.',
      step3Tag: 'Entregado en 2–4 semanas',
      step4Title: 'Es tuyo',
      step4Desc: 'Capacitación, entrega y listo.',
      step4Tag: 'Repositorio de código completo y claves'
    },
    projects: {
      eyebrow: 'Proyectos Comunes',
      title: 'Algunos ejemplos de lo que hemos construido.',
      subtitle: 'Los nombres de los clientes se mantienen privados pero así es el tipo de trabajo que hacemos — y no hay una lista de precios fija. Cuéntanos qué problema quieres resolver y tu presupuesto, y armaremos un plan a tu medida.',
      anonymizedNote: 'Los detalles se anonimizaron para proteger la privacidad del cliente. Tu proyecto no se verá exactamente igual a estos — cada plan y costo surge de una conversación con nosotros.',
      ownershipBanner: 'Sin licencias de usuario recurrentes ni dependencia de proveedor. Eres dueño de todo lo que construimos.',
      ownershipTitle: 'Propiedad del 100% del Código:',
      ownershipBadge: 'Entrega completa de PI y código'
    },
    signupCard: {
      title: 'Crea tu cuenta',
      subtitle: 'Empieza a discutir tu proyecto en minutos.',
      signInTitle: 'Bienvenido de nuevo',
      signInSubtitle: 'Inicia sesión para continuar tu conversación.',
      google: 'Continuar con Google',
      emailToggle: 'Iniciar sesión con correo',
      orEmail: 'o con correo',
      workEmail: 'Correo de trabajo',
      createPassword: 'Crear contraseña',
      password: 'Contraseña',
      minChars: 'Mínimo 8 caracteres',
      forgotPassword: '¿Olvidaste tu contraseña?',
      submitting: 'Configurando tu espacio de trabajo...',
      createAccount: 'Crear cuenta y comenzar',
      signIn: 'Iniciar sesión',
      alreadyHaveAccount: '¿Ya tienes una cuenta? ',
      noAccount: '¿No tienes una cuenta? ',
      signInLink: 'Iniciar sesión en la Mesa de Discusión',
      createAccountLink: 'Crear una cuenta',
      alreadyHaveAccountShort: 'Ya tengo cuenta',
      successCreatedTitle: 'Cuenta Creada',
      successWelcomeTitle: 'Bienvenido de Nuevo',
      successSubtitle: 'Configurando tu espacio de trabajo y conectándote con Alexis Cervantes...'
    },
    footer: {
      tagline: 'Software a medida. Sin relleno. Solo resultados.',
      howItWorks: 'Cómo Funciona',
      engagementModels: 'Modelos de Colaboración',
      getStarted: 'Comenzar',
      copyright: '© 2025 Socio Software Inc. Todos los derechos reservados.',
      budgetFirst: 'Alcance Basado en Presupuesto',
      codeOwnership: '100% Propiedad del Código del Cliente',
      privacyPolicy: 'Política de Privacidad',
      termsOfService: 'Términos de Servicio'
    },
    affiliate: {
      dashboard: {
        eyebrow: 'Panel de Socio de Crecimiento',
        welcomeBack: 'Bienvenido de nuevo',
        shareLinkDesc: 'Comparte tu enlace a continuación. Ganas el 23% del valor de cualquier acuerdo que se cierre a partir de él.',
        copyLink: 'Copiar enlace',
        copied: 'Copiado',
        statLeads: 'Prospectos referidos',
        statDeals: 'Acuerdos cerrados',
        statPayouts: 'Pagos totales',
        referredClientsTitle: 'Tus Clientes Referidos',
        noReferralsYet: 'Aún no hay referidos',
        clientsReferredOne: '1 cliente referido',
        clientsReferredOther: '{n} clientes referidos',
        shareLinkPrompt: 'Comparte tu enlace para empezar a referir clientes.',
        tableClient: 'Cliente',
        tableStatus: 'Estado',
        tableDealValue: 'Valor del Acuerdo',
        tableCommission: 'Tu Comisión',
        tableAmountPaid: 'Monto Pagado',
        statusPaid: 'Pagado',
        statusInterested: 'Interesado',
        statusNew: 'Cliente Nuevo',
        contactTitle: 'Contacta al Administrador o solicita un pago',
        contactSubtitle: 'Envía un mensaje sobre tus referidos, comisión o cualquier otra cosa',
        loadingConversation: 'Cargando conversación...',
        noMessagesYet: 'Aún no hay mensajes — saluda.',
        youLabel: 'Tú',
        adminLabel: 'Administrador',
        messagePlaceholder: 'Escribe un mensaje al Administrador...',
        send: 'Enviar',
        leadsTitle: 'Formas comprobadas de encontrar prospectos de alta calidad',
        leadsSubtitle: 'Los clientes más grandes te pagan más — así es como encontrarlos',
        statsFooterNote: 'Las estadísticas se actualizan cuando nuestro equipo registra un acuerdo cerrado. ¿Preguntas sobre un pago? Escríbenos a',
        recruitPromptTitle: '¿Conoces a alguien que le interesaría un trabajo remoto?',
        recruitPromptBody: 'Comparte Socio con esa persona para que también pueda aplicar como Socio de Crecimiento.',
        recruitPromptNote: 'No ganas nada por reclutar a otros Socios de Crecimiento — esto es completamente opcional, solo una forma de compartir la voz si quieres.',
        recruitPromptContinue: 'Continuar al manual'
      },
      clientAccountBlock: {
        eyebrow: 'Programa de Socio de Crecimiento',
        title: 'Esta cuenta ya es una cuenta de cliente',
        desc: 'inició sesión con una cuenta de cliente, por lo que no puede registrarse también como socio de crecimiento. Regístrate en el programa de socios de crecimiento con un correo diferente.'
      },
      becomeAffiliate: {
        eyebrow: 'Programa de Socio de Crecimiento',
        titlePrefix: '¿Convertirte en socio de crecimiento como',
        desc: 'Ya iniciaste sesión. Solo confirma un par de datos para registrar esta cuenta como socio de crecimiento y obtener tu enlace de referido.',
        ageLabel: 'Edad',
        ageHint: '(debes ser mayor de 18 años)',
        countryLabel: 'País',
        countryPlaceholder: 'Estados Unidos',
        settingUp: 'Configurando...',
        becomeButton: 'Convertirme en Socio de Crecimiento',
        errorEnterAge: 'Ingresa tu edad.',
        errorMinAge: 'Debes tener al menos 18 años para unirte al programa de socios de crecimiento.',
        errorEnterCountry: 'Ingresa tu país.',
        errorGeneric: 'Algo salió mal. Por favor, inténtalo de nuevo.'
      },
      onboarding: {
        stepOf7Prefix: 'Paso',
        stepOf7Suffix: 'de 7',
        leadsPrompt: 'Si nos envías',
        avgDealValue: 'prom. $2,500 USD por cliente',
        confirmedLeadSingular: 'prospecto confirmado/mes',
        confirmedLeadPlural: 'prospectos confirmados/mes',
        youCouldEarn: 'Podrías ganar',
        back: 'Atrás',
        continue: 'Continuar',
        createAccountTitle: 'Crea tu cuenta de socio de crecimiento',
        signInTitle: 'Iniciar sesión',
        createAccountSubtitle: 'Último paso — crea una cuenta y generaremos tu enlace de referido.',
        signInSubtitle: '¿Ya eres socio de crecimiento? Inicia sesión para ver tu enlace y estadísticas.',
        fullNamePlaceholder: 'Nombre completo',
        emailPlaceholder: 'Correo electrónico',
        passwordPlaceholder: 'Contraseña',
        pleaseWait: 'Espera un momento...',
        createAccountButton: 'Crear Cuenta',
        alreadyPartnerSignIn: '¿Ya eres socio de crecimiento? Inicia sesión',
        needAccountSignUp: '¿Necesitas una cuenta? Regístrate'
      }
    },
    affiliateGuide: {
      backToDashboard: 'Volver al panel',
      eyebrow: 'Manual del Socio de Crecimiento',
      title: 'Manual de Generación de Leads para Socios de Crecimiento',
      subtitle: 'Encuentra leads de software de alta calidad sin pasar horas investigando cada negocio.',
      yourReferralLink: 'Tu enlace de referido',
      howItWorks: 'Cómo funciona',
      whyItWorks: 'Por qué funciona',
      yourAdvantage: 'Tu ventaja'
    },
    workspace: {
      loading: 'Cargando tu espacio de trabajo...',
      briefing: {
        role: 'Arquitecto Principal de Sistemas',
        messageFrom: 'Mensaje de Alexis',
        avgResponse: 'Respuesta promedio: 1–5h',
        intro: 'Hola, soy Alexis. Leo personalmente cada mensaje que llega aquí. Cuéntame qué está frenando a tu equipo o qué te gustaría que construyamos, en términos sencillos, sin necesidad de conocer jerga técnica. Haré preguntas de seguimiento y te diré qué podemos hacer y aproximadamente cuánto costaría.',
        suggestedStarters: 'Puntos de partida sugeridos:'
      },
      messageInput: {
        placeholder: 'Explica tus ideas, cuellos de botella en tu flujo de trabajo o preguntas para Alexis...',
        markdownSupported: 'Markdown compatible',
        cmdEnterToSend: 'Cmd + Enter para enviar',
        sendIdea: 'Enviar Idea'
      },
      attachTooltip: 'Adjuntar archivo, maqueta de especificación o exportación',
      schemaTooltip: 'Insertar diagrama de flujo del sistema o boceto de esquema',
      you: 'Tú',
      architectReplyLabel: 'Respuesta',
      profileCard: {
        email: 'Correo',
        company: 'Empresa',
        seeOtherExamples: 'Ver otros ejemplos de proyectos →'
      },
      filesCard: {
        filesSharedTitle: 'Archivos Compartidos',
        upload: '+ Subir',
        uploading: 'Subiendo...',
        dragDrop: 'Arrastra y suelta archivos aquí',
        fileTypesHint: 'PDF, CSV, Excel, JSON, YAML, PNG o JPG — hasta 20MB cada uno',
        downloadTitle: 'Descargar archivo',
        removeTitle: 'Eliminar archivo'
      },
      privacyCard: {
        title: 'Cómo Manejamos tu Información',
        ndaBadge: 'Firmamos un NDA si lo deseas',
        noSellBadge: 'No vendemos ni compartimos tus datos',
        questionsLabel: '¿Preguntas? Contáctanos directamente:'
      },
      howThisWorks: {
        title: 'Cómo Funciona Esto',
        step1Title: 'Aprendemos sobre tu negocio',
        step1Desc: 'Alexis descubre qué está frenando a tu equipo (en curso)',
        step2Title: 'Te mostramos el plan y el precio',
        step2Desc: 'Ves exactamente qué construiremos y cuánto cuesta antes de empezar',
        step3Title: 'Te entregamos todo',
        step3Desc: 'Todo el código y accesos, completamente tuyos'
      },
      fileSharedNoticePrefix: 'Archivo(s) compartido(s):',
      fileReceivedNoticeSingle: 'Alexis recibió tu archivo y le echará un vistazo.',
      fileReceivedNoticeMultiple: 'Alexis recibió tus {n} archivos y les echará un vistazo.',
      systemNoticeSenderName: 'Aviso del Sistema'
    }
  }
} as const;

type Translations = typeof translations['en'];

function getFromPath(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj) ?? path;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function detectInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    // localStorage unavailable — fall through to browser detection
  }
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')) {
    return 'es';
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // localStorage unavailable — language choice just won't persist
    }
  }, [language]);

  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = useMemo(() => {
    const dict: Translations = translations[language];
    return (path: string) => getFromPath(dict, path);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
