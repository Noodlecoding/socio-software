import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { AppView } from '../App';

interface LegalPageProps {
  onNavigate: (view: AppView) => void;
}

type DocId = 'privacy' | 'terms';
type Role = 'client' | 'affiliate';

const LAST_UPDATED = 'September 16, 2026';
const CONTACT_EMAIL = 'direct@socio.com';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function RoleSection({ role, activeRole, label, children }: { role: Role; activeRole: Role; label: string; children: React.ReactNode }) {
  if (role !== activeRole) return null;
  return (
    <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
      <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-2">{label}</span>
      <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export const LegalPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  const [doc, setDoc] = useState<DocId>('privacy');
  const [role, setRole] = useState<Role>('client');

  return (
    <div className="w-full min-h-screen pt-24 pb-24 px-6 lg:px-12 bg-white">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Socio
        </button>

        <h1 className="font-display text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          Legal
        </h1>
        <p className="text-sm text-slate-500 mb-8">Last updated {LAST_UPDATED}</p>

        {/* Doc + role selectors */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setDoc('privacy')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                doc === 'privacy' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setDoc('terms')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                doc === 'terms' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Terms of Service
            </button>
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setRole('client')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                role === 'client' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              I'm a Client
            </button>
            <button
              onClick={() => setRole('affiliate')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                role === 'affiliate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              I'm a Growth Partner
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs leading-relaxed p-4 mb-10">
          This is a general template describing how Socio actually collects and uses data today. It
          is not a substitute for advice from a licensed attorney, and it does not yet specify a
          governing jurisdiction, payout schedule, or refund terms — have a lawyer review and complete
          it before relying on it as your binding legal agreement.
        </div>

        {doc === 'privacy' ? (
          <>
            <Section title="1. Who we are">
              <p>
                Socio ("Socio," "we," "us") is a custom software studio. This policy explains what
                information we collect through socio&apos;s website and workspace, why we collect it,
                and how you can control it. It applies to everyone who uses Socio, including clients and
                growth partners.
              </p>
            </Section>

            <Section title="2. Information we collect">
              <p>When you create an account, we collect the information you provide directly:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Name, email address, and organization (or Google account details, if you sign in with Google)</li>
                <li>Your password, handled entirely by our authentication provider — we never see or store it in plain text</li>
              </ul>
            </Section>

            <RoleSection role="client" activeRole={role} label="For Clients">
              <p>As a client, we additionally collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Messages you send us in the Discussion Desk, describing your project</li>
                <li>Metadata about files you reference (file name, type, and size only — we do not currently store the contents of uploaded files)</li>
                <li>Your selected engagement model, and internal pipeline status we use to track your project (e.g. new, in discussion, contracted)</li>
                <li>Which growth partner, if any, referred you</li>
              </ul>
            </RoleSection>

            <RoleSection role="affiliate" activeRole={role} label="For Growth Partners">
              <p>As a growth partner, we additionally collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your self-reported age and country (used only to confirm eligibility — we do not verify this with an ID)</li>
                <li>Your unique referral code and the clients it refers</li>
                <li>Deal status and value for clients you referred, used solely to calculate commission owed to you</li>
              </ul>
            </RoleSection>

            <Section title="3. How we use your information">
              <ul className="list-disc pl-5 space-y-1">
                <li>To create and secure your account, and authenticate you when you sign in</li>
                <li>To operate the Discussion Desk and respond to your project</li>
                <li>To calculate and pay growth partner commissions</li>
                <li>To detect and prevent abuse, including automated rate-limiting on login and signup attempts</li>
                <li>To communicate with you about your account or project</li>
              </ul>
              <p>We do not sell your personal information, and we do not use it for third-party advertising.</p>
            </Section>

            <Section title="4. Cookies and local storage">
              <p>
                Socio does not use advertising or tracking cookies. We use your browser&apos;s local
                storage (not cookies) to keep you signed in and, if you arrived via a referral link, to
                remember the referral code until you sign up. This is strictly necessary for the site to
                function and isn&apos;t used for tracking across other sites.
              </p>
              <p>
                Page fonts are loaded from Google Fonts, which may receive your IP address as part of
                that request.
              </p>
            </Section>

            <Section title="5. Who we share information with">
              <p>We use a small number of service providers to run Socio, who only process data on our behalf:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Supabase — our database, authentication, and backend infrastructure provider</li>
                <li>Google — optional "Sign in with Google," and font hosting</li>
                <li>Vercel — website hosting</li>
              </ul>
              <p>
                Growth partners can only see aggregate stats (lead count, deals closed, commission owed) and
                the profiles of clients they personally referred — never any other client&apos;s data.
              </p>
            </Section>

            <Section title="6. Data retention and deletion">
              <p>
                We keep your information for as long as your account is active. To request access,
                correction, or deletion of your data, email us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>
                {' '}— we currently handle these requests manually and will confirm once it&apos;s done.
              </p>
            </Section>

            <Section title="7. Security">
              <p>
                Data is encrypted in transit (HTTPS). Access to your data is restricted at the database
                level by row-level security policies, so you can only ever read your own data (or, for
                admins/growth partners, the specific data your role is entitled to). No security measure is
                perfect, and we can&apos;t guarantee absolute security.
              </p>
            </Section>

            <Section title="8. Children's privacy">
              <p>
                Socio is not directed at children. Growth partners must self-certify they are 18 or older; we
                do not knowingly collect information from anyone under 18.
              </p>
            </Section>

            <Section title="9. Your rights">
              <p>
                Depending on where you live, you may have rights to access, correct, delete, or export
                your personal information, or to object to certain processing. Contact us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>
                {' '}to exercise any of these rights.
              </p>
            </Section>

            <Section title="10. Changes to this policy">
              <p>
                We may update this policy as Socio changes. We&apos;ll update the "Last updated" date
                above when we do.
              </p>
            </Section>

            <Section title="11. Contact">
              <p>
                Questions about this policy? Email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.
              </p>
            </Section>
          </>
        ) : (
          <>
            <Section title="1. Agreement to terms">
              <p>
                By creating an account or using Socio, you agree to these Terms of Service. If you
                don&apos;t agree, please don&apos;t use Socio.
              </p>
            </Section>

            <Section title="2. What Socio is">
              <p>
                Socio is a custom software studio. Prospective clients discuss project scope, budget,
                and timeframe directly with us through the Discussion Desk before any engagement begins.
                Socio also runs a growth partner program that pays a referral commission on closed deals.
              </p>
            </Section>

            <Section title="3. Accounts">
              <ul className="list-disc pl-5 space-y-1">
                <li>You must provide accurate information when creating an account</li>
                <li>You're responsible for keeping your login credentials secure and for activity under your account</li>
                <li>Growth partner accounts require you to be 18 or older, confirmed by your own self-certification</li>
              </ul>
            </Section>

            <RoleSection role="client" activeRole={role} label="For Clients">
              <ul className="list-disc pl-5 space-y-1">
                <li>Messages sent through the Discussion Desk are a discussion of your project needs, not a binding contract by themselves</li>
                <li>Pricing, scope, timeline, and code-ownership terms for actual engagements are agreed to separately and directly with us before any paid work begins</li>
                <li>We may decline to take on a project at our discretion</li>
              </ul>
            </RoleSection>

            <RoleSection role="affiliate" activeRole={role} label="For Growth Partners">
              <ul className="list-disc pl-5 space-y-1">
                <li>You earn a 23% commission on the value of any deal that closes from a client you referred, as tracked in your growth partner dashboard</li>
                <li>Commission is calculated once a referred client's deal is marked closed in our system; payout timing and method will be confirmed with you directly — this isn't yet a fixed, published schedule</li>
                <li>Self-referrals, fraudulent referrals, or misrepresenting Socio to prospective clients are prohibited and may result in forfeiting commission and/or account termination</li>
                <li>We don't guarantee any minimum number of referrals, conversions, or earnings</li>
              </ul>
            </RoleSection>

            <Section title="4. Acceptable use">
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Attempt to access another user's account or data</li>
                <li>Interfere with or disrupt Socio's systems, including attempting to bypass rate limits or security controls</li>
                <li>Use Socio for any unlawful purpose</li>
              </ul>
            </Section>

            <Section title="5. Intellectual property">
              <p>
                Socio's branding, website, and platform are our property. Ownership of code and
                deliverables produced for a specific client engagement is governed by that
                engagement&apos;s separate agreement, not by these Terms.
              </p>
            </Section>

            <Section title="6. Disclaimers and limitation of liability">
              <p>
                Socio is provided "as is." To the fullest extent permitted by law, Socio is not liable
                for indirect, incidental, or consequential damages arising from your use of the site or
                platform.
              </p>
            </Section>

            <Section title="7. Termination">
              <p>
                We may suspend or terminate your account for violating these Terms, including growth partner
                fraud or abuse. You may stop using Socio and request account deletion at any time by
                emailing{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.
              </p>
            </Section>

            <Section title="8. Governing law">
              <p>
                [Governing jurisdiction to be specified] — this section is a placeholder and should be
                completed with legal advice before these Terms are treated as binding.
              </p>
            </Section>

            <Section title="9. Changes to these terms">
              <p>
                We may update these Terms as Socio changes. Continued use after an update means you
                accept the revised Terms.
              </p>
            </Section>

            <Section title="10. Contact">
              <p>
                Questions about these Terms? Email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>.
              </p>
            </Section>
          </>
        )}
      </div>
    </div>
  );
};
