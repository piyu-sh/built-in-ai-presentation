/** Synthetic content only. Safe to publish in a public repo. */

export const REVIEWS = `Review 1 — "Been using this for two weeks. Sync is instant and the offline mode actually works. Best update in a long time." — 5 stars

Review 2 — "The new UI is beautiful but I cannot find the export button anymore. Took me ten minutes and I still have no idea." — 2 stars

Review 3 — "Crashes every single time I try to export a PDF. Support has not replied in four days. Very frustrating." — 1 star

Review 4 — "Le design est propre et l'application est rapide. Par contre, la traduction française est parfois bizarre." — 4 stars

Review 5 — "I only need dark mode and keyboard shortcuts. Everything else is fine." — 4 stars

Review 6 — "THE APP IS AMAZING!!! I TELL EVERYONE ABOUT IT!!!" — 5 stars

Review 7 — "I bought the pro version mainly for the team features. Sharing a workspace is easy, but permissions are confusing." — 3 stars

Review 8 — "After the latest update my saved filters disappeared. Please bring them back." — 2 stars

Review 9 — "This replaced three tools for me. Onboarding took five minutes and the mobile app is surprisingly good." — 5 stars

Review 10 — "機能は良いですが、日本語のフォントが小さすぎます。もっと大きくしてください。" — 3 stars

Review 11 — "Price is fair for what you get. Wish there was a one-time purchase option." — 4 stars

Review 12 — "Not relevant to this product but the unsubscribe flow was easy, so here is a review anyway." — 3 stars

Review 13 — "Customer support replied within an hour on a Sunday. Fixed my issue and followed up the next day." — 5 stars

Review 14 — "Es fácil de usar y muy rápido, pero la sincronización con Google Drive falla a veces." — 3 stars

Review 15 — "Battery drain is real on older laptops. On a new machine it is fine." — 3 stars`;

export const SAMPLES = [
  { label: 'English', text: 'The app is fast and the new design is lovely, but exporting a PDF crashes every time.' },
  { label: 'Français', text: "L'application est rapide et le nouveau design est agréable, mais l'export PDF plante à chaque fois." },
  { label: '日本語', text: 'アプリは速くて新しいデザインも良いのですが、PDFを書き出すと毎回クラッシュします。' },
];

export const INVOICE_EMAIL = `Hi team,

Sorry for the delay on this one. Attached should be the final paperwork for the August engagement — the PDF is the invoice, the spreadsheet is the timesheet.

A few specifics so nobody has to ask again:
Vendor is Northwind Labs. Invoice number INV-2026-0817. Billing period 2026-08-01 through 2026-08-31.
Total due is 4,250.00 USD, payment terms net 30. Our PO reference is PO-77120, and the approver is Dana Okafor.

One thing changed from the draft: the line for onboarding support was removed, so please do not pay the older 4,900.00 version if that one turns up.

Also — completely unrelated — does anyone know if the conference hotel still has rooms?

Thanks,
Sam`;

export const SCHEMAS = {
  invoice: {
    description: 'Fields from a messy invoice email',
    schema: {
      type: 'object',
      properties: {
        vendor: { type: 'string' },
        invoiceNumber: { type: 'string' },
        total: { type: 'number' },
        currency: { type: 'string' },
        dueDate: { type: 'string', description: 'ISO date if terms and period allow a calculation, else empty' },
        poReference: { type: 'string' },
      },
      required: ['vendor', 'invoiceNumber', 'total', 'currency'],
      additionalProperties: false,
    },
  },
  review: {
    description: 'Fields from a review thread',
    schema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        sentiment: { type: 'string', enum: ['positive', 'mixed', 'negative'] },
        mentionedFeatures: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
      },
      required: ['topic', 'sentiment', 'mentionedFeatures', 'actionItems'],
      additionalProperties: false,
    },
  },
} as const;

export type SchemaKey = keyof typeof SCHEMAS;

export const CANNED = {
  hello: {
    detect: 'fr',
    translate: 'The application is fast and the new design is pleasant, but the PDF export crashes every time.',
    summary: 'Users like the speed and design, but PDF export is broken and support responsiveness is mixed.',
  },
  summary: {
    short: 'Users praise speed and design; PDF export crashes and support response times are inconsistent.',
    bullets:
      '• Speed, offline mode, and the new design get consistent praise.\n• PDF export crashes repeatedly; saved filters disappeared after an update.\n• Permissions and translations are confusing; non-English users report small fonts and awkward phrasing.\n• Support is either excellent or absent — no middle ground.',
    paragraph:
      'The overall signal is positive on performance and design, with two clear problem clusters: exporting PDFs (reliable crashes, no reply from support) and discoverability after the UI redesign. Non-English reviewers add specific usability complaints. A few reviews are off-topic and should be filtered before analysis.',
  },
  structured: {
    invoice: {
      vendor: 'Northwind Labs',
      invoiceNumber: 'INV-2026-0817',
      total: 4250,
      currency: 'USD',
      dueDate: '',
      poReference: 'PO-77120',
    },
    review: {
      topic: 'Review thread for a productivity app',
      sentiment: 'mixed',
      mentionedFeatures: ['sync', 'offline mode', 'PDF export', 'dark mode', 'permissions', 'mobile app'],
      actionItems: ['Fix PDF export crash', 'Restore saved filters', 'Clarify permissions', 'Enlarge Japanese font'],
    },
  },
} as const;

export const INJECTION_INPUT = '<scripte>console.log("hello")</scripte>';
export const INJECTION_OUTPUT_CANNED = '<script>console.log("hello")</script>';
