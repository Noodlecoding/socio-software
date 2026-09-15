import { EngagementModel, ChatMessage, SpecFile } from '../types';

export const SOCIO_LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaCf1fa7PPCHigvtZm8Ak8V7q87DWM423bDp7Jt4wzcgOWu0hIxY0L77OQj425_1ZHnlKvBNwzZwT-NIffNfsz3VWWapqts77E47mNkMxxt7VHdOVNB_nFyjmbtFr1t42YDx2GlRXBWzQ527nU67LVU1HH9FX7s5ImXQMV5I5xV2JrBwVf3RxsJssHuYpbKOr1ZJcwc_3origu2mm_CNC1pzDOVxYs7fMgX0sNkEAXywQUSZnN9F0yO_A69NtW0I25ew';

export const ENGAGEMENT_MODELS: EngagementModel[] = [
  {
    id: 'quick-module',
    tag: 'Fast Fixes',
    title: 'Quick Module',
    name: 'Targeted Sprint',
    duration: '5–10 days',
    description: 'Focused fixes for specific bottlenecks, repetitive manual tasks, or single API integrations.',
    features: [
      'API integrations & webhooks',
      'Automated workflows',
      'Turnaround in 5–10 days'
    ],
    ctaText: 'Scope this module',
    isPopular: false
  },
  {
    id: 'core-workflow',
    tag: 'Operational Engine',
    title: 'Core Workflow Tool',
    name: 'Custom Build',
    duration: '2–4 weeks',
    description: 'Replace clunky spreadsheets and expensive SaaS subscriptions with a dedicated internal tool.',
    features: [
      'Custom inventory or client portals',
      'Automated invoicing & reporting',
      'Turnaround in 2–4 weeks'
    ],
    ctaText: 'Book a project call',
    isPopular: true
  },
  {
    id: 'comprehensive-system',
    tag: 'Enterprise Scale',
    title: 'Comprehensive System',
    name: 'Full Integration',
    duration: '4–8 weeks',
    description: 'Full-scale backbones unifying multiple departments, warehouse workflows, and complex legacy data.',
    features: [
      'Multi-location operational systems',
      'Full legacy database migrations',
      'Turnaround in 4–8 weeks'
    ],
    ctaText: 'Request system blueprint',
    isPopular: false
  }
];

export const INITIAL_SPEC_FILES: SpecFile[] = [
  {
    id: 'spec-1',
    name: 'northline_workflow_bottlenecks.csv',
    size: '142 KB',
    type: 'CSV Data Sheet',
    dateAdded: 'Today'
  },
  {
    id: 'spec-2',
    name: 'legacy_erp_api_schema.json',
    size: '88 KB',
    type: 'OpenAPI Spec',
    dateAdded: 'Today'
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'architect',
    senderName: 'Alex Rivera',
    senderTitle: 'Lead Systems Architect',
    senderInitials: 'AR',
    text: "Hi, I'm Alex Rivera, Lead Systems Architect at Socio. I review all audit requests personally. Tell me about the software you need or what tasks are slowing your team down — I'll personally review your workflow and outline architectural solutions.",
    timestamp: 'Today, 9:15 AM'
  }
];

export const STARTER_CHIPS = [
  { label: 'Automate spreadsheets & manual sync', icon: 'table_view', prompt: 'We want to replace our multi-sheet Excel tracking with an automated pipeline that syncs inventory and customer orders in real time.' },
  { label: 'Custom internal CRM / Dashboard', icon: 'dashboard', prompt: 'Our team needs a unified operations dashboard where ops leads can assign tickets, track fulfillment, and view daily dispatch metrics.' },
  { label: 'API integrations & webhooks', icon: 'hub', prompt: 'We need to bridge our legacy accounting software with our Shopify store and warehouse 3PL via secure webhooks.' },
  { label: 'Database architecture overhaul', icon: 'database', prompt: 'Our current PostgreSQL database is suffering from slow queries during peak volume, and we need schema optimization plus caching.' }
];

export function generateArchitectResponse(userPrompt: string, orgName: string): string {
  const lower = userPrompt.toLowerCase();
  
  if (lower.includes('spreadsheet') || lower.includes('excel') || lower.includes('sheet') || lower.includes('manual')) {
    return `Thanks for laying this out, ${orgName}. Spreadsheet sprawl is by far the #1 productivity drain we eliminate at Socio.

Here is how we would approach this in your 1–3 day diagnostic:
1. **Source of Truth Consolidation**: We'll trace the exact columns and formulas your team relies on, converting them into structured relational tables (PostgreSQL) with strict data validation.
2. **Dedicated Operational Views**: Instead of scrolling across 40 columns, your team gets purpose-built input forms and instant status boards.
3. **Automated Triggers**: Eliminates manual copy-pasting by pushing updates directly to your other services via webhooks.

We can package this cleanly into our **Core Workflow Tool** model with a hard 2–3 week delivery. What external services or files does your team currently export into these sheets?`;
  }

  if (lower.includes('crm') || lower.includes('dashboard') || lower.includes('portal') || lower.includes('ticket')) {
    return `Got it, ${orgName}. Building an internal dashboard tailored 100% to your ops flow is infinitely cleaner than forcing your team into rigid third-party SaaS seats that charge per user.

Our proposed blueprint:
- **Zero-License Architecture**: You own the code outright. No $120/seat monthly fees.
- **Role-Based Workflows**: Custom views for ops managers vs. dispatchers, giving each person only the data they need.
- **Real-Time Dispatch Metrics**: Sub-second filterable queues with automated status changes and audit logs.

We can deliver this within a 3–4 week sprint under a guaranteed fixed scope. Do you need client-facing access as well, or is this strictly for your internal staff?`;
  }

  if (lower.includes('api') || lower.includes('webhook') || lower.includes('integration') || lower.includes('legacy')) {
    return `Understood. Integrating legacy systems with modern webhooks is a classic **Targeted Sprint** (5–10 days turnaround).

Our standard integration pattern for this:
- **Resilient Middleware Service**: An asynchronous event queue that buffers incoming payloads and retries on failure with dead-letter logging.
- **Data Normalization Layer**: Maps legacy schema fields into clean JSON schemas with payload validation.
- **Monitoring & Health Checks**: Lightweight logging dashboard so your team can verify payload deliveries without looking at raw server logs.

I can have an exact endpoint mapping spec ready within 24 hours. Does your legacy system expose a REST API, or will we connect via direct database read or SFTP flat files?`;
  }

  return `Thanks for sharing these details, ${orgName}. This is exactly the kind of friction we scope and eliminate during our initial diagnostic.

Based on what you've described:
1. **Scope Boundary**: We can lock this down into a fixed-scope milestone with zero vendor lock-in.
2. **Code & Infrastructure Ownership**: The entire repository, deployment manifests, and keys will be handed over directly to your team upon completion.
3. **Next Diagnostic Step**: I'm reviewing the workflow dependencies now. We typically deliver the exact architecture blueprint within 48 hours.

Could you let me know roughly how many team members will interact with this system daily?`;
}
