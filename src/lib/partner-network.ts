// Organisations Growth Hub has actually worked with: everyone who took part in
// the 9 July 2026 "Entrepreneurship for Everyone" summit, plus current
// partners. Drives the /partners directory and the proof strip on the home
// page. Names only — no logos until each organisation sends one.

export interface NetworkGroup {
  heading: string;
  orgs: Array<{ name: string; role: string }>;
}

export const PARTNER_NETWORK: NetworkGroup[] = [
  {
    heading: 'Hosts',
    orgs: [
      { name: 'CBR Innovation Network', role: 'Summit co-host' },
      { name: 'Himayat', role: 'Community and outreach' },
      { name: 'Social Traders', role: 'Our social enterprise certifier' },
    ],
  },
  {
    heading: 'Advice, mentoring and funding',
    orgs: [
      { name: 'Asuria', role: 'Business planning, employment' },
      { name: 'Many Rivers', role: 'Microenterprise, microfinance' },
      { name: 'National Self Employment Association', role: 'Self-employment' },
      { name: 'The Mill House Ventures', role: 'Social enterprise' },
      { name: 'Canberra Business Advice and Support Service', role: 'Business advice' },
      { name: 'Bendigo Bank', role: 'Banking and finance' },
      { name: 'Hands Across Canberra', role: 'Community funding' },
      { name: 'RKDN', role: 'Advisory' },
    ],
  },
  {
    heading: 'Industry, trades and skills',
    orgs: [
      { name: 'Canberra Business Chamber', role: 'Industry and advocacy' },
      { name: 'ICN', role: 'Industry capability' },
      { name: 'Master Builders Association', role: 'Building industry' },
      { name: 'Navitas Skilled Futures', role: 'Skills and training' },
      { name: 'MTC Australia', role: 'Employment and training' },
      { name: 'DEWR', role: 'Government' },
      { name: 'Small Business Digital', role: 'Digital programs' },
      { name: 'What Works', role: 'Workflow support' },
      { name: 'Record TIME', role: 'Digital dockets for trades' },
    ],
  },
  {
    heading: 'Digital, marketing and creative',
    orgs: [
      { name: 'RD Consulting', role: 'Marketing and LinkedIn' },
      { name: 'Normtech', role: 'IT and cyber security' },
      { name: 'Allara Creative', role: 'Branding and design' },
      { name: 'PadNova', role: 'Positioning and offers' },
    ],
  },
  {
    heading: 'Community, multicultural and inclusion',
    orgs: [
      { name: 'MARSS ACT', role: 'Settlement services' },
      { name: 'Catalysr', role: 'Migrant founder accelerator' },
      { name: 'Her Zest', role: 'Women in business' },
      { name: 'Canberra Women in Business', role: 'Women in business' },
      { name: "Women's Centre for Health Matters", role: 'Health and wellbeing' },
      { name: 'Australian Red Cross (ACT)', role: 'Community services' },
      { name: 'Canberra Multicultural Community Forum', role: 'Multicultural community' },
      { name: 'Multicultural Hub Canberra', role: 'Multicultural community' },
    ],
  },
];

/** A short, recognisable selection for the home page proof strip. */
export const PROOF_NAMES = [
  'CBR Innovation Network',
  'Canberra Business Chamber',
  'Asuria',
  'MARSS ACT',
  'Navitas Skilled Futures',
  'The Mill House Ventures',
];
