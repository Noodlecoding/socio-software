import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronDown,
  DollarSign,
  Clock,
  MapPin,
  Briefcase,
  BookOpen,
  MessagesSquare,
  Mail,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface AffiliateLeadGuideProps {
  referralLink: string;
  onBack: () => void;
}

type Block =
  | { type: 'p'; text: string }
  | { type: 'strong'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'flow'; items: string[] }
  | { type: 'headline'; text: string }
  | { type: 'breakdown'; items: { count: string; label: string }[] }
  | { type: 'commission'; rows: { value: string; commission: string }[] };

interface GuideSection {
  icon: LucideIcon;
  title: string;
  blocks: Block[];
}

interface Method {
  icon: LucideIcon;
  shortLabel: string;
  title: string;
  blocks: Block[];
}

const SECTIONS_EN: GuideSection[] = [
  {
    icon: DollarSign,
    title: 'Your role & commission potential',
    blocks: [
      { type: 'p', text: "As a Growth Partner, your job isn't to build software or close technical deals." },
      { type: 'p', text: 'Your job is to:' },
      { type: 'flow', items: ['Find businesses', 'Start conversations', 'Identify genuine interest', 'Make the referral'] },
      { type: 'p', text: 'You earn 23% of the deal value, so the quality and size of the businesses you refer matter.' },
      {
        type: 'strong',
        text: "You're not paid for link clicks or signups. You only get paid once someone you referred actually becomes a client — that is, the deal closes."
      },
      { type: 'p', text: 'Because your commission is based on the value of the deal, referring a business with a larger software project can earn you significantly more.' },
      {
        type: 'commission',
        rows: [
          { value: '$5,000 project', commission: '$1,150 commission' },
          { value: '$10,000 project', commission: '$2,300 commission' },
          { value: '$20,000 project', commission: '$4,600 commission' },
          { value: '$50,000 project', commission: '$11,500 commission' }
        ]
      },
      { type: 'p', text: 'These are examples, not guaranteed earnings. Actual commissions depend on the final deal value and successful conversion.' },
      {
        type: 'strong',
        text: "You don't need to find hundreds of tiny clients. Focus on finding businesses that have real problems, enough resources to invest in a solution, and a genuine reason to consider custom software."
      }
    ]
  },
  {
    icon: Clock,
    title: 'Your recommended daily quota',
    blocks: [
      { type: 'headline', text: '40–50 prospects per day' },
      {
        type: 'breakdown',
        items: [
          { count: '20–25', label: 'from Google Maps & business directories' },
          { count: '10–15', label: 'from job boards and business listings' },
          { count: '10', label: 'from social media, communities, or other prospecting sources' }
        ]
      },
      { type: 'p', text: 'You should be spending minutes, not hours, evaluating each prospect.' },
      { type: 'strong', text: 'Volume + basic qualification + quality conversations.' },
      { type: 'p', text: "Don't spend 20 minutes researching one company when you could contact several other potential buyers." }
    ]
  }
];

const CLOSING_SECTION_EN: GuideSection = {
  icon: Sparkles,
  title: 'The golden rule',
  blocks: [
    {
      type: 'quote',
      text: "Don't spend 20 minutes researching one prospect. Spend a couple of minutes finding out whether they're interested, then move on."
    },
    { type: 'p', text: "Your advantage isn't knowing everything about software." },
    { type: 'p', text: 'Your advantage is being able to consistently find businesses, start conversations, and uncover opportunities.' },
    { type: 'strong', text: 'More qualified conversations → more potential deals.' },
    { type: 'p', text: 'And because your commission is based on deal value:' },
    { type: 'strong', text: 'Higher-value opportunities can mean significantly higher commissions.' }
  ]
};

