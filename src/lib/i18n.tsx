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
      step1Desc: 'We dig into your goals, workflow and pain points to figure out exactly what to build.',
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
      step1Title: 'We map your workflow',
      step1Desc: 'Understand your daily workflow and shape the right solution based on your budget, timeframe and needs.',
      step1Tag: 'Workflow & gap review',
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
      subtitle: "Client names stay private, but here's the kind of work we do — and there's no fixed price list. Tell us what you're solving for and your budget and we'll shape a plan around it.",
      anonymizedNote: "Details anonymized to protect client privacy. Your project won't look exactly like these — every plan and cost comes out of a conversation with us.",
      ownershipBanner: 'No recurring user licenses or vendor lock-in. You own everything we build.',
      ownershipTitle: '100% Code Ownership:',
      ownershipBadge: 'Complete IP & Code Handover'
    },
    signupCard: {
      title: 'Create your account',
      subtitle: 'Start discussing your project in minutes.',
      google: 'Continue with Google',
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
      step1Desc: 'Profundizamos en tus objetivos, flujo de trabajo y puntos de dolor para saber exactamente qué construir.',
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
      step1Title: 'Mapeamos tu flujo de trabajo',
      step1Desc: 'Entendemos tu flujo de trabajo diario y damos forma a la solución correcta según tu presupuesto, plazos y necesidades.',
      step1Tag: 'Revisión de flujo y brechas',
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
      subtitle: 'Los nombres de los clientes se mantienen privados, pero así es el tipo de trabajo que hacemos — y no hay una lista de precios fija. Cuéntanos qué problema quieres resolver y tu presupuesto, y armaremos un plan a tu medida.',
      anonymizedNote: 'Los detalles se anonimizaron para proteger la privacidad del cliente. Tu proyecto no se verá exactamente igual a estos — cada plan y costo surge de una conversación con nosotros.',
      ownershipBanner: 'Sin licencias de usuario recurrentes ni dependencia de proveedor. Eres dueño de todo lo que construimos.',
      ownershipTitle: 'Propiedad del 100% del Código:',
      ownershipBadge: 'Entrega completa de PI y código'
    },
    signupCard: {
      title: 'Crea tu cuenta',
      subtitle: 'Empieza a discutir tu proyecto en minutos.',
      google: 'Continuar con Google',
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
