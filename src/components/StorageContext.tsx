import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
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

// Firestore operation error definitions for diagnostics conformant to project-specific requirements
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Realtime Error Context: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Global Static Fallback Datasets for New Database Initialization
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
  
  // Navigation & Session
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

  // Pricing plans
  addPlan: (plan: PricingPlan) => void;

  // Project Deliverables & Pipeline
  saveProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  addDeliverable: (projectId: string, name: string, type: 'document'|'design'|'specification'|'archive', fileSize: string) => void;

  // Correspondence messaging
  addMessage: (name: string, email: string, text: string, role?: string, isClientMessage?: boolean) => void;
  markMessageRead: (id: string) => void;
  setMessageReadStatus: (id: string, unread: boolean) => void;
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
  // Navigation state remains client-local (session based)
  const [currentView, setViewsState] = useState<'public' | 'login' | 'admin' | 'client-dashboard' | 'invite-landing'>('public');
  const [adminTab, setAdminTab] = useState<'overview' | 'projects' | 'pricing' | 'messages' | 'settings' | 'invitations' | 'clients' | 'audit'>('overview');
  
  // Auth contexts remain client-local
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeInviteCode, setActiveInviteCode] = useState<string | null>(null);

  // Firestore Synchronized Realtime States
  const [plans, setPlans] = useState<PricingPlan[]>(INITIAL_PLANS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [invitations, setInvitations] = useState<Invitation[]>(defaultInvites);
  const [clients, setClients] = useState<Client[]>(defaultClients);
  const [tickets, setTickets] = useState<Ticket[]>(defaultTickets);
  const [invoices, setInvoices] = useState<Invoice[]>(defaultInvoices);

  // Initializer callback for bootstrapping Firestore empty databases
  const initializeDefaultCollection = async <T extends { id?: string; invitationCode?: string; name?: string }>(
    colPath: string,
    defaults: T[],
    idField: 'id' | 'invitationCode' | 'name' = 'id'
  ) => {
    try {
      const qSnapshot = await getDocs(collection(db, colPath));
      if (qSnapshot.empty && defaults && defaults.length > 0) {
        console.log(`Initializing default records for Firestore collection: ${colPath}`);
        for (const item of defaults) {
          let docId = '';
          if (idField === 'id') docId = item.id || '';
          else if (idField === 'invitationCode') docId = item.invitationCode || '';
          else if (idField === 'name') docId = item.name || '';

          if (docId) {
            await setDoc(doc(db, colPath, docId), item);
          }
        }
      }
    } catch (error) {
      console.warn(`Could not seed default collection in storage (perhaps rules or network limits apply): ${colPath}`, error);
    }
  };

  // Synchronize Firestore live collections on component mount
  useEffect(() => {
    let active = true;

    const initTelemetryAndSync = async () => {
      // 1. Check & seed default data if DB collection is entirely vacant
      if (active) {
        await initializeDefaultCollection('plans', INITIAL_PLANS, 'name');
        await initializeDefaultCollection('projects', INITIAL_PROJECTS, 'id');
        await initializeDefaultCollection('messages', INITIAL_MESSAGES, 'id');
        await initializeDefaultCollection('activities', INITIAL_ACTIVITIES, 'id');
        await initializeDefaultCollection('invitations', defaultInvites, 'invitationCode');
        await initializeDefaultCollection('clients', defaultClients, 'id');
        await initializeDefaultCollection('tickets', defaultTickets, 'id');
        await initializeDefaultCollection('invoices', defaultInvoices, 'id');
      }

      // If component unmounted during the async checks, abort setting up listeners
      if (!active) return () => {};

      // 2. Setup Real-time Listeners
      const unsubPlans = onSnapshot(collection(db, 'plans'), (snap) => {
        const loaded: PricingPlan[] = [];
        snap.forEach(d => loaded.push(d.data() as PricingPlan));
        if (loaded.length > 0) {
          setPlans(loaded);
        }
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'plans'));

      const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
        const loaded: Project[] = [];
        snap.forEach(d => loaded.push(d.data() as Project));
        setProjects(loaded);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

      const unsubMessages = onSnapshot(collection(db, 'messages'), (snap) => {
        const loaded: Message[] = [];
        snap.forEach(d => loaded.push(d.data() as Message));
        loaded.sort((a, b) => b.id.localeCompare(a.id));
        setMessages(loaded);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));

      const unsubActivities = onSnapshot(collection(db, 'activities'), (snap) => {
        const loaded: ActivityLog[] = [];
        snap.forEach(d => loaded.push(d.data() as ActivityLog));
         // Sort chronological descending
        loaded.sort((a, b) => {
          const tA = a.timestamp || a.id;
          const tB = b.timestamp || b.id;
          return tB.localeCompare(tA);
        });
        setActivities(loaded);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'activities'));

      const unsubInvitations = onSnapshot(collection(db, 'invitations'), (snap) => {
        const loaded: Invitation[] = [];
        snap.forEach(d => loaded.push(d.data() as Invitation));
        loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setInvitations(loaded);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'invitations'));

      const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
        const loaded: Client[] = [];
        snap.forEach(d => loaded.push(d.data() as Client));
        loaded.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
        setClients(loaded);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients'));

      const unsubTickets = onSnapshot(collection(db, 'tickets'), (snap) => {
        const loaded: Ticket[] = [];
        snap.forEach(d => loaded.push(d.data() as Ticket));
        loaded.sort((a, b) => b.id.localeCompare(a.id));
        setTickets(loaded);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'tickets'));

      const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
        const loaded: Invoice[] = [];
        snap.forEach(d => loaded.push(d.data() as Invoice));
        loaded.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
        setInvoices(loaded);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

      return () => {
        unsubPlans();
        unsubProjects();
        unsubMessages();
        unsubActivities();
        unsubInvitations();
        unsubClients();
        unsubTickets();
        unsubInvoices();
      };
    };

    // Initialize & keep track of unsubscribe functions
    let cancelListenersFn: (() => void) | null = null;
    initTelemetryAndSync().then(unsubFn => {
      cancelListenersFn = unsubFn;
    });

    // 3. Keep standard auth routing loaded instantly from browser session cache
    const storedAuthState = localStorage.getItem('diyo_auth');
    const storedAuthEmail = localStorage.getItem('diyo_auth_email');
    const storedClientUser = localStorage.getItem('diyo_client_user');
    const storedActiveInvite = localStorage.getItem('diyo_active_invite');

    if (storedAuthState === 'true') {
      setIsAdminAuthenticated(true);
      setAdminEmail(storedAuthEmail);
      setViewsState('admin');
    } else if (storedClientUser) {
      try {
        const userObj = JSON.parse(storedClientUser);
        setCurrentUser(userObj);
        setViewsState('client-dashboard');
      } catch (err) {
        console.error("Session parse error:", err);
      }
    }

    if (storedActiveInvite) {
      setActiveInviteCode(storedActiveInvite);
    }

    return () => {
      active = false;
      if (cancelListenersFn) {
        cancelListenersFn();
      }
    };
  }, []);

  // Auth Operations
  const loginAdmin = (email: string): boolean => {
    setIsAdminAuthenticated(true);
    setAdminEmail(email);
    localStorage.setItem('diyo_auth', 'true');
    localStorage.setItem('diyo_auth_email', email);
    
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

    // If client has a password set, we validate it
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

  const resetAll = async () => {
    localStorage.removeItem('diyo_auth');
    localStorage.removeItem('diyo_auth_email');
    localStorage.removeItem('diyo_client_user');
    localStorage.removeItem('diyo_active_invite');

    // Restore UI values
    setPlans(INITIAL_PLANS);
    setProjects(INITIAL_PROJECTS);
    setMessages(INITIAL_MESSAGES);
    setActivities(INITIAL_ACTIVITIES);
    setInvitations(defaultInvites);
    setClients(defaultClients);
    setTickets(defaultTickets);
    setInvoices(defaultInvoices);

    setCurrentUser(null);
    setActiveInviteCode(null);
    setViewsState('public');

    // Wipe collections sequentially in Firestore to reset database
    const wipeCol = async (path: string, items: any[], idField: string) => {
      try {
        const snap = await getDocs(collection(db, path));
        for (const docObj of snap.docs) {
          await deleteDoc(doc(db, path, docObj.id));
        }
        for (const item of items) {
          const docId = idField === 'id' ? item.id : item.invitationCode;
          await setDoc(doc(db, path, docId), item);
        }
      } catch (err) {
        console.warn(`Wiping collection ignored or unavailable: ${path}`, err);
      }
    };

    await wipeCol('plans', INITIAL_PLANS, 'name');
    await wipeCol('projects', INITIAL_PROJECTS, 'id');
    await wipeCol('messages', INITIAL_MESSAGES, 'id');
    await wipeCol('activities', INITIAL_ACTIVITIES, 'id');
    await wipeCol('invitations', defaultInvites, 'invitationCode');
    await wipeCol('clients', defaultClients, 'id');
    await wipeCol('tickets', defaultTickets, 'id');
    await wipeCol('invoices', defaultInvoices, 'id');
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

  // Generate invite code and document directly in Firestore
  const generateInvitation = (
    email: string, 
    projectName: string, 
    planName: string, 
    durationDays: number, 
    phone?: string, 
    customFeatures?: string[], 
    password?: string
  ): Invitation => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rand = '';
    for (let i = 0; i < 9; i++) {
      rand += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const invitationCode = `DIYO${rand}`;

    const expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
    const createdAt = new Date().toISOString();

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
      setDoc(doc(db, 'projects', projectId), newProj).catch(err => 
        handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}`)
      );
    } else {
      linkedProj.clientEmail = email;
      setDoc(doc(db, 'projects', linkedProj.id), linkedProj).catch(err => 
        handleFirestoreError(err, OperationType.WRITE, `projects/${linkedProj?.id}`)
      );
    }

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
      projectId: projectId || '',
      projectName,
      plan: planName,
      customFeatures,
      status: 'Pending',
      createdAt,
      expiresAt
    };

    setDoc(doc(db, 'invitations', invitationCode), newInvite).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `invitations/${invitationCode}`)
    );

    logActivity(`Secured invitation keys issued for "${email}"`, 'invite');
    return newInvite;
  };

  const disableInvitation = (code: string) => {
    const inv = invitations.find(i => i.invitationCode === code);
    if (!inv) return;

    setDoc(doc(db, 'invitations', code), { ...inv, status: 'Revoked' }).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `invitations/${code}`)
    );
  };

  const acceptInvitation = (code: string, clientName: string, clientPhone?: string, clientPassword?: string): boolean => {
    const sourceInvite = invitations.find(i => i.invitationCode === code && i.status === 'Pending');
    if (!sourceInvite) return false;

    // Status Accepted in Firestore
    setDoc(doc(db, 'invitations', code), { ...sourceInvite, status: 'Accepted' }).catch(err =>
      handleFirestoreError(err, OperationType.WRITE, `invitations/${code}`)
    );

    // Register active user client profile in Firestore
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

    setDoc(doc(db, 'clients', brandNewClientId), newClientObj).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `clients/${brandNewClientId}`)
    );

    // Update the Linked Project client info in Firestore
    if (sourceInvite.projectId) {
      const proj = projects.find(p => p.id === sourceInvite.projectId);
      if (proj) {
        setDoc(doc(db, 'projects', proj.id), {
          ...proj,
          client: clientName,
          clientEmail: sourceInvite.email
        }).catch(err => 
          handleFirestoreError(err, OperationType.WRITE, `projects/${proj.id}`)
        );
      }
    }

    // Set local authenticated session
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

    logActivity(`Client logged in & verified: "${clientName}"`, 'user', clientName);
    setViewsState('client-dashboard');
    return true;
  };

  const resendInvitationSignal = (code: string) => {
    const inv = invitations.find(i => i.invitationCode === code);
    if (!inv) return;

    logActivity(`Secured key reminder transmitted to ${inv.email}`, 'email');
  };

  // ==========================================
  // CLIENT DIRECT MANAGEMENT (ADMIN PANEL)
  // ==========================================

  const addPlan = (plan: PricingPlan) => {
    setDoc(doc(db, 'plans', plan.name), plan)
      .then(() => logActivity(`Pricing Plan tier added: "${plan.name}"`, 'rocket_launch'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `plans/${plan.name}`));
  };

  const addClientDirect = (client: Client) => {
    setDoc(doc(db, 'clients', client.id), client)
      .then(() => logActivity(`Direct Client Created: "${client.name}"`, 'user'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}`));
  };

  const updateClient = (client: Client) => {
    setDoc(doc(db, 'clients', client.id), client).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}`)
    );
  };

  const toggleClientStatus = (id: string) => {
    const clientDef = clients.find(c => c.id === id);
    if (!clientDef) return;

    const nextStatus = clientDef.status === 'Active' ? 'Suspended' : 'Active';
    const updated = { ...clientDef, status: nextStatus };

    setDoc(doc(db, 'clients', id), updated)
      .then(() => logActivity(`Client status updated: "${clientDef.name}" status set to ${nextStatus}`, 'user', clientDef.name))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `clients/${id}`));
  };

  const deleteClient = (id: string) => {
    const target = clients.find(c => c.id === id);
    if (!target) return;

    deleteDoc(doc(db, 'clients', id))
      .then(() => logActivity(`Client profile disconnected: ${target.name}`, 'user'))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `clients/${id}`));
  };

  // ==========================================
  // PROJECT ACTIONS
  // ==========================================

  const saveProject = (project: Project) => {
    setDoc(doc(db, 'projects', project.id), project)
      .then(() => logActivity(`Project Registered: "${project.name}"`, 'rocket_launch'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `projects/${project.id}`));
  };

  const deleteProject = (id: string) => {
    deleteDoc(doc(db, 'projects', id)).catch(err => 
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`)
    );
  };

  const addDeliverable = (
    projectId: string, 
    name: string, 
    type: 'document'|'design'|'specification'|'archive', 
    fileSize: string
  ) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const newDel: Deliverable = {
      id: `del-${Date.now()}`,
      name,
      fileUrl: '#',
      fileSize,
      type,
      uploadedAt: new Date().toLocaleString()
    };

    const updatedProj = {
      ...proj,
      deliverables: [newDel, ...(proj.deliverables || [])]
    };

    setDoc(doc(db, 'projects', projectId), updatedProj)
      .then(() => logActivity(`Deliverable document uploaded: "${name}"`, 'launch'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `projects/${projectId}`));
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

    setDoc(doc(db, 'messages', newMessage.id), newMessage)
      .then(() => logActivity(isClientMessage ? `Response from Partner: "${name}"` : `New inbound query from "${name}"`, 'email'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `messages/${newMessage.id}`));
  };

  const markMessageRead = (id: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    setDoc(doc(db, 'messages', id), { ...msg, unread: false }).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `messages/${id}`)
    );
  };

  const setMessageReadStatus = (id: string, unread: boolean) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    setDoc(doc(db, 'messages', id), { ...msg, unread }).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `messages/${id}`)
    );
  };

  const replyToMessage = (id: string, text: string) => {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    setDoc(doc(db, 'messages', id), {
      ...msg,
      unread: false,
      replies: [...(msg.replies || []), text]
    }).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `messages/${id}`)
    );
  };

  // ==========================================
  // BILLING / INVOICING
  // ==========================================

  const addInvoice = (title: string, amount: string, clientEmail: string, dueDate: string) => {
    const id = `inv-${Date.now()}`;
    const newInv: Invoice = {
      id,
      title,
      amount,
      clientEmail,
      status: 'Unpaid',
      dueDate
    };

    setDoc(doc(db, 'invoices', id), newInv)
      .then(() => logActivity(`Invoice set up: "${title}" (${amount})`, 'billing'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `invoices/${id}`));
  };

  const payInvoice = (id: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    setDoc(doc(db, 'invoices', id), { ...inv, status: 'Paid' })
      .then(() => logActivity(`Payment logged: "${inv.title}" cleared.`, 'billing'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `invoices/${id}`));
  };

  const deleteInvoice = (id: string) => {
    deleteDoc(doc(db, 'invoices', id)).catch(err => 
      handleFirestoreError(err, OperationType.DELETE, `invoices/${id}`)
    );
  };

  // ==========================================
  // CUSTOMER SUPPORT SYSTEMS
  // ==========================================

  const addTicket = (tkt: Omit<Ticket, 'id' | 'createdAt'>) => {
    const id = `tkt-${Date.now()}`;
    const newTkt: Ticket = {
      ...tkt,
      id,
      createdAt: new Date().toLocaleString(),
      replies: []
    };

    setDoc(doc(db, 'tickets', id), newTkt)
      .then(() => logActivity(`System Support Incident Opened: "${tkt.title}"`, 'ticket'))
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `tickets/${id}`));
  };

  const addTicketReply = (ticketId: string, message: string, sender: 'client'|'admin', senderName: string) => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return;

    const newRep = {
      id: `rep-${Date.now()}`,
      sender,
      senderName,
      message,
      createdAt: 'Just now'
    };

    const updatedTkt = {
      ...tkt,
      replies: [...(tkt.replies || []), newRep],
      status: sender === 'admin' ? ('In Progress' as const) : tkt.status
    };

    setDoc(doc(db, 'tickets', ticketId), updatedTkt).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `tickets/${ticketId}`)
    );
  };

  const updateTicketStatus = (ticketId: string, status: 'Open' | 'In Progress' | 'Closed') => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return;

    setDoc(doc(db, 'tickets', ticketId), { ...tkt, status }).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `tickets/${ticketId}`)
    );
  };

  // ==========================================
  // USER MODIFICATIONS
  // ==========================================
  const updateUserProfile = (name: string, avatar: string, phone?: string, password?: string) => {
    if (!currentUser) return;
    const updUser = { ...currentUser, name, avatar, phone, password };
    setCurrentUser(updUser);
    localStorage.setItem('diyo_client_user', JSON.stringify(updUser));

    // Sync match update to active client profile in Firestore
    const client = clients.find(cl => cl.email.toLowerCase() === currentUser.email.toLowerCase());
    if (client) {
      setDoc(doc(db, 'clients', client.id), { ...client, name, avatar, phone, password }).catch(err => 
        handleFirestoreError(err, OperationType.WRITE, `clients/${client.id}`)
      );
    }
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

    setDoc(doc(db, 'activities', newAct.id), newAct).catch(err => 
      handleFirestoreError(err, OperationType.WRITE, `activities/${newAct.id}`)
    );
  };

  // Derive metrics dynamically from synced dataset sizes
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

      addPlan,

      saveProject,
      deleteProject,
      addDeliverable,

      addMessage,
      markMessageRead,
      setMessageReadStatus,
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