const METHODS_EN: Method[] = [
  {
    icon: MapPin,
    shortLabel: 'Google Maps',
    title: '1. Google Maps & business directories',
    blocks: [
      { type: 'p', text: 'Search for established businesses in industries that can benefit from custom software.' },
      { type: 'list', items: ['Logistics', 'Construction', 'Manufacturing', 'Distribution', 'Retail', 'Hospitality', 'Clinics', 'Wholesalers', 'Automotive', 'Professional services'] },
      { type: 'p', text: 'Look for simple signs that the business is established:' },
      { type: 'list', items: ['Multiple locations', 'Large team', 'Lots of products or services', 'High customer volume', 'Complex operations', 'Growing business'] },
      { type: 'p', text: "You don't need to figure out exactly what software they need." },
      { type: 'flow', items: ['Find', 'Quick check', 'Contact', 'Move on'] }
    ]
  },
  {
    icon: Briefcase,
    shortLabel: 'Job Boards',
    title: '2. Job board prospecting',
    blocks: [
      { type: 'p', text: 'Job postings can reveal that a company is spending money on repetitive operational work.' },
      { type: 'p', text: 'Search for companies hiring for roles such as:' },
      { type: 'list', items: ['Operations', 'Inventory', 'Data entry', 'Dispatch', 'Scheduling', 'Order processing', 'Administrative work', 'Customer support'] },
      { type: 'p', text: 'Find the company behind the posting and contact them.' },
      {
        type: 'quote',
        text: "Hey, I came across your company while researching businesses in [industry]. I work with a software team that builds custom systems for businesses. Are you currently using software to manage your [inventory/operations/scheduling]?"
      },
      { type: 'p', text: "You're not claiming they need software." },
      { type: 'strong', text: "You're starting a conversation." }
    ]
  },
  {
    icon: BookOpen,
    shortLabel: 'Directories',
    title: '3. Business directories & industry lists',
    blocks: [
      { type: 'p', text: 'Use online business directories, industry directories, trade associations, local business listings, and similar sources to find prospects quickly.' },
      { type: 'p', text: 'Pick an industry and build a list of businesses that appear established enough to potentially invest in custom software.' },
      { type: 'p', text: 'For each prospect, collect:' },
      { type: 'flow', items: ['Business', 'Website', 'Contact', 'Decision-maker', 'Outreach'] },
      { type: 'p', text: "Don't deeply research every company." },
      { type: 'strong', text: 'The objective is to create a large, relevant prospect list and contact businesses efficiently.' }
    ]
  },
  {
    icon: MessagesSquare,
    shortLabel: 'Social Media',
    title: '4. Social media & community intent',
    blocks: [
      { type: 'p', text: 'Search:' },
      { type: 'list', items: ['Reddit', 'Facebook groups', 'LinkedIn', 'Business forums', 'Industry communities'] },
      { type: 'p', text: 'Look for people already discussing problems such as:' },
      {
        type: 'list',
        items: [
          '"Looking for software..."',
          '"Does anyone know a system for..."',
          '"We need a better way to..."',
          '"Our current software doesn\'t..."',
          '"How can we automate..."',
          '"We\'re using Excel for..."'
        ]
      },
      { type: 'p', text: 'These are strong signals because the business is already talking about a potential problem.' },
      { type: 'p', text: 'When appropriate, start a conversation and offer to connect them with the software team.' },
      { type: 'strong', text: "Don't spam communities. Only reach out when the service is genuinely relevant." }
    ]
  },
  {
    icon: Mail,
    shortLabel: 'Cold Email',
    title: '5. Cold email & direct messages',
    blocks: [
      { type: 'p', text: 'Build a targeted list of businesses and contact the relevant decision-maker.' },
      { type: 'p', text: 'Keep the first message short.' },
      {
        type: 'quote',
        text: "Hey [Name], I came across [Business] while researching companies in [industry]. I work with a software team that builds custom systems for businesses. Is custom software something your company has ever considered?"
      },
      { type: 'p', text: "If they're interested, explain that you can connect them with the team and provide your referral link." },
      { type: 'p', text: "If they're not interested, move on." },
      { type: 'strong', text: "Your goal isn't to convince everyone. It's to find the people who already have a reason to consider a solution." }
    ]
  }
];

