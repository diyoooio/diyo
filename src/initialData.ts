import { PricingPlan, Project, Message, ActivityLog, MetricCard } from './types';

export const INITIAL_PLANS: PricingPlan[] = [
  {
    id: 'plan-1',
    type: 'fixed',
    name: 'Starter',
    price: '$5k',
    period: '/project',
    nprPrice: 'रू ६,५०,०००',
    nprPeriod: '/प्रोजेक्ट',
    description: 'Perfect for startups needing a high-impact MVP or a single core design sprint.',
    features: [
      'UI/UX Design Concept',
      '5-Day Rapid Sprint',
      'Technical Feasibility Audit',
      'Dedicated Dev Team:false' // we can parse :false or similar, but let's represent as string list is fine
    ],
    active: true,
    popular: false
  },
  {
    id: 'plan-2',
    type: 'monthly',
    name: 'Growth',
    price: '$12k',
    period: '/month',
    nprPrice: 'रू १५,५०,०००',
    nprPeriod: '/महिना',
    description: 'Scale your product with a dedicated team acting as your internal design & dev arm.',
    features: [
      'Continuous UI/UX Updates',
      '2 Full-stack Developers',
      'Priority Support (24h)',
      'Analytics & Growth Strategy'
    ],
    active: true,
    popular: true,
    highlightBadge: 'Most Popular'
  },
  {
    id: 'plan-3',
    type: 'enterprise',
    name: 'Premium',
    price: '$25k',
    period: '/month',
    nprPrice: 'रू ३२,५०,०००',
    nprPeriod: '/महिना',
    description: 'Unlimited high-fidelity engineering and design for enterprise-scale systems.',
    features: [
      'Everything in Growth',
      'Dedicated Account Manager',
      'On-site Workshops Quarterly',
      'Custom Security Compliance'
    ],
    active: true, // Note we make it active, but the toggles are dynamic
    popular: false
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Lumina Venture AI',
    client: 'Sarah Jenkins',
    progress: 75,
    status: 'In Progress',
    prefix: 'LV'
  },
  {
    id: 'proj-2',
    name: 'Solaris Tech',
    client: 'Marcus Aurelius',
    progress: 40,
    status: 'Research',
    prefix: 'ST'
  },
  {
    id: 'proj-3',
    name: 'Ethos Portal',
    client: 'Julia Cheng',
    progress: 95,
    status: 'Testing',
    prefix: 'EP'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    senderName: 'Elena Gilbert',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqDfwQFMOCBH3mOQDBc5CNFczXIQXpZZ1lhYw-y88XLxW2U2s082wt6RgP-ynzuHna_Q3s6LvcbMRzOGo2Ui6kHm_PTAcKrJVgfV0tgQxcL16q4ljLIAI0Q1YQoR7r393EUS83uAUM59SpoHQcOBcGqshIYzSTYLSVp8AR-N64Sjkk589loFY6sdeJPcjExjkzQkL0jlSGEGhKmyOVFW7vjdcbyCDdBhi3DUKRC5VJMBNHrOKQegdlLOmXlehCKKSwkuCS1tjHBW0',
    senderRole: 'Co-Founder, Aura',
    previewText: "The new branding concept looks amazing! Let's schedule a phase 2 kickoff alignment session this week.",
    relativeTime: '2 mins ago',
    email: 'elena@aura.network',
    unread: true,
    replies: []
  },
  {
    id: 'msg-2',
    senderName: 'David Wu',
    senderAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDS4XEs4vxX7EDHq2op89WXbzEQDRs4sA5z6szjVNOZ9up3VOccmhYprsubOvpvc6DbJI5N0CRIOlq7UojlAqtU0hrTYJn27fQGwQCADQgt6G83B617QjtA6jQALNqmA0mzejRMCk-5jEKQOOxWdCJ9QgYq6SPYAaBSsfoaYz4XeLAuSi8iHEc7EUbMcA0SEFWAm0m08h_jOAkgL7Znpzupl9mRED0R56pVG7uV7MWcHg0RvqZdsELb58s2GxM9tcwEN1aU0hZWm_E',
    senderRole: 'Head of Product, Solaris',
    previewText: 'Can we adjust the transition timing on the homepage? I think the flame particle effect could be slightly faster.',
    relativeTime: '1 hour ago',
    email: 'david.wu@solaris.io',
    unread: true,
    replies: []
  },
  {
    id: 'msg-3',
    senderName: 'Sarah Meyer',
    senderAvatar: '', // SM fallback
    senderRole: 'VP of Engineering, Ethos',
    previewText: 'Contract signed. Excited to get started on phase 2. Let me know when you need our database credentials.',
    relativeTime: '5 hours ago',
    email: 'smeyer@ethos.org',
    unread: false,
    replies: ['Hi Sarah! Great, we will kick off this Tuesday. Prepare your database blueprints.']
  }
];

export const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    title: 'NeoBank Mobile App Launched',
    relativeTime: '2 hours ago',
    type: 'rocket_launch'
  },
  {
    id: 'act-2',
    title: 'New inquiry from Tesla Inc.',
    relativeTime: '5 hours ago',
    type: 'email'
  },
  {
    id: 'act-3',
    title: 'Pricing Page Revision Finalized',
    relativeTime: 'Yesterday',
    type: 'done_all'
  }
];

export const INITIAL_METRICS = (projectsCount: number, leadsCount: number, messagesCount: number): MetricCard[] => [
  {
    id: 'met-1',
    label: 'Total Projects',
    value: String(projectsCount),
    trend: '+12.5%',
    trendDirection: 'up',
    icon: 'Rocket',
    sparkData: [30, 45, 40, 75, 95]
  },
  {
    id: 'met-2',
    label: 'Total Leads',
    value: String(leadsCount),
    trend: '+4.2%',
    trendDirection: 'up',
    icon: 'Hub',
    sparkData: [60, 40, 65, 80, 55]
  },
  {
    id: 'met-3',
    label: 'Total Messages',
    value: String(messagesCount),
    trend: '-2.1%',
    trendDirection: 'down',
    icon: 'MessageSquare',
    sparkData: [40, 30, 70, 50, 45]
  },
  {
    id: 'met-4',
    label: 'Active Clients',
    value: '12',
    trend: '+15.0%',
    trendDirection: 'up',
    icon: 'Users',
    sparkData: [20, 35, 40, 60, 85]
  }
];
