import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  PricingPlan, 
  Project, 
  Message, 
  ActivityLog, 
  MetricCard, 
  Invitation, 
  Client, 
  Ticket, 
  Invoice, 
  User, 
  Deliverable 
} from '../types';
import { 
  INITIAL_PLANS, 
  INITIAL_PROJECTS, 
  INITIAL_MESSAGES, 
  INITIAL_ACTIVITIES, 
  INITIAL_METRICS 
} from '../initialData';

interface StorageContextType {
  plans: PricingPlan[];
  projects: Project[];
  messages: Message[];
  activities: ActivityLog[];
  metrics: MetricCard[];
  invitations: Invitation[];
  clients: Client[];
  tickets: Ticket[];
  invoices: Invoice[];
  
  // Navigation
  currentView: 'public' | 'login' | 'admin' | 'client-dashboard' | 'invite-landing';
  adminTab: 'overview' | 'projects' | 'pricing' | 'messages' | 'settings' | 'invitations' | 'clients' | 'audit';
  isAdminAuthenticated: boolean;
  adminEmail: string | null;
  currentUser: User | null; // active client session user
  activeInviteCode: string | null; // currently loaded invitation code
  
  // Basic Handlers
  setViews: (view: 'public' | 'login' | 'admin' | 'client-dashboard' | 'invite-landing') => void;
  setAdminTab: (tab: 'overview' | 'projects' | 'pricing' | 'messages' | 'settings' | 'invitations' | 'clients' | 'audit') => void;
  loginAdmin: (email: string) => boolean;
  loginClient: (email: string, password?: string) => boolean;
  logoutAdmin: () => void;
  logoutClient: () => void;
  resetAll: () => void;

  // Custom Invitation Management
  setActiveInviteCode: (code: string | null) => void;
  generateInvitation: (email: string, projectName: string, planName: string, durationDays: number, phone?: string, customFeatures?: string[], password?: string) => Invitation;
  disableInvitation: (code: string) => void;
  acceptInvitation: (code: string, clientName: string, clientPhone?: string, clientPassword?: string) => boolean;
  resendInvitationSignal: (code: string) => void;

  // Client Hub
  addClientDirect: (client: Client) => void;
  updateClient: (client: Client) => void;
  toggleClientStatus: (id: string) => void;
  deleteClient: (id: string) => void;

  // Project Deliverables & Pipeline
  saveProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addDeliverable: (projectId: string, name: string, type: 'document'|'design'|'specification'|'archive', fileSize: string) => void;

  // Correspondence messaging
  addMessage: (name: string, email: string, text: string, role?: string, isClientMessage?: boolean) => void;
  markMessageRead: (id: string) => void;
  replyToMessage: (id: string, text: string) => void;

  // Financial system
  addInvoice: (title: string, amount: string, clientEmail: string, dueDate: string) => void;
  payInvoice: (id: string) => void;
  deleteInvoice: (id: string) => void;

  // Support system
  addTicket: (tkt: Omit<Ticket, 'id' | 'createdAt'>) => void;
  addTicketReply: (ticketId: string, message: string, sender: 'client'|'admin', senderName: string) => void;
  updateTicketStatus: (ticketId: string, status: 'Open' | 'In Progress' | 'Closed') => void;

  // User details
  updateUserProfile: (name: string, avatar: string, phone?: string, password?: string) => void;

