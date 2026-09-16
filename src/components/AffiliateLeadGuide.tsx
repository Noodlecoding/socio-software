import React from 'react';
import { ArrowLeft, Linkedin, MessagesSquare, Users2, Handshake, Twitter } from 'lucide-react';

interface AffiliateLeadGuideProps {
  referralLink: string;
  onBack: () => void;
}

const TECHNIQUES = [
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

export const AffiliateLeadGuide: React.FC<AffiliateLeadGuideProps> = ({ referralLink, onBack }) => {
  return (
    <main className="w-full pt-28 pb-20 px-6 lg:px-12 min-h-screen bg-[#f8f9fd]">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2 block">Affiliate Playbook</span>
        <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight">
          5 top high-ticket lead generation techniques
        </h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          Your commission is 23% of the deal value, so the size of the client you refer matters as much as the
          number of referrals. These five approaches are built around your referral link and are aimed at
          landing fewer, bigger clients instead of chasing volume.
        </p>

        {referralLink && (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 mt-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Your referral link</span>
            <span className="font-mono text-sm text-blue-700 truncate">{referralLink}</span>
          </div>
        )}

        {/* Section selector: jumps down to each technique */}
        <div className="flex flex-wrap gap-2 mt-6">
          {TECHNIQUES.map((t, i) => (
            <button
              key={i}
              type="button"
              onClick={() => document.getElementById(`technique-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <span className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {t.shortLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-5 mt-8">
          {TECHNIQUES.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={i} id={`technique-${i}`} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 scroll-mt-6">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Technique {i + 1}</span>
                    <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">{t.title}</h2>
                  </div>
                </div>

                <div className="mt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">How it works</h3>
                  <ul className="flex flex-col gap-2">
                    {t.howItWorks.map((step, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Why it works</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{t.whyItWorks}</p>
                </div>

                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 mt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1.5">Your advantage</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{t.yourRole}</p>
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
          Back to dashboard
        </button>
      </div>
    </main>
  );
};