const SECTIONS_ES: GuideSection[] = [
  {
    icon: DollarSign,
    title: 'Tu rol y el potencial de comisión',
    blocks: [
      { type: 'p', text: 'Como Socio de Crecimiento, tu trabajo no es construir software ni cerrar acuerdos técnicos.' },
      { type: 'p', text: 'Tu trabajo es:' },
      { type: 'flow', items: ['Encontrar negocios', 'Iniciar conversaciones', 'Identificar interés genuino', 'Hacer la referencia'] },
      { type: 'p', text: 'Ganas el 23% del valor del acuerdo, así que la calidad y el tamaño de los negocios que refieres importan.' },
      {
        type: 'strong',
        text: 'No te pagan por clics en el enlace ni por registros. Solo cobras cuando alguien que refieres se convierte realmente en cliente, es decir, cuando el acuerdo se cierra.'
      },
      { type: 'p', text: 'Como tu comisión se basa en el valor del acuerdo, referir un negocio con un proyecto de software más grande puede generarte mucho más.' },
      {
        type: 'commission',
        rows: [
          { value: 'Proyecto de $5,000', commission: 'Comisión de $1,150' },
          { value: 'Proyecto de $10,000', commission: 'Comisión de $2,300' },
          { value: 'Proyecto de $20,000', commission: 'Comisión de $4,600' },
          { value: 'Proyecto de $50,000', commission: 'Comisión de $11,500' }
        ]
      },
      { type: 'p', text: 'Estos son ejemplos, no ganancias garantizadas. Las comisiones reales dependen del valor final del acuerdo y de que se concrete la conversión.' },
      {
        type: 'strong',
        text: 'No necesitas encontrar cientos de clientes pequeños. Enfócate en encontrar negocios que tengan problemas reales, suficientes recursos para invertir en una solución y una razón genuina para considerar software a medida.'
      }
    ]
  },
  {
    icon: Clock,
    title: 'Tu cuota diaria recomendada',
    blocks: [
      { type: 'headline', text: '40–50 prospectos por día' },
      {
        type: 'breakdown',
        items: [
          { count: '20–25', label: 'de Google Maps y directorios de negocios' },
          { count: '10–15', label: 'de bolsas de trabajo y listados de negocios' },
          { count: '10', label: 'de redes sociales, comunidades u otras fuentes de prospección' }
        ]
      },
      { type: 'p', text: 'Deberías dedicar minutos, no horas, a evaluar cada prospecto.' },
      { type: 'strong', text: 'Volumen + calificación básica + conversaciones de calidad.' },
      { type: 'p', text: 'No dediques 20 minutos a investigar una sola empresa cuando podrías contactar a varios otros compradores potenciales.' }
    ]
  }
];

const CLOSING_SECTION_ES: GuideSection = {
  icon: Sparkles,
  title: 'La regla de oro',
  blocks: [
    {
      type: 'quote',
      text: 'No dediques 20 minutos a investigar un prospecto. Dedica un par de minutos a averiguar si están interesados y luego sigue adelante.'
    },
    { type: 'p', text: 'Tu ventaja no es saberlo todo sobre software.' },
    { type: 'p', text: 'Tu ventaja es poder encontrar negocios, iniciar conversaciones y descubrir oportunidades de forma constante.' },
    { type: 'strong', text: 'Más conversaciones calificadas → más acuerdos potenciales.' },
    { type: 'p', text: 'Y como tu comisión se basa en el valor del acuerdo:' },
    { type: 'strong', text: 'Las oportunidades de mayor valor pueden significar comisiones significativamente más altas.' }
  ]
};

