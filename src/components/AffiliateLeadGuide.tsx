import React from 'react';
import { ArrowLeft, Linkedin, MessagesSquare, Users2, Handshake, Twitter } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface AffiliateLeadGuideProps {
  referralLink: string;
  onBack: () => void;
}

const TECHNIQUES_EN = [
  {
    icon: Linkedin,
    shortLabel: 'LinkedIn Outreach',
    title: 'Cold LinkedIn outreach + discovery calls',
    howItWorks: [
      'Target 100 companies in your niche (find CTOs, founders, VP product on LinkedIn)',
      'Send 10-15 personalized messages per day mentioning a specific insight about their company',
      'Goal: get 5 coffee chats per week',
      "On the call: ask about their tech challenges, understand their situation",
      "If they're a fit, offer an intro and share your referral link"
    ],
    whyItWorks: "High-ticket buyers research before buying. They want a trusted person to introduce them, not a cold sales pitch.",
    yourRole: "You're the trusted intro, not the seller: \"I've referred a few companies like yours to them. Let me intro you.\""
  },
  {
    icon: MessagesSquare,
    shortLabel: 'Content',
    title: 'LinkedIn content + thought leadership',
    howItWorks: [
      'Post 2-3x per week about problems your target industry faces ("Why legacy systems kill productivity," "Tech debt in logistics," etc.)',
      'Build a small following (100-500 engaged people in your niche)',
      'Get comments/DMs from people saying "This is exactly our problem"',
      'Respond and offer to make an intro',
      'Send them your referral link in DM with context'
    ],
    whyItWorks: "People find you because you're solving their problem. No cold outreach needed.",
    yourRole: "As the referral partner, you're positioned as the expert who understands their industry and knows the right vendor."
  },
  {
    icon: Users2,
    shortLabel: 'Community',
    title: 'Community engagement (Slack, Reddit, Discord)',
    howItWorks: [
      'Join 3-4 relevant communities (founder Slack groups, logistics tech Discord, SaaS Reddit)',
      'Answer questions about tech/software decisions, genuinely helpful, no selling',
      'Build a reputation as someone who knows the space',
      'When someone asks where to find custom software, you answer',
      'Share your referral link and be upfront that you earn commission on the referral'
    ],
    whyItWorks: "People trust community recommendations more than ads. They already know you're credible.",
    yourRole: "You're the person who knows good vendors. You become the connector."
  },
  {
    icon: Handshake,
    shortLabel: 'Partnerships',
    title: 'Referral partnerships (agencies, consultants, advisors)',
    howItWorks: [
      'Find digital marketing agencies, management consultants and business coaches who serve your target companies',
      'They have clients with budget but no development capability',
      'Pitch a mutual referral partnership: when their clients need dev work, they send them your way',
      'Give them your referral link and a brief company overview',
      'When they send a lead, they pass along your link'
    ],
    whyItWorks: 'These partners already have warm relationships with high-budget decision-makers.',
    yourRole: 'A passive pipeline: partners do the heavy lifting, you get warm intros and your link sent along.'
  },
  {
    icon: Twitter,
    shortLabel: 'Warm DMs',
    title: 'Twitter/LinkedIn engagement → warm outreach',
    howItWorks: [
      'Find 50+ people in your target industry on Twitter/LinkedIn (CTOs, founders, investors)',
      'Reply to their posts thoughtfully for 2-3 weeks to build familiarity',
      "Then send one DM asking if they're building in-house or considering outsourcing",
      "If they're considering outsourcing, offer a quick intro and share your link"
    ],
    whyItWorks: 'Warm outreach converts better than pure cold — they recognize you and feel like they already know you.',
    yourRole: "You're not a stranger pitching. You're someone who's been adding value, now offering a genuine solution."
  }
];