  // Real-time Activity feed logger
  logActivity: (title: string, type: ActivityLog['type'], clientName?: string) => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentView, setViewsState] = useState<'public' | 'login' | 'admin' | 'client-dashboard' | 'invite-landing'>('public');
  const [adminTab, setAdminTab] = useState<'overview' | 'projects' | 'pricing' | 'messages' | 'settings' | 'invitations' | 'clients' | 'audit'>('overview');
  
  // Auth contexts
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeInviteCode, setActiveInviteCode] = useState<string | null>(null);

  // States
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  // Added Collections
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load datasets on mount
  useEffect(() => {
    // Basic Diyo defaults
    const storedPlans = localStorage.getItem('diyo_plans');
    const storedProjects = localStorage.getItem('diyo_projects');
    const storedMessages = localStorage.getItem('diyo_messages');
    const storedActivities = localStorage.getItem('diyo_activities');
    const storedAuthState = localStorage.getItem('diyo_auth');
    const storedAuthEmail = localStorage.getItem('diyo_auth_email');

    // Extended Sandbox defaults
    const storedInvitations = localStorage.getItem('diyo_invitations');
    const storedClients = localStorage.getItem('diyo_clients');
    const storedTickets = localStorage.getItem('diyo_tickets');
    const storedInvoices = localStorage.getItem('diyo_invoices');
    const storedClientUser = localStorage.getItem('diyo_client_user');
    const storedActiveInvite = localStorage.getItem('diyo_active_invite');

    if (storedPlans) {
      setPlans(JSON.parse(storedPlans));
    } else {
      setPlans(INITIAL_PLANS);
      localStorage.setItem('diyo_plans', JSON.stringify(INITIAL_PLANS));
    }

    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    } else {
      setProjects(INITIAL_PROJECTS);
      localStorage.setItem('diyo_projects', JSON.stringify(INITIAL_PROJECTS));
    }

    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages(INITIAL_MESSAGES);
      localStorage.setItem('diyo_messages', JSON.stringify(INITIAL_MESSAGES));
    }

    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    } else {
      setActivities(INITIAL_ACTIVITIES);
      localStorage.setItem('diyo_activities', JSON.stringify(INITIAL_ACTIVITIES));
    }

    // Default invitations load
    if (storedInvitations) {
      setInvitations(JSON.parse(storedInvitations));
    } else {
      const defaultInvites: Invitation[] = [
        {
          invitationCode: 'ABCD1234XYZ',
          email: 'sarah@auroradigital.co',
          password: 'securePass123',
          projectId: 'proj-1',
          projectName: 'Lumina Venture AI',
          plan: 'Growth',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        },
        {
          invitationCode: 'DIYO999GOLD',
          email: 'solar@partner.co',
          password: 'solarPass2026',
          projectId: 'proj-2',
          projectName: 'Solaris Tech',
          plan: 'Premium',
          status: 'Pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
        }
      ];
      setInvitations(defaultInvites);
      localStorage.setItem('diyo_invitations', JSON.stringify(defaultInvites));
    }

    // Default clients load
    if (storedClients) {
      setClients(JSON.parse(storedClients));
    } else {
      const defaultClients: Client[] = [
        {
          id: 'client-sarah',
          name: 'Sarah Jenkins',
          email: 'sarah@auroradigital.co',
          password: 'securePass123',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          status: 'Active',
          projectId: 'proj-1',
          projectName: 'Lumina Venture AI',
          plan: 'Growth',
          joinedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
        }
      ];
      setClients(defaultClients);
      localStorage.setItem('diyo_clients', JSON.stringify(defaultClients));
    }

    // Default support tickets load
    if (storedTickets) {
      setTickets(JSON.parse(storedTickets));
    } else {
      const defaultTickets: Ticket[] = [
        {
          id: 'tkt-1',
          title: 'Database connection configuration',
          clientEmail: 'sarah@auroradigital.co',
          status: 'In Progress',
          severity: 'High',
          description: 'We are trying to connect the Lumina Venture production database cluster to the local sandbox but are getting socket exceptions. Can you verify if credentials or origin keys are permitted on your Firebase instance?',
          createdAt: new Date().toLocaleString(),
          replies: [
            {
              id: 'r1',
              sender: 'admin',
              senderName: 'Nishant',
              message: 'Hello Sarah! I checked the Firestore rules, make sure request.auth.token.email_verified == true is evaluated and you are passing correct authorization tokens.',
              createdAt: 'Yesterday at 4:15 PM'
            }
          ]
        }
      ];
      setTickets(defaultTickets);
      localStorage.setItem('diyo_tickets', JSON.stringify(defaultTickets));
    }

    // Default invoices load
    if (storedInvoices) {
      setInvoices(JSON.parse(storedInvoices));
    } else {
      const defaultInvoices: Invoice[] = [
        {
          id: 'inv-1',
          title: 'Phase 1 - Brand Identity Wireframes',
          amount: 'NPR 1,20,000',
          clientEmail: 'sarah@auroradigital.co',
          status: 'Paid',
          dueDate: '2026-06-15'
        },
        {
          id: 'inv-2',
          title: 'Phase 2 - Software Architecture Buildout',
          amount: 'NPR 3,50,000',
          clientEmail: 'sarah@auroradigital.co',
          status: 'Unpaid',
          dueDate: '2026-06-30'
        },
        {
          id: 'inv-3',
          title: 'Sprint 3 - API Integration Settle',
          amount: 'NPR 2,90,000',
          clientEmail: 'solar@partner.co',
          status: 'Unpaid',
          dueDate: '2026-07-20'
        }
      ];
      setInvoices(defaultInvoices);
      localStorage.setItem('diyo_invoices', JSON.stringify(defaultInvoices));
    }

    // Auth States loading
    if (storedAuthState === 'true') {
      setIsAdminAuthenticated(true);
      setAdminEmail(storedAuthEmail);
      setViewsState('admin');
    } else if (storedClientUser) {
      const userObj = JSON.parse(storedClientUser);
      setCurrentUser(userObj);
      setViewsState('client-dashboard');
    }

    if (storedActiveInvite) {
      setActiveInviteCode(storedActiveInvite);
    }
  }, []);

  // Sync utilities
  const syncPlans = (data: PricingPlan[]) => {
    setPlans(data);
    localStorage.setItem('diyo_plans', JSON.stringify(data));
  };

  const syncProjects = (data: Project[]) => {
    setProjects(data);
    localStorage.setItem('diyo_projects', JSON.stringify(data));
  };

  const syncMessages = (data: Message[]) => {
    setMessages(data);
    localStorage.setItem('diyo_messages', JSON.stringify(data));
  };

  const syncActivities = (data: ActivityLog[]) => {
    setActivities(data);
    localStorage.setItem('diyo_activities', JSON.stringify(data));
  };

  const syncInvitations = (data: Invitation[]) => {
    setInvitations(data);
    localStorage.setItem('diyo_invitations', JSON.stringify(data));
  };

  const syncClients = (data: Client[]) => {
    setClients(data);
    localStorage.setItem('diyo_clients', JSON.stringify(data));
  };

  const syncTickets = (data: Ticket[]) => {
    setTickets(data);
    localStorage.setItem('diyo_tickets', JSON.stringify(data));
  };

  const syncInvoices = (data: Invoice[]) => {
    setInvoices(data);
    localStorage.setItem('diyo_invoices', JSON.stringify(data));
  };

  // Auth Operations
  const loginAdmin = (email: string): boolean => {
    setIsAdminAuthenticated(true);
    setAdminEmail(email);
    localStorage.setItem('diyo_auth', 'true');
    localStorage.setItem('diyo_auth_email', email);
    // Clear active client user to avoid session conflict
    setCurrentUser(null);
    localStorage.removeItem('diyo_client_user');
    setViewsState('admin');
    return true;
  };

  const loginClient = (email: string, password?: string): boolean => {
    const matched = clients.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
    if (!matched) return false;

    // Check if suspended
    if (matched.status === 'Suspended') return false;

    // If client has a password set, we MUST validate it for safety (as requested by user)
    if (matched.password) {
      if (!password || matched.password.trim() !== password.trim()) {
        return false;
      }
    }

    const authenticatedUser: User = {
      id: matched.id,
      name: matched.name,
      email: matched.email,
      role: 'client',
      phone: matched.phone,
      password: matched.password,
      joinedAt: matched.joinedAt || new Date().toISOString()
    };

    // Clear admin state
    setIsAdminAuthenticated(false);
    setAdminEmail(null);
    localStorage.removeItem('diyo_auth');
    localStorage.removeItem('diyo_auth_email');

    setCurrentUser(authenticatedUser);
    localStorage.setItem('diyo_client_user', JSON.stringify(authenticatedUser));
    setViewsState('client-dashboard');
    return true;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAdminEmail(null);
    localStorage.removeItem('diyo_auth');
    localStorage.removeItem('diyo_auth_email');
    setViewsState('public');
  };

  const logoutClient = () => {
    setCurrentUser(null);
    localStorage.removeItem('diyo_client_user');
    setViewsState('public');
  };

  const setViews = (view: 'public' | 'login' | 'admin' | 'client-dashboard' | 'invite-landing') => {
    if (view === 'admin' && !isAdminAuthenticated) {
      setViewsState('login');
    } else {
      setViewsState(view);
    }
  };

  const resetAll = () => {
    localStorage.removeItem('diyo_plans');
    localStorage.removeItem('diyo_projects');
    localStorage.removeItem('diyo_messages');
    localStorage.removeItem('diyo_activities');
    localStorage.removeItem('diyo_invitations');
    localStorage.removeItem('diyo_clients');
    localStorage.removeItem('diyo_tickets');
    localStorage.removeItem('diyo_invoices');
    localStorage.removeItem('diyo_client_user');
    localStorage.removeItem('diyo_active_invite');

    setPlans(INITIAL_PLANS);
    setProjects(INITIAL_PROJECTS);
    setMessages(INITIAL_MESSAGES);
    setActivities(INITIAL_ACTIVITIES);
    
    // Clear custom arrays
    setInvitations([]);
    setClients([]);
    setTickets([]);
    setInvoices([]);
    setCurrentUser(null);
    setActiveInviteCode(null);
    setViewsState('public');
  };

  // ==========================================
  // INVITATION HUB LOGIC
  // ==========================================
  
  const updateInviteCodeState = (code: string | null) => {
    setActiveInviteCode(code);
    if (code) {
      localStorage.setItem('diyo_active_invite', code);
    } else {
      localStorage.removeItem('diyo_active_invite');
    }
  };

  // Generate invite code and document
  const generateInvitation = (email: string, projectName: string, planName: string, durationDays: number, phone?: string, customFeatures?: string[], password?: string): Invitation => {
    // e.g. Random Code DIYO-XXXXX
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rand = '';
    for (let i = 0; i < 9; i++) {
      rand += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const invitationCode = `DIYO${rand}`;

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    // Check if Project already exists under that name or create it
    let linkedProj = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    let projectId = linkedProj?.id;

    if (!linkedProj) {
      projectId = `proj-${Date.now()}`;
      const newProj: Project = {
        id: projectId,
        name: projectName,
        client: 'Awaiting Invitation Acceptance',
        clientEmail: email,
        progress: 10,
        status: 'Research',
        prefix: 'DY',
        deliverables: []
      };
      syncProjects([newProj, ...projects]);
    } else {
      // update project client email
      linkedProj.clientEmail = email;
      syncProjects([...projects]);
    }

    // Secure password generation if not supplied
    let securePassword = password ? password.trim() : '';
    if (!securePassword) {
      const passPool = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      for (let i = 0; i < 8; i++) {
        securePassword += passPool.charAt(Math.floor(Math.random() * passPool.length));
      }
    }

    const newInvite: Invitation = {
      invitationCode,
      email,
      phone,
      password: securePassword,
      projectId,
      projectName,
      plan: planName,
      customFeatures,
      status: 'Pending',
      createdAt,
      expiresAt
    };

    const updatedInv = [newInvite, ...invitations];
    syncInvitations(updatedInv);

    // Register visual lead activity
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Secured invitation keys issued for "${email}"`,
      relativeTime: 'Just Now',
      type: 'invite'
    };
    syncActivities([newAct, ...activities]);

    return newInvite;
  };

  const disableInvitation = (code: string) => {
    const updated = invitations.map(inv => 
      inv.invitationCode === code ? { ...inv, status: 'Revoked' as const } : inv
    );
    syncInvitations(updated);
  };

  // Acceptance workflow triggers client profile and dashboard transition
  const acceptInvitation = (code: string, clientName: string, clientPhone?: string, clientPassword?: string): boolean => {
    const inviteIndex = invitations.findIndex(i => i.invitationCode === code && i.status === 'Pending');
    if (inviteIndex === -1) return false;

    const sourceInvite = invitations[inviteIndex];
    
    // Status Accepted
    const updatedInvitations = [...invitations];
    updatedInvitations[inviteIndex] = { ...sourceInvite, status: 'Accepted' };
    syncInvitations(updatedInvitations);

    // Register active user
    const brandNewClientId = `cli-${Date.now()}`;
    const newClientObj: Client = {
      id: brandNewClientId,
      name: clientName,
      email: sourceInvite.email,
      phone: clientPhone || sourceInvite.phone,
      password: clientPassword || sourceInvite.password,
      avatar: '',
      status: 'Active',
      projectId: sourceInvite.projectId,
      projectName: sourceInvite.projectName,
      plan: sourceInvite.plan,
      customFeatures: sourceInvite.customFeatures,
      joinedAt: new Date().toISOString()
    };

    const updatedClients = [newClientObj, ...clients];
    syncClients(updatedClients);

    // Update the Linked Project client info
    if (sourceInvite.projectId) {
      const projIndex = projects.findIndex(p => p.id === sourceInvite.projectId);
      if (projIndex > -1) {
        const updatedProjects = [...projects];
        updatedProjects[projIndex] = {
          ...updatedProjects[projIndex],
          client: clientName,
          clientEmail: sourceInvite.email
        };
        syncProjects(updatedProjects);
      }
    }

    // Set User Profile session
    const authenticatedUser: User = {
      id: brandNewClientId,
      name: clientName,
      email: sourceInvite.email,
      role: 'client',
      phone: clientPhone || sourceInvite.phone,
      password: clientPassword || sourceInvite.password,
      joinedAt: new Date().toISOString()
    };
    
    setCurrentUser(authenticatedUser);
    localStorage.setItem('diyo_client_user', JSON.stringify(authenticatedUser));

    // Register activities log
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Client logged in & verified: "${clientName}"`,
      relativeTime: 'Just Now',
      type: 'user',
      clientName: clientName,
      timestamp: new Date().toISOString()
    };
    syncActivities([newAct, ...activities]);

    // Force redirect to client dashboard
    setViewsState('client-dashboard');
    return true;
  };

  const resendInvitationSignal = (code: string) => {
    const inv = invitations.find(i => i.invitationCode === code);
    if (!inv) return;

    // Simulating resend
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Secured key reminder transmitted to ${inv.email}`,
      relativeTime: 'Just now',
      type: 'email'
    };
    syncActivities([newAct, ...activities]);
  };

  // ==========================================
  // CLIENT DIRECT MANAGEMENT (ADMIN PANEL)
  // ==========================================

  const addClientDirect = (client: Client) => {
    const updated = [client, ...clients];
    syncClients(updated);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Direct Client Created: "${client.name}"`,
      relativeTime: 'Just now',
      type: 'user'
    };
    syncActivities([newAct, ...activities]);
  };

  const updateClient = (client: Client) => {
    const updated = clients.map(c => c.id === client.id ? client : c);
    syncClients(updated);
  };

  const toggleClientStatus = (id: string) => {
    let changedClient: Client | undefined;
    const updated = clients.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Active' ? 'Suspended' as const : 'Active' as const;
        changedClient = { ...c, status: nextStatus };
        return changedClient;
      }
      return c;
    });
    syncClients(updated);

    if (changedClient) {
      const newAct: ActivityLog = {
        id: `act-${Date.now()}`,
        title: `Client status updated: "${changedClient.name}" status set to ${changedClient.status}`,
        relativeTime: 'Just now',
        type: 'user',
        clientName: changedClient.name,
        timestamp: new Date().toISOString()
      };
      syncActivities([newAct, ...activities]);
    }
  };

  const deleteClient = (id: string) => {
    const target = clients.find(c => c.id === id);
    if (!target) return;
    const updated = clients.filter(c => c.id !== id);
    syncClients(updated);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Client profile disconnected: ${target.name}`,
      relativeTime: 'Just now',
      type: 'user'
    };
    syncActivities([newAct, ...activities]);
  };

  // ==========================================
  // PROJECT ACTIONS
  // ==========================================

  const saveProject = (project: Project) => {
    const existingIndex = projects.findIndex(p => p.id === project.id);
    let updated: Project[];
    if (existingIndex > -1) {
      updated = [...projects];
      updated[existingIndex] = project;
    } else {
      updated = [project, ...projects];
    }
    syncProjects(updated);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Project Registered: "${project.name}"`,
      relativeTime: 'Just Now',
      type: 'rocket_launch'
    };
    syncActivities([newAct, ...activities]);
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    syncProjects(updated);
  };

  const addDeliverable = (projectId: string, name: string, type: 'document'|'design'|'specification'|'archive', fileSize: string) => {
    const projIndex = projects.findIndex(p => p.id === projectId);
    if (projIndex === -1) return;

    const proj = projects[projIndex];
    const newDel: Deliverable = {
      id: `del-${Date.now()}`,
      name,
      fileUrl: '#',
      fileSize,
      type,
      uploadedAt: new Date().toLocaleString()
    };

    const updatedDeliverables = [newDel, ...(proj.deliverables || [])];
    const updatedProjects = [...projects];
    updatedProjects[projIndex] = {
      ...proj,
      deliverables: updatedDeliverables
    };
    syncProjects(updatedProjects);

    // Activity Log
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Deliverable document uploaded: "${name}"`,
      relativeTime: 'Just now',
      type: 'launch'
    };
    syncActivities([newAct, ...activities]);
  };

  // ==========================================
  // MESSAGING / CORRESPONDENCE
  // ==========================================

  const addMessage = (name: string, email: string, text: string, role?: string, isClientMessage?: boolean) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderName: name,
      senderAvatar: '',
      previewText: text,
      relativeTime: 'Just now',
      email: email,
      unread: true,
      senderRole: role || 'Collaborator',
      replies: [],
      isClientMessage: !!isClientMessage,
      createdAt: new Date().toISOString()
    };

    const updated = [newMessage, ...messages];
    syncMessages(updated);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: isClientMessage ? `Response from Partner: "${name}"` : `New inbound query from "${name}"`,
      relativeTime: 'Just now',
      type: 'email'
    };
    syncActivities([newAct, ...activities]);
  };

  const markMessageRead = (id: string) => {
    const updated = messages.map(m => m.id === id ? { ...m, unread: false } : m);
    syncMessages(updated);
  };

  const replyToMessage = (id: string, text: string) => {
    const updated = messages.map(m => {
      if (m.id === id) {
        return {
          ...m,
          unread: false,
          replies: [...(m.replies || []), text]
        };
      }
      return m;
    });
    syncMessages(updated);
  };

  // ==========================================
  // BILLING / INVOICING
  // ==========================================

  const addInvoice = (title: string, amount: string, clientEmail: string, dueDate: string) => {
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      title,
      amount,
      clientEmail,
      status: 'Unpaid',
      dueDate
    };
    const updated = [newInv, ...invoices];
    syncInvoices(updated);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `Invoice set up: "${title}" (${amount})`,
      relativeTime: 'Just now',
      type: 'billing'
    };
    syncActivities([newAct, ...activities]);
  };

  const payInvoice = (id: string) => {
    const updated = invoices.map(i => i.id === id ? { ...i, status: 'Paid' as const } : i);
    syncInvoices(updated);

    // Logging Activity
    const invObj = invoices.find(i => i.id === id);
    if (invObj) {
      const newAct: ActivityLog = {
        id: `act-${Date.now()}`,
        title: `Payment logged: "${invObj.title}" cleared.`,
        relativeTime: 'Just now',
        type: 'billing'
      };
      syncActivities([newAct, ...activities]);
    }
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter(i => i.id !== id);
    syncInvoices(updated);
  };

  // ==========================================
  // CUSTOMER SUPPORT SYSTEMS
  // ==========================================

  const addTicket = (tkt: Omit<Ticket, 'id' | 'createdAt'>) => {
    const newTkt: Ticket = {
      ...tkt,
      id: `tkt-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
      replies: []
    };
    const updated = [newTkt, ...tickets];
    syncTickets(updated);

    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title: `System Support Incident Opened: "${tkt.title}"`,
      relativeTime: 'Just now',
      type: 'ticket'
    };
    syncActivities([newAct, ...activities]);
  };

  const addTicketReply = (ticketId: string, message: string, sender: 'client'|'admin', senderName: string) => {
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        const newRep = {
          id: `rep-${Date.now()}`,
          sender,
          senderName,
          message,
          createdAt: 'Just now'
        };
        return {
          ...t,
          replies: [...(t.replies || []), newRep],
          // automatically open if client writes, or process live status
          status: sender === 'admin' ? ('In Progress' as const) : t.status
        };
      }
      return t;
    });
    syncTickets(updated);
  };

  const updateTicketStatus = (ticketId: string, status: 'Open' | 'In Progress' | 'Closed') => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status } : t);
    syncTickets(updated);
  };

  // ==========================================
  // USER MODIFICATIONS
  // ==========================================
  const updateUserProfile = (name: string, avatar: string, phone?: string, password?: string) => {
    if (!currentUser) return;
    const updUser = { ...currentUser, name, avatar, phone, password };
    setCurrentUser(updUser);
    localStorage.setItem('diyo_client_user', JSON.stringify(updUser));

    // Also update matching clients list
    const updatedClients = clients.map(cl => 
      cl.email.toLowerCase() === currentUser.email.toLowerCase() 
        ? { ...cl, name, avatar, phone, password } 
        : cl
    );
    syncClients(updatedClients);
  };

  const logActivity = (title: string, type: ActivityLog['type'], clientName?: string) => {
    const newAct: ActivityLog = {
      id: `act-${Date.now()}`,
      title,
      relativeTime: 'Just Now',
      type,
      clientName,
      timestamp: new Date().toISOString()
    };
    // Sync with state & storage
    syncActivities([newAct, ...activities]);
    // Broadcast event for multi-tab sync
    window.dispatchEvent(new Event('storage'));
  };

  // Derive metrics dynamically
  const leadsCount = messages.length + 1281;
  const metrics = INITIAL_METRICS(projects.length, leadsCount, messages.filter(m => m.unread).length);

  return (
    <StorageContext.Provider value={{
      plans,
      projects,
      messages,
      activities,
      metrics,
      invitations,
      clients,
      tickets,
      invoices,
      
      currentView,
      adminTab,
      isAdminAuthenticated,
      adminEmail,
      currentUser,
      activeInviteCode,
      
      setViews,
      setAdminTab,
      loginAdmin,
      loginClient,
      logoutAdmin,
      logoutClient,
      resetAll,

      setActiveInviteCode: updateInviteCodeState,
      generateInvitation,
      disableInvitation,
      acceptInvitation,
      resendInvitationSignal,

      addClientDirect,
      updateClient,
      toggleClientStatus,
      deleteClient,

      saveProject,
      deleteProject,
      addDeliverable,

      addMessage,
      markMessageRead,
      replyToMessage,

      addInvoice,
      payInvoice,
      deleteInvoice,

      addTicket,
      addTicketReply,
      updateTicketStatus,
      
      updateUserProfile,
      logActivity
    }}>
      {children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
