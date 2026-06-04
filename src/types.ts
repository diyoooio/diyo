export interface PricingPlan {
  id: string;
  type: 'fixed' | 'monthly' | 'enterprise';
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  active: boolean;
  popular: boolean;
  highlightBadge?: string;
  nprPrice?: string;
  nprPeriod?: string;
}

export interface Deliverable {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: string;
  type: 'document' | 'design' | 'specification' | 'archive';
  uploadedAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string; // Client name
  clientEmail?: string; // Target email
  description?: string;
  progress: number; // 0 to 100
  status: 'In Progress' | 'Research' | 'Testing' | 'Completed';
  prefix: string; // e.g., 'LV'
  deadline?: string;
  deliverables?: Deliverable[];
}

export interface Message {
  id: string;
  senderName: string;
  senderAvatar: string;
  senderRole?: string;
  previewText: string;
  relativeTime: string;
  email: string;
  unread: boolean;
  replies?: string[];
  isClientMessage?: boolean; // True if sent by client
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  relativeTime: string;
  type: 'launch' | 'email' | 'done_all' | 'rocket_launch' | 'invite' | 'user' | 'billing' | 'ticket';
  clientName?: string; // Opt client name for categorization
  timestamp?: string; // Absolute ISO date string
}

export interface MetricCard {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down';
  icon: string; // lucide icon name
  sparkData: number[]; // relative heights for visualization
}

export interface Invitation {
  invitationCode: string; // e.g. "ABCD1234XYZ"
  email: string;
  phone?: string; // Client's phone number
  password?: string; // Client's custom designated password
  projectId?: string;
  projectName?: string;
  plan: string;
  customFeatures?: string[]; // Specific customized features for this client
  status: 'Pending' | 'Accepted' | 'Expired' | 'Revoked';
  createdAt: string;
  expiresAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string; // Client's phone number
  password?: string; // Client secure password
  avatar: string;
  status: 'Active' | 'Suspended';
  projectId?: string;
  projectName?: string;
  plan?: string;
  customFeatures?: string[]; // Custom client features/SLA checklist
  joinedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  clientEmail: string;
  status: 'Open' | 'In Progress' | 'Closed';
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  createdAt: string;
  replies?: {
    id: string;
    sender: 'client' | 'admin';
    senderName: string;
    message: string;
    createdAt: string;
  }[];
}

export interface Invoice {
  id: string;
  title: string;
  amount: string;
  clientEmail: string;
  status: 'Paid' | 'Unpaid';
  dueDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  phone?: string;
  password?: string;
  avatar?: string;
  joinedAt: string;
}