const TECHNIQUES_ES = [
  {
    icon: Linkedin,
    shortLabel: 'Alcance en LinkedIn',
    title: 'Alcance en frío en LinkedIn + llamadas exploratorias',
    howItWorks: [
      'Elige 100 empresas en tu nicho (busca CTOs, fundadores, VP de producto en LinkedIn)',
      'Envía 10-15 mensajes personalizados por día mencionando algo específico sobre su empresa',
      'Meta: consigue 5 charlas informales por semana',
      'En la llamada: pregunta sobre sus retos tecnológicos, entiende su situación',
      'Si encajan, ofrece hacer una presentación y comparte tu enlace de referido'
    ],
    whyItWorks: 'Los compradores de alto valor investigan antes de comprar. Quieren que una persona de confianza los presente, no un discurso de ventas en frío.',
    yourRole: 'Eres la presentación de confianza, no el vendedor: "He referido a algunas empresas como la tuya con ellos. Déjame presentarte."'
  },
  {
    icon: MessagesSquare,
    shortLabel: 'Contenido',
    title: 'Contenido en LinkedIn + liderazgo de pensamiento',
    howItWorks: [
      'Publica 2-3 veces por semana sobre problemas que enfrenta tu industria objetivo ("Por qué los sistemas heredados matan la productividad," "Deuda técnica en logística," etc.)',
      'Construye una pequeña audiencia (100-500 personas comprometidas en tu nicho)',
      'Recibe comentarios/mensajes de personas diciendo "Este es exactamente nuestro problema"',
      'Responde y ofrece hacer una presentación',
      'Envíales tu enlace de referido por mensaje directo con contexto'
    ],
    whyItWorks: 'La gente te encuentra porque resuelves su problema. No se necesita alcance en frío.',
    yourRole: 'Como socio de referidos, te posicionas como el experto que entiende su industria y conoce al proveedor adecuado.'
  },
  {
    icon: Users2,
    shortLabel: 'Comunidad',
    title: 'Participación en comunidades (Slack, Reddit, Discord)',
    howItWorks: [
      'Únete a 3-4 comunidades relevantes (grupos de Slack de fundadores, Discord de tecnología logística, Reddit de SaaS)',
      'Responde preguntas sobre decisiones de tecnología/software, siendo genuinamente útil, sin vender',
      'Construye una reputación como alguien que conoce el sector',
      'Cuando alguien pregunte dónde encontrar software a medida, responde',
      'Comparte tu enlace de referido y sé transparente sobre que ganas comisión por la referencia'
    ],
    whyItWorks: 'La gente confía más en las recomendaciones de la comunidad que en los anuncios. Ya saben que eres creíble.',
    yourRole: 'Eres la persona que conoce buenos proveedores. Te conviertes en el conector.'
  },
  {
    icon: Handshake,
    shortLabel: 'Alianzas',
    title: 'Alianzas de referidos (agencias, consultores, asesores)',
    howItWorks: [
      'Encuentra agencias de marketing digital, consultores de gestión y coaches de negocios que atienden a tus empresas objetivo',
      'Ellos tienen clientes con presupuesto pero sin capacidad de desarrollo',
      'Propón una alianza de referidos mutua: cuando sus clientes necesiten desarrollo, te los envían',
      'Dales tu enlace de referido y una breve descripción de la empresa',
      'Cuando envíen un prospecto, pasan tu enlace'
    ],
    whyItWorks: 'Estos socios ya tienen relaciones cercanas con tomadores de decisiones de alto presupuesto.',
    yourRole: 'Un canal pasivo: los socios hacen el trabajo pesado, tú recibes presentaciones cálidas y tu enlace se comparte.'
  },
  {
    icon: Twitter,
    shortLabel: 'Mensajes cálidos',
    title: 'Interacción en Twitter/LinkedIn → contacto cálido',
    howItWorks: [
      'Encuentra 50+ personas en tu industria objetivo en Twitter/LinkedIn (CTOs, fundadores, inversores)',
      'Responde a sus publicaciones de forma reflexiva durante 2-3 semanas para generar familiaridad',
      'Luego envía un mensaje directo preguntando si están construyendo internamente o considerando externalizar',
      'Si están considerando externalizar, ofrece una presentación rápida y comparte tu enlace'
    ],
    whyItWorks: 'El contacto cálido convierte mejor que el frío puro — te reconocen y sienten que ya te conocen.',
    yourRole: 'No eres un extraño lanzando un discurso de ventas. Eres alguien que ha estado aportando valor, ahora ofreciendo una solución genuina.'
  }
];

export const AffiliateLeadGuide: React.FC<AffiliateLeadGuideProps> = ({ referralLink, onBack }) => {
  const { t, language } = useLanguage();
  const TECHNIQUES = language === 'es' ? TECHNIQUES_ES : TECHNIQUES_EN;

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

        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">{t('affiliateGuide.eyebrow')}</span>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
          {t('affiliateGuide.title')}
        </h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          {t('affiliateGuide.subtitle')}
        </p>

        {referralLink && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mt-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500 shrink-0">{t('affiliateGuide.yourReferralLink')}</span>
            <span className="font-mono text-sm text-blue-700 truncate">{referralLink}</span>
          </div>
        )}

        {/* Section selector: jumps down to each technique */}
        <div className="flex flex-wrap gap-2 mt-6">
          {TECHNIQUES.map((technique, i) => (
            <button
              key={i}
              type="button"
              onClick={() => document.getElementById(`technique-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {technique.shortLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-5 mt-8">
          {TECHNIQUES.map((technique, i) => {
            const Icon = technique.icon;
            return (
              <div key={i} id={`technique-${i}`} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 scroll-mt-6">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">{t('affiliateGuide.techniquePrefix')} {i + 1}</span>
                    <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">{technique.title}</h2>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t('affiliateGuide.howItWorks')}</h3>
                  <ul className="flex flex-col gap-2">
                    {technique.howItWorks.map((step, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{t('affiliateGuide.whyItWorks')}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{technique.whyItWorks}</p>
                </div>

                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 mt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5">{t('affiliateGuide.yourAdvantage')}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{technique.yourRole}</p>
                </div>
              </div>
            );
          })}
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