const METHODS_ES: Method[] = [
  {
    icon: MapPin,
    shortLabel: 'Google Maps',
    title: '1. Google Maps y directorios de negocios',
    blocks: [
      { type: 'p', text: 'Busca negocios establecidos en industrias que puedan beneficiarse de software a medida.' },
      { type: 'list', items: ['Logística', 'Construcción', 'Manufactura', 'Distribución', 'Retail', 'Hospitalidad', 'Clínicas', 'Mayoristas', 'Automotriz', 'Servicios profesionales'] },
      { type: 'p', text: 'Busca señales simples de que el negocio está establecido:' },
      { type: 'list', items: ['Múltiples ubicaciones', 'Equipo grande', 'Muchos productos o servicios', 'Alto volumen de clientes', 'Operaciones complejas', 'Negocio en crecimiento'] },
      { type: 'p', text: 'No necesitas saber exactamente qué software necesitan.' },
      { type: 'flow', items: ['Encontrar', 'Revisión rápida', 'Contactar', 'Seguir adelante'] }
    ]
  },
  {
    icon: Briefcase,
    shortLabel: 'Bolsas de trabajo',
    title: '2. Prospección en bolsas de trabajo',
    blocks: [
      { type: 'p', text: 'Las publicaciones de empleo pueden revelar que una empresa está gastando dinero en trabajo operativo repetitivo.' },
      { type: 'p', text: 'Busca empresas que contraten para roles como:' },
      { type: 'list', items: ['Operaciones', 'Inventario', 'Captura de datos', 'Despacho', 'Programación', 'Procesamiento de pedidos', 'Trabajo administrativo', 'Atención al cliente'] },
      { type: 'p', text: 'Encuentra la empresa detrás de la publicación y contáctala.' },
      {
        type: 'quote',
        text: 'Hola, encontré tu empresa investigando negocios en [industria]. Trabajo con un equipo de software que construye sistemas a medida para empresas. ¿Actualmente usan software para gestionar su [inventario/operaciones/programación]?'
      },
      { type: 'p', text: 'No estás afirmando que necesitan software.' },
      { type: 'strong', text: 'Estás iniciando una conversación.' }
    ]
  },
  {
    icon: BookOpen,
    shortLabel: 'Directorios',
    title: '3. Directorios de negocios y listas de industria',
    blocks: [
      { type: 'p', text: 'Usa directorios de negocios en línea, directorios de industria, asociaciones comerciales, listados de negocios locales y fuentes similares para encontrar prospectos rápidamente.' },
      { type: 'p', text: 'Elige una industria y construye una lista de negocios que parezcan lo bastante establecidos como para invertir en software a medida.' },
      { type: 'p', text: 'Para cada prospecto, recopila:' },
      { type: 'flow', items: ['Negocio', 'Sitio web', 'Contacto', 'Tomador de decisiones', 'Contacto inicial'] },
      { type: 'p', text: 'No investigues a fondo cada empresa.' },
      { type: 'strong', text: 'El objetivo es crear una lista grande y relevante de prospectos y contactar negocios de forma eficiente.' }
    ]
  },
  {
    icon: MessagesSquare,
    shortLabel: 'Redes sociales',
    title: '4. Redes sociales e intención en comunidades',
    blocks: [
      { type: 'p', text: 'Busca en:' },
      { type: 'list', items: ['Reddit', 'Grupos de Facebook', 'LinkedIn', 'Foros de negocios', 'Comunidades de la industria'] },
      { type: 'p', text: 'Busca personas que ya estén hablando de problemas como:' },
      {
        type: 'list',
        items: [
          '"Busco un software..."',
          '"¿Alguien conoce un sistema para..."',
          '"Necesitamos una mejor forma de..."',
          '"Nuestro software actual no..."',
          '"¿Cómo podemos automatizar..."',
          '"Estamos usando Excel para..."'
        ]
      },
      { type: 'p', text: 'Estas son señales fuertes porque el negocio ya está hablando de un problema potencial.' },
      { type: 'p', text: 'Cuando sea apropiado, inicia una conversación y ofrece conectarlos con el equipo de software.' },
      { type: 'strong', text: 'No hagas spam en las comunidades. Contacta solo cuando el servicio sea genuinamente relevante.' }
    ]
  },
  {
    icon: Mail,
    shortLabel: 'Correo frío',
    title: '5. Correo frío y mensajes directos',
    blocks: [
      { type: 'p', text: 'Construye una lista de negocios objetivo y contacta al tomador de decisiones correspondiente.' },
      { type: 'p', text: 'Mantén el primer mensaje corto.' },
      {
        type: 'quote',
        text: 'Hola [Nombre], encontré [Negocio] investigando empresas en [industria]. Trabajo con un equipo de software que construye sistemas a medida para empresas. ¿El software a medida es algo que tu empresa haya considerado alguna vez?'
      },
      { type: 'p', text: 'Si están interesados, explícales que puedes conectarlos con el equipo y comparte tu enlace de referido.' },
      { type: 'p', text: 'Si no están interesados, sigue adelante.' },
      { type: 'strong', text: 'Tu meta no es convencer a todos. Es encontrar a las personas que ya tienen una razón para considerar una solución.' }
    ]
  }
];

