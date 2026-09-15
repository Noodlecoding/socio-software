import { EngagementModel } from '../types';

export const SOCIO_LOGO_URL = '/logo.png';

export const ENGAGEMENT_MODELS: EngagementModel[] = [
  {
    id: 'quick-module',
    tag: 'Fast Fixes',
    title: 'Quick Module',
    name: 'Smaller Scope',
    duration: 'Typically days, not months',
    description: 'Focused fixes for specific bottlenecks, repetitive manual tasks, or single API integrations.',
    features: [
      'API integrations & webhooks',
      'Automated workflows',
      'Scoped and priced around your budget'
    ],
    ctaText: 'Talk to us about this',
    isPopular: false
  },
  {
    id: 'core-workflow',
    tag: 'Operational Engine',
    title: 'Core Workflow Tool',
    name: 'Most Common',
    duration: 'A focused multi-week build',
    description: 'Replace clunky spreadsheets and expensive SaaS subscriptions with a dedicated internal tool.',
    features: [
      'Custom inventory or client portals',
      'Automated invoicing & reporting',
      'Scoped and priced around your budget'
    ],
    ctaText: 'Talk to us about this',
    isPopular: true
  },
  {
    id: 'comprehensive-system',
    tag: 'Enterprise Scale',
    title: 'Comprehensive System',
    name: 'Larger Initiative',
    duration: 'A longer-term engagement',
    description: 'Full-scale backbones unifying multiple departments, warehouse workflows, and complex legacy data.',
    features: [
      'Multi-location operational systems',
      'Full legacy database migrations',
      'Scoped and priced around your budget'
    ],
    ctaText: 'Talk to us about this',
    isPopular: false
  }
];

export const STARTER_CHIPS = [
  { label: 'Get rid of manual spreadsheet work', icon: 'table_view', prompt: 'We want to replace our multi-sheet Excel tracking with an automated pipeline that syncs inventory and customer orders in real time.' },
  { label: 'Build a dashboard for my team', icon: 'dashboard', prompt: 'Our team needs a unified operations dashboard where ops leads can assign tickets, track fulfillment, and view daily dispatch metrics.' },
  { label: 'Connect two tools we already use', icon: 'hub', prompt: 'We need to bridge our legacy accounting software with our Shopify store and warehouse 3PL via secure webhooks.' },
  { label: 'Our software is slow or breaking', icon: 'database', prompt: 'Our current system is suffering from slow performance during peak volume, and we need help figuring out why and fixing it.' }
];

export function generateArchitectResponse(userPrompt: string, orgName: string): string {
  const lower = userPrompt.toLowerCase();

  if (lower.includes('spreadsheet') || lower.includes('excel') || lower.includes('sheet') || lower.includes('manual')) {
    return `Thanks for laying this out, ${orgName}. Spreadsheet overload is one of the most common problems we help fix.

Here's roughly how we'd approach it:
1. **Figure out what you actually rely on.** We'd walk through the exact columns and info your team tracks today, so nothing gets lost in the switch.
2. **Build you real screens instead of spreadsheets.** Instead of scrolling across 40 columns, your team gets simple forms and a clear status view.
3. **Connect it to your other tools automatically.** No more copy-pasting between systems — updates flow on their own.

This would likely fall under our **Core Workflow Tool** kind of project (a few weeks of work). What other tools or files does your team currently export data into or out of?`;
  }

  if (lower.includes('crm') || lower.includes('dashboard') || lower.includes('portal') || lower.includes('ticket')) {
    return `Got it, ${orgName}. A dashboard built around exactly how your team works usually beats forcing everyone into an off-the-shelf tool that charges per seat.

What we'd typically do:
- **You own it outright** — no monthly per-user fees to a software vendor.
- **Everyone sees only what they need** — different views for managers vs. frontline staff.
- **Real-time status** — see what's happening as it happens, with a history you can look back on.

This is usually a few weeks of work. Is this just for your internal team, or would customers/clients need access too?`;
  }

  if (lower.includes('api') || lower.includes('webhook') || lower.includes('integration') || lower.includes('legacy')) {
    return `Understood. Connecting an older system to newer tools is one of our most common smaller projects, usually done in a week or two.

How we'd typically handle it:
- **A reliable bridge between the two systems** that retries automatically if something fails, so nothing gets silently lost.
- **Cleans up the data** as it moves between systems, so both sides understand it correctly.
- **A simple way to check it's working** — you can see confirmations without needing to understand any technical logs.

I can have a rough plan mapped out within 24 hours. Does your current system let other tools connect to it directly, or do we need to work around that?`;
  }

  return `Thanks for sharing these details, ${orgName}. This is exactly the kind of thing we help sort out early on, before any commitment.

Based on what you've described:
1. **We'll agree on the plan and price up front** — no surprises once we start.
2. **You get everything when it's done** — all the code and access, fully yours.
3. **Next step:** I'm looking into what you've described now. I'll typically have a clear plan back to you within 48 hours.

Could you tell me roughly how many people on your team would use this day-to-day?`;
}