const BlockRenderer: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'p':
      return <p className="text-sm text-slate-700 leading-relaxed">{block.text}</p>;
    case 'strong':
      return (
        <p className="text-sm font-semibold text-slate-900 leading-relaxed bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3">
          {block.text}
        </p>
      );
    case 'list':
      return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="border-l-2 border-blue-300 bg-slate-50 rounded-r-xl px-4 py-3 text-sm text-slate-600 italic leading-relaxed">
          "{block.text}"
        </blockquote>
      );
    case 'flow':
      return (
        <div className="flex flex-wrap items-center gap-2">
          {block.items.map((item, i) => (
            <React.Fragment key={i}>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                {item}
              </span>
              {i < block.items.length - 1 && <span className="text-slate-400">→</span>}
            </React.Fragment>
          ))}
        </div>
      );
    case 'headline':
      return <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{block.text}</p>;
    case 'breakdown':
      return (
        <div className="flex flex-col gap-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
              <span className="text-sm font-bold text-blue-600 shrink-0 w-14">{item.count}</span>
              <span className="text-sm text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      );
    case 'commission':
      return (
        <div className="flex flex-col gap-2">
          {block.rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
              <span className="text-sm text-slate-600">{row.value}</span>
              <span className="text-sm font-bold text-blue-600">{row.commission}</span>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
};

const AccordionSection: React.FC<{ section: GuideSection; isOpen: boolean; onToggle: () => void }> = ({
  section,
  isOpen,
  onToggle
}) => {
  const Icon = section.icon;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 p-5 sm:p-6 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 flex-1 min-w-0">{section.title}</h2>
        <ChevronDown className={`w-4.5 h-4.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 flex flex-col gap-3.5">
              {section.blocks.map((block, j) => (
                <BlockRenderer key={j} block={block} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MethodsWidget: React.FC<{ methods: Method[]; title: string }> = ({ methods, title }) => {
  const [active, setActive] = useState(0);
  const method = methods[active];
  const Icon = method.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">{title}</h2>

      <div className="flex flex-wrap gap-2 mt-4">
        {methods.map((m, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              active === i
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                active === i ? 'bg-white/20 text-white' : 'bg-blue-600/10 text-blue-600'
              }`}
            >
              {i + 1}
            </span>
            {m.shortLabel}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="mt-5"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <h3 className="font-display text-sm font-bold text-slate-900">{method.title}</h3>
          </div>
          <div className="flex flex-col gap-3.5">
            {method.blocks.map((block, j) => (
              <BlockRenderer key={j} block={block} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const AffiliateLeadGuide: React.FC<AffiliateLeadGuideProps> = ({ referralLink, onBack }) => {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const SECTIONS = isEs ? SECTIONS_ES : SECTIONS_EN;
  const CLOSING_SECTION = isEs ? CLOSING_SECTION_ES : CLOSING_SECTION_EN;
  const METHODS = isEs ? METHODS_ES : METHODS_EN;
  const methodsWidgetTitle = isEs ? '5 métodos de generación de leads' : '5 lead generation methods';
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  };

  return (
    <main className="w-full pt-28 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd]">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('affiliateGuide.backToDashboard')}
        </button>

        <h1 className="font-display text-3xl font-extrabold text-blue-600 tracking-tight">
          {t('affiliateGuide.title')}
        </h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          {t('affiliateGuide.subtitlePrefix')}
          <strong className="font-semibold text-slate-900">{t('affiliateGuide.subtitleBold')}</strong>
          {t('affiliateGuide.subtitleSuffix')}
        </p>

        {referralLink && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mt-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500 shrink-0">{t('affiliateGuide.yourReferralLink')}</span>
            <span className="font-mono text-sm text-blue-700 truncate">{referralLink}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-8">
          {SECTIONS.map((section, i) => (
            <AccordionSection key={i} section={section} isOpen={openIndices.has(i)} onToggle={() => toggle(i)} />
          ))}

          <MethodsWidget methods={METHODS} title={methodsWidgetTitle} />

          <AccordionSection
            section={CLOSING_SECTION}
            isOpen={openIndices.has(SECTIONS.length)}
            onToggle={() => toggle(SECTIONS.length)}
          />
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mt-8 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('affiliateGuide.backToDashboard')}
        </button>
      </div>
    </main>
  );
};
