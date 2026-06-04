import React, { useState, useEffect } from 'react';
import { useStorage } from './StorageContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Coins, 
  Mail, 
  Settings as SettingsIcon, 
  ExternalLink, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Send, 
  Sparkles, 
  Cpu, 
  TrendingUp, 
  User as UserIcon, 
  Key, 
  Copy, 
  Calendar, 
  AlertCircle, 
  Check, 
  FileText, 
  LifeBuoy, 
  CreditCard,
  Search,
  SearchCode,
  Shield,
  Clock,
  ArrowUpRight,
  Download,
  Archive,
  ArchiveRestore,
  Eye,
  Filter,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  SlidersHorizontal,
  CheckCircle2,
  Bell,
  BellRing
} from 'lucide-react';
import { Project, PricingPlan, Message, Client, Invitation, Invoice, Ticket, ActivityLog } from '../types';
import { downloadInvoicePDF } from '../utils/pdfGenerator';

export const AdminConsole: React.FC = () => {
  const {
    plans,
    projects,
    messages,
    activities,
    metrics,
    invitations,
    clients,
    tickets,
    invoices,
    adminEmail,
    adminTab,
    setViews,
    setAdminTab,
    logoutAdmin,
    generateInvitation,
    disableInvitation,
    resendInvitationSignal,
    acceptInvitation,
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
    deleteInvoice,
    addTicketReply,
    updateTicketStatus,
    logActivity
  } = useStorage();

  // Dialog Modals visibility
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showAddInviteModal, setShowAddInviteModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showIssueInvoiceModal, setShowIssueInvoiceModal] = useState(false);

  // Quick feedback toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search message bar filters
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [messageReplyText, setMessageReplyText] = useState<{ [key: string]: string }>({});

  // Message aggregate table filtering & sorting states
  const [messageStatusFilter, setMessageStatusFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  const [messageSenderTypeFilter, setMessageSenderTypeFilter] = useState<'all' | 'partner' | 'public'>('all');
  const [messageArchiveFilter, setMessageArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [messageSortField, setMessageSortField] = useState<'date' | 'name' | 'status'>('date');
  const [messageSortDirection, setMessageSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Archiving ID set backed by localStorage
  const [archivedMessageIds, setArchivedMessageIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('diyo_archived_message_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Selected message for detailed view/reply modal
  const [selectedViewingMessage, setSelectedViewingMessage] = useState<Message | null>(null);

  // Bulk Selection State for Inquiries
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  // Audit system states
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<'all' | 'bulk' | 'client' | 'email' | 'others'>('all');

  // New message notification tracking state
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [jiggleBell, setJiggleBell] = useState(false);
  const [notifHistory, setNotifHistory] = useState<string[]>(() => {
    return messages.filter(m => m.unread).map(m => m.id);
  });

  useEffect(() => {
    const currentUnread = messages.filter(m => m.unread);
    const currentUnreadIds = currentUnread.map(m => m.id);
    
    // Check for genuinely new unread messages
    const newUnreads = currentUnread.filter(m => !notifHistory.includes(m.id));
    
    if (newUnreads.length > 0) {
      setJiggleBell(true);
      const timer = setTimeout(() => setJiggleBell(false), 1200);

      newUnreads.forEach(newMsg => {
        triggerToast(`New Live Inquiry from ${newMsg.senderName || 'Anonymous Client'}`);
      });

      setNotifHistory(prev => {
        const next = [...prev];
        newUnreads.forEach(m => {
          if (!next.includes(m.id)) next.push(m.id);
        });
        return next;
      });

      return () => clearTimeout(timer);
    } else {
      // Sync list so that reading/deleting updates the state without alarming the bell
      setNotifHistory(currentUnreadIds);
    }
  }, [messages]);

  const filteredAudits = activities.filter(act => {
    // 1. Keyword search check
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchClient = act.clientName ? act.clientName.toLowerCase().includes(q) : false;
      const matchType = act.type.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchType) return false;
    }

    // 2. Category filter check
    if (auditCategory === 'all') return true;
    if (auditCategory === 'bulk') {
      return act.title.toLowerCase().includes('bulk') || act.type === 'done_all';
    }
    if (auditCategory === 'client') {
      return act.title.toLowerCase().includes('client') || act.title.toLowerCase().includes('partner') || act.type === 'user';
    }
    if (auditCategory === 'email') {
      return act.type === 'email' || act.title.toLowerCase().includes('dispatched');
    }
    if (auditCategory === 'others') {
      const isBulk = act.title.toLowerCase().includes('bulk') || act.type === 'done_all';
      const isClient = act.title.toLowerCase().includes('client') || act.title.toLowerCase().includes('partner') || act.type === 'user';
      const isEmail = act.type === 'email' || act.title.toLowerCase().includes('dispatched');
      return !isBulk && !isClient && !isEmail;
    }

    return true;
  });

  // Live Activity Feed Filters & Inspection
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'launch' | 'user' | 'billing' | 'ticket' | 'done_all'>('all');
  const [activityClientFilter, setActivityClientFilter] = useState<string>('all'); // client name or 'all'
  const [selectedInspectActivity, setSelectedInspectActivity] = useState<ActivityLog | null>(null);

  // Filter activities dynamically based on parameters and client name associations
  const filteredActivities = activities.filter(act => {
    if (activitySearchQuery.trim()) {
      const q = activitySearchQuery.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchClient = act.clientName ? act.clientName.toLowerCase().includes(q) : false;
      if (!matchTitle && matchClient === false) return false;
    }

    if (activityClientFilter !== 'all') {
      if (activityClientFilter === 'system-only') {
        if (act.clientName) return false;
      } else {
        if (!act.clientName || act.clientName.toLowerCase() !== activityClientFilter.toLowerCase()) return false;
      }
    }

    if (activityCategoryFilter !== 'all') {
      if (act.type !== activityCategoryFilter) return false;
    }

    return true;
  });

  const handleToggleArchiveMessage = (id: string) => {
    const isArchived = archivedMessageIds.includes(id);
    const nextList = isArchived 
      ? archivedMessageIds.filter(x => x !== id) 
      : [...archivedMessageIds, id];
    setArchivedMessageIds(nextList);
    localStorage.setItem('diyo_archived_message_ids', JSON.stringify(nextList));
    triggerToast(isArchived ? 'Message unarchived and returned to active inbox.' : 'Inquiry archived cleanly.');
  };

  const [reviewedMessageIds, setReviewedMessageIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('diyo_reviewed_message_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [simulatedEmails, setSimulatedEmails] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('diyo_simulated_emails');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleMarkReviewed = (id: string, senderName: string, email: string) => {
    const isAlreadyReviewed = reviewedMessageIds.includes(id);
    if (!isAlreadyReviewed) {
      const nextList = [...reviewedMessageIds, id];
      setReviewedMessageIds(nextList);
      localStorage.setItem('diyo_reviewed_message_ids', JSON.stringify(nextList));
      
      const automatedEmail = {
        id: `email-${Date.now()}`,
        recipient: email,
        recipientName: senderName,
        subject: "Thank you for your inquiry - Team Diyo",
        body: `Dear ${senderName},\n\nDhanyabad (Thank you) for reaching out to us! We have marked your intake inquiry as "Reviewed" on our live portal.\n\nOur system development operators are currently evaluating your requirements. We will transmit a personalized architectural scope and milestone schedule within 24 business hours.\n\nWarm regards,\nTeam Diyo Operators`,
        timestamp: new Date().toISOString()
      };
      
      const newEmails = [automatedEmail, ...simulatedEmails];
      setSimulatedEmails(newEmails);
      localStorage.setItem('diyo_simulated_emails', JSON.stringify(newEmails));
      
      // Log storage trace
      logActivity(`Automated Thank You Email dispatched to ${senderName} (${email})`, 'email' as any, senderName);
      
      // Automatically mark message as read
      markMessageRead(id);
      
      triggerToast(`Inquiry from "${senderName}" successfully marked Reviewed! Automated thank-you dispatch triggered.`);
    } else {
      triggerToast(`Inquiry from "${senderName}" is already finalized.`);
    }
  };

  const handleBulkMarkReviewed = () => {
    if (selectedMessageIds.length === 0) {
      triggerToast("No items selected for bulk operation.");
      return;
    }
    
    // Find unreviewed messages amongst the selected set
    const toReview = processedMessages.filter(msg => 
      selectedMessageIds.includes(msg.id) && !reviewedMessageIds.includes(msg.id)
    );

    if (toReview.length === 0) {
      triggerToast("All selected inquiries are already marked as Reviewed.");
      return;
    }

    const nextReviewedIds = [...reviewedMessageIds, ...toReview.map(m => m.id)];
    setReviewedMessageIds(nextReviewedIds);
    localStorage.setItem('diyo_reviewed_message_ids', JSON.stringify(nextReviewedIds));

    // Generate simulated emails
    const newEmails = [...simulatedEmails];
    toReview.forEach((msg, idx) => {
      const automatedEmail = {
        id: `email-${Date.now()}-${idx}`,
        recipient: msg.email,
        recipientName: msg.senderName,
        subject: "Thank you for your inquiry - Team Diyo",
        body: `Dear ${msg.senderName},\n\nDhanyabad (Thank you) for reaching out to us! We have marked your intake inquiry as "Reviewed" on our live portal.\n\nOur system development operators are currently evaluating your requirements. We will transmit a personalized architectural scope and milestone schedule within 24 business hours.\n\nWarm regards,\nTeam Diyo Operators`,
        timestamp: new Date().toISOString()
      };
      newEmails.unshift(automatedEmail);
      
      // Automatically mark message as read
      markMessageRead(msg.id);
    });

    setSimulatedEmails(newEmails);
    localStorage.setItem('diyo_simulated_emails', JSON.stringify(newEmails));

    // Log a consolidated activity
    logActivity(`Bulk marked ${toReview.length} inquiries as Reviewed & dispatched automated SMTP thank-yous`, 'done_all' as any, 'Admin');
    
    triggerToast(`Bulk marked ${toReview.length} messages as Reviewed. Automated thank you emails dispatched!`);
    setSelectedMessageIds([]); // Reset selection
  };

  const handleBulkArchive = (archive: boolean) => {
    if (selectedMessageIds.length === 0) {
      triggerToast("No items selected for bulk operation.");
      return;
    }

    let nextList = [...archivedMessageIds];
    if (archive) {
      selectedMessageIds.forEach(id => {
        if (!nextList.includes(id)) {
          nextList.push(id);
        }
      });
    } else {
      nextList = nextList.filter(id => !selectedMessageIds.includes(id));
    }

    setArchivedMessageIds(nextList);
    localStorage.setItem('diyo_archived_message_ids', JSON.stringify(nextList));

    logActivity(`Bulk ${archive ? 'archived' : 'unarchived'} ${selectedMessageIds.length} inquiries`, 'launch' as any, 'Admin');
    triggerToast(`Bulk operation executed: ${selectedMessageIds.length} inquiries ${archive ? 'archived' : 'restored'}.`);
    setSelectedMessageIds([]);
  };

  const handleExportCSV = () => {
    if (processedMessages.length === 0) {
      triggerToast("No inquiry records match the current filters to export.");
      return;
    }

    // Define CSV Headers
    const headers = ["Inquiry ID", "Sender Name", "Email Address", "Sender Role", "Inquiry Message Preview", "Current Status", "Direct Sync Type", "Chronological Ingest Timestamp"];
    
    // Transform rows safely
    const rows = processedMessages.map(msg => {
      // Determine Status details
      let statusText = "Read";
      if (reviewedMessageIds.includes(msg.id)) {
        statusText = "Reviewed";
      } else if (msg.unread) {
        statusText = "Unread";
      } else if (msg.replies && msg.replies.length > 0) {
        statusText = "Replied";
      }

      const sourceType = msg.isClientMessage ? "Partner Sync" : "Public Web Intake";
      const timestamp = msg.createdAt ? new Date(msg.createdAt).toISOString() : msg.relativeTime;

      // Helper to sanitise and safely encapsulate cells in quotes
      const sanitize = (text: string) => {
        if (!text) return '""';
        const str = text.toString().replace(/"/g, '""'); // double up standard double quotes
        return `"${str}"`;
      };

      return [
        sanitize(msg.id),
        sanitize(msg.senderName),
        sanitize(msg.email),
        sanitize(msg.senderRole || "Public Guest"),
        sanitize(msg.previewText),
        sanitize(statusText),
        sanitize(sourceType),
        sanitize(timestamp)
      ];
    });

    // Combine headers and data rows
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    try {
      // UTF-8 Byte Order Mark (BOM) to support multi-language script characters gracefully (e.g. Nepali script)
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `diyo_intake_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Update our real-time activity feed with telemetry sync
      logActivity(`Exported ${processedMessages.length} filtered client inquiry records to secure CSV`, 'launch', 'Admin');
      triggerToast(`Dispatched secure download for ${processedMessages.length} inquiry records!`);
    } catch (err) {
      console.error("CSV Export failure:", err);
      triggerToast("System failed compiling CSV binary stream.");
    }
  };

  // 1. Projects state models
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjClientEmail, setNewProjClientEmail] = useState('');
  const [newProjPrefix, setNewProjPrefix] = useState('LV');
  const [newProjProgress, setNewProjProgress] = useState(15);
  const [newProjStatus, setNewProjStatus] = useState<'Research' | 'In Progress' | 'Testing' | 'Completed'>('In Progress');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Deliverables add
  const [selectedProjectIdForDel, setSelectedProjectIdForDel] = useState<string | null>(null);
  const [newDelName, setNewDelName] = useState('');
  const [newDelType, setNewDelType] = useState<'document' | 'design' | 'specification' | 'archive'>('design');
  const [newDelSize, setNewDelSize] = useState('1.5 MB');

  // 2. Plans state models
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanType, setNewPlanType] = useState<'fixed' | 'monthly' | 'enterprise'>('monthly');
  const [newPlanPrice, setNewPlanPrice] = useState('$8k');
  const [newPlanPeriod, setNewPlanPeriod] = useState('/month');
  const [newPlanNprPrice, setNewPlanNprPrice] = useState('रू १०,००,०००');
  const [newPlanNprPeriod, setNewPlanNprPeriod] = useState('/महिना');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const [newPlanFeatures, setNewPlanFeatures] = useState('');
  const [newPlanActive, setNewPlanActive] = useState(true);
  const [newPlanPopular, setNewPlanPopular] = useState(false);

  // 3. Invitations state models
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteProjectName, setInviteProjectName] = useState('');
  const [invitePlanName, setInvitePlanName] = useState('Growth');
  const [inviteDuration, setInviteDuration] = useState(7);
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteCustomFeaturesText, setInviteCustomFeaturesText] = useState('');
  const [latestGeneratedInvite, setLatestGeneratedInvite] = useState<Invitation | null>(null);

  // Auto-update custom features state when plan changes
  useEffect(() => {
    const selectedPlanObj = plans.find(p => p.name.toLowerCase() === invitePlanName.toLowerCase());
    if (selectedPlanObj) {
      setInviteCustomFeaturesText(selectedPlanObj.features.join('\n'));
    }
  }, [invitePlanName, plans]);

  // 4. Clients direct models
  const [directClientName, setDirectClientName] = useState('');
  const [directClientEmail, setDirectClientEmail] = useState('');
  const [directClientProject, setDirectClientProject] = useState('');
  const [directClientPlan, setDirectClientPlan] = useState('Growth');
  const [directClientPassword, setDirectClientPassword] = useState('');
  const [directClientPhone, setDirectClientPhone] = useState('');
  const [directClientCustomFeaturesText, setDirectClientCustomFeaturesText] = useState('');

  // Auto-update custom features when direct client plan selection changes
  useEffect(() => {
    const selectedPlanObj = plans.find(p => p.name.toLowerCase() === directClientPlan.toLowerCase());
    if (selectedPlanObj) {
      setDirectClientCustomFeaturesText(selectedPlanObj.features.join('\n'));
    }
  }, [directClientPlan, plans]);

  // 5. Invoices state models
  const [selectedClientEmailForInv, setSelectedClientEmailForInv] = useState('');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [invoiceAmountStr, setInvoiceAmountStr] = useState('NPR 1,50,000');
  const [invoiceDueDate, setInvoiceDueDate] = useState('2026-06-30');

  // 6. Support replying status
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Show dynamic notification toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Safe browser copy link simulator
  const handleCopyInviteLink = (code: string) => {
    const linkStr = `https://diyo.com/invite/${code}`;
    navigator.clipboard.writeText(linkStr).then(() => {
      triggerToast(`Copied invitation redirect: ${linkStr}`);
    }).catch(() => {
      triggerToast(`[Simulator Link] diyo.com/invite/${code}`);
    });
  };

  // Simulate inward user email lead
  const handleSimulateInquiry = () => {
    const inboundNames = ['Elon Musk', 'Sundar Pichai', 'Alex Hormozi', 'Samyak Pokharel', 'Gita Adhikari'];
    const randomName = inboundNames[Math.floor(Math.random() * inboundNames.length)];
    const randomEmail = `${randomName.toLowerCase().replace(' ', '')}@globalbrand.co`;
    const randomBriefs = [
      "We want to build a decentralized micro-energy grid dashboard inside React paired with high speed rust backends. What is your Growth SLA timeline?",
      "Can we schedule an urgent workshop regarding customized ISO-9001 billing applications for our South-Asia team?",
      "Need a premium high-contrast UX prototype made in 5 business days. Please review starter fix plan costs."
    ];
    const randomText = randomBriefs[Math.floor(Math.random() * randomBriefs.length)];
    
    addMessage(randomName, randomEmail, randomText, 'Enterprise Director');
    triggerToast(`Simulation triggered! Dynamic lead received from: ${randomName}`);
  };

  // Save new plan options
  const handleCreatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanPrice) return;

    // save plan features as array
    const parsedFeatures = newPlanFeatures.split('\n').map(f => f.trim()).filter(Boolean);
    const created: PricingPlan = {
      id: `plan-${Date.now()}`,
      type: newPlanType,
      name: newPlanName,
      price: newPlanPrice,
      period: newPlanPeriod,
      nprPrice: newPlanNprPrice,
      nprPeriod: newPlanNprPeriod,
      description: newPlanDescription,
      features: parsedFeatures.length > 0 ? parsedFeatures : ['UI/UX Responsive Development', 'Priority Alignment'],
      active: newPlanActive,
      popular: newPlanPopular
    };

    // Save plans list
    plans.push(created);
    localStorage.setItem('diyo_plans', JSON.stringify(plans));
    setShowAddPlanModal(false);
    triggerToast(`New configuration tier "${newPlanName}" published successfully!`);

    // Reset fields
    setNewPlanName('');
    setNewPlanDescription('');
    setNewPlanFeatures('');
  };

  // Create Project Pipeline Submit
  const handleCreateProjectSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjClient) return;

    const created: Project = {
      id: `proj-${Date.now()}`,
      name: newProjName,
      client: newProjClient,
      clientEmail: newProjClientEmail.trim() || 'sarah@auroradigital.co',
      prefix: newProjPrefix.toUpperCase().substring(0, 3) || 'DY',
      progress: Number(newProjProgress),
      status: newProjStatus,
      deliverables: []
    };

    saveProject(created);
    setShowAddProjectModal(false);
    triggerToast(`Active Project pipeline "${newProjName}" initialized live.`);

    // Reset
    setNewProjName('');
    setNewProjClient('');
    setNewProjClientEmail('');
  };

  // Upload deliverable file to project
  const handleUploadDeliverableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectIdForDel || !newDelName.trim()) return;

    addDeliverable(selectedProjectIdForDel, newDelName.trim(), newDelType, newDelSize);
    setNewDelName('');
    setSelectedProjectIdForDel(null);
    triggerToast(`Secured deliverable "${newDelName}" published successfully to client portal!`);
  };

  // Submit invitation generation
  const handleGenerateInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteProjectName) {
      triggerToast('Ensure email and project name is specified.');
      return;
    }

    const featureLines = inviteCustomFeaturesText
      ? inviteCustomFeaturesText.split('\n').map(f => f.trim()).filter(line => line.length > 0)
      : undefined;

    const invite = generateInvitation(
      inviteEmail.trim(), 
      inviteProjectName.trim(), 
      invitePlanName, 
      inviteDuration,
      invitePhone.trim() ? invitePhone.trim() : undefined,
      featureLines,
      invitePassword.trim() ? invitePassword.trim() : undefined
    );
    setLatestGeneratedInvite(invite);
    triggerToast(`Partnership keys secured & issued for: ${inviteEmail}`);

    // Reset some form elements nicely
    setInviteEmail('');
    setInviteProjectName('');
    setInvitePhone('');
    setInvitePassword('');
  };

  // Issue custom billing invoice
  const handleIssueInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientEmailForInv || !invoiceTitle || !invoiceAmountStr) return;

    addInvoice(invoiceTitle.trim(), invoiceAmountStr.trim(), selectedClientEmailForInv, invoiceDueDate);
    setShowIssueInvoiceModal(false);
    setInvoiceTitle('');
    triggerToast(`Contract invoice issued to client timeline securely.`);
  };

  // Submit direct client partner account creation
  const handleCreateClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directClientName.trim() || !directClientEmail.trim() || !directClientPassword.trim()) {
      triggerToast('Client partner name, email, and password are required.');
      return;
    }

    // Auto-generate or link to existing project for the client partner
    let projectId = '';
    let projectName = directClientProject.trim() || 'Custom Partner Systems';
    
    // Attempt project match
    const matchedProj = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    if (matchedProj) {
      projectId = matchedProj.id;
      projectName = matchedProj.name;
    } else {
      projectId = `proj-${Date.now()}`;
      const newProj: Project = {
        id: projectId,
        name: projectName,
        client: directClientName.trim(),
        clientEmail: directClientEmail.trim(),
        progress: 15,
        status: 'Research',
        prefix: 'CP',
        deliverables: []
      };
      saveProject(newProj);
    }

    const featureLines = directClientCustomFeaturesText
      ? directClientCustomFeaturesText.split('\n').map(f => f.trim()).filter(line => line.length > 0)
      : undefined;

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      name: directClientName.trim(),
      email: directClientEmail.trim(),
      phone: directClientPhone.trim() || undefined,
      password: directClientPassword.trim(),
      avatar: '',
      status: 'Active',
      projectId,
      projectName,
      plan: directClientPlan,
      customFeatures: featureLines,
      joinedAt: new Date().toISOString()
    };

    addClientDirect(newClient);
    setShowAddClientModal(false);
    triggerToast(`Created secure partner account for "${directClientName}"!`);

    // Reset models
    setDirectClientName('');
    setDirectClientEmail('');
    setDirectClientProject('');
    setDirectClientPhone('');
    setDirectClientPassword('');
    setDirectClientCustomFeaturesText('');
  };

  // File response post on support ticketing
  const handleTicketReplyPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTicketId || !ticketReplyText.trim()) return;

    addTicketReply(replyTicketId, ticketReplyText.trim(), 'admin', 'Nishant');
    setTicketReplyText('');
    setReplyTicketId(null);
    triggerToast('Outbound support ticket reply synchronized live.');
  };

  // Advanced filtering and sorting logic for client intake inquiries
  const processedMessages = messages
    .filter(msg => {
      // 1. Text Search query
      const q = messageSearchQuery.toLowerCase();
      const matchesSearch = !q || (
        msg.senderName.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        msg.previewText.toLowerCase().includes(q) ||
        (msg.senderRole && msg.senderRole.toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;

      // 2. Status filtering ('all' | 'unread' | 'read' | 'replied')
      if (messageStatusFilter === 'unread' && !msg.unread) return false;
      if (messageStatusFilter === 'read' && msg.unread) return false;
      if (messageStatusFilter === 'replied' && (!msg.replies || msg.replies.length === 0)) return false;

      // 3. Sender Type ('all' | 'partner' | 'public')
      if (messageSenderTypeFilter === 'partner' && !msg.isClientMessage) return false;
      if (messageSenderTypeFilter === 'public' && msg.isClientMessage) return false;

      // 4. Archive State ('active' | 'archived' | 'all')
      const isArchived = archivedMessageIds.includes(msg.id);
      if (messageArchiveFilter === 'active' && isArchived) return false;
      if (messageArchiveFilter === 'archived' && !isArchived) return false;

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (messageSortField === 'date') {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = timeA - timeB;
      } else if (messageSortField === 'name') {
        comparison = a.senderName.localeCompare(b.senderName);
      } else if (messageSortField === 'status') {
        // Sort priority: Unread (3) > Replied (1) > Read (2)
        const statusVal = (m: Message) => {
          if (m.unread) return 3;
          if (m.replies && m.replies.length > 0) return 1;
          return 2;
        };
        comparison = statusVal(a) - statusVal(b);
      }

      return messageSortDirection === 'asc' ? comparison : -comparison;
    });

  // Keep a reference to filteredMessages for backwards compatibility or specific counters
  const filteredMessages = processedMessages;

  return (
    <div className="min-h-screen bg-[#080a10] flex font-sans text-gray-200">
      
      {/* GLOBAL TOAST SYSTEM */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#141a29] border border-primary/20 shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-bounce glow-orange">
          <Sparkles className="w-4 h-4 text-secondary shrink-0 animate-ping" />
          <p className="text-xs text-white/90 font-mono"><b>Admin Alert:</b> {toastMessage}</p>
        </div>
      )}

      {/* 1. LEFT VERTICAL DRAWER NAVIGATION */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0e18] shrink-0 flex flex-col justify-between select-none">
        <div>
          {/* Logo brand segment */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-mono tracking-widest">
                diy<span className="text-secondary">o</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[8px] uppercase font-mono font-bold bg-secondary/15 text-secondary border border-secondary/20">
                CONSOLE
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-full border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono tracking-widest text-[#edc157] font-bold">STABLE</span>
            </div>
          </div>

          {/* Operator identification info box */}
          <div className="p-4 mx-3 my-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary text-orange-950 flex items-center justify-center font-bold font-mono text-sm shadow-md shrink-0">
              OP
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{adminEmail || 'admin@diyo.io'}</p>
              <p className="text-[10px] text-white/40 font-mono tracking-wider truncate uppercase">Systems Director</p>
            </div>
          </div>

          {/* Switch tabs layout menu */}
          <nav className="px-3 py-1 space-y-1">
            <button
              onClick={() => setAdminTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono tracking-wide uppercase transition-all cursor-pointer ${
                adminTab === 'overview' 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview Metric
            </button>

            <button
              id="admin-tab-invitations"
              onClick={() => setAdminTab('invitations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono tracking-wide uppercase transition-all cursor-pointer ${
                adminTab === 'invitations' 
                  ? 'bg-[#ff7a18]/10 text-primary border-l-2 border-primary font-bold shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Key className="w-4 h-4" /> Client Invitations
            </button>

            <button
              id="admin-tab-clients"
              onClick={() => setAdminTab('clients')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono tracking-wide uppercase transition-all cursor-pointer ${
                adminTab === 'clients' 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <UserIcon className="w-4 h-4" /> Client Profiles
            </button>

            <button
              onClick={() => setAdminTab('projects')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono tracking-wide uppercase transition-all cursor-pointer ${
                adminTab === 'projects' 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Client Pipelines
            </button>

            <button
              onClick={() => setAdminTab('pricing')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono tracking-wide uppercase transition-all cursor-pointer ${
                adminTab === 'pricing' 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Coins className="w-4 h-4" /> Pricing Plans
            </button>

            <button
              onClick={() => setAdminTab('messages')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono tracking-wide uppercase transition-all cursor-pointer relative ${
                adminTab === 'messages' 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Mail className="w-4 h-4" /> Client Intake Hub
              </span>
              {messages.filter(m => m.unread).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>

            <button
              id="admin-tab-audit"
              onClick={() => setAdminTab('audit')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-mono tracking-wide uppercase transition-all cursor-pointer ${
                adminTab === 'audit' 
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-bold shadow-sm' 
                  : 'text-white/50 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-cyan-400" /> System Audit Logs
              </span>
            </button>
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-white/5 bg-[#070a11] space-y-2">
          <button
            onClick={() => setViews('public')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer border border-white/5"
          >
            Preview Site <ExternalLink className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={logoutAdmin}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> End Auth Session
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE PANEL */}
      <main className="flex-1 min-w-0 bg-[#0c0f18] min-h-screen overflow-y-auto">
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight uppercase font-mono">
              {adminTab} console
            </h2>
            <p className="text-[10px] text-white/40 font-mono tracking-wider">
              ADMIN CONTROL PANEL • READ-WRITE ISO TRANSACTIONS INSTANT STORAGE
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* REAL-TIME CLIENT MESSAGES NOTIFICATION BELL */}
            <div className="relative">
              <button
                onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                className={`p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-white/85 hover:text-white transition-all cursor-pointer relative ${
                  jiggleBell ? 'animate-bounce' : ''
                }`}
                title="Telemetry Notification Inbox"
              >
                {messages.filter(m => m.unread).length > 0 ? (
                  <BellRing className="w-4 h-4 text-[#ff7a18]" />
                ) : (
                  <Bell className="w-4 h-4 text-white/50" />
                )}
                
                {messages.filter(m => m.unread).length > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7a18] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff7a18]"></span>
                  </span>
                )}
              </button>

              {/* Notification dropdown popover */}
              {isNotifDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-[#121624] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#ff7a18]" /> Telemetry Notifications
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/5 text-white/60">
                      {messages.filter(m => m.unread).length} Unread
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {messages.filter(m => m.unread).length === 0 ? (
                      <div className="py-6 text-center text-white/30 text-[11px] font-mono">
                        No unread client messages reported in storage telemetry.
                      </div>
                    ) : (
                      messages.filter(m => m.unread).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setAdminTab('messages');
                            setIsNotifDropdownOpen(false);
                            triggerToast(`Redirecting you to view message from: ${notif.senderName}`);
                          }}
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-[#ff7a18]/10 hover:border-[#ff7a18]/25 hover:bg-white/[0.04] transition-all cursor-pointer text-left space-y-1 block"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#ff7a18] truncate max-w-[140px]">
                              {notif.senderName}
                            </span>
                            <span className="text-[8px] font-mono text-white/45">
                              {notif.relativeTime}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/70 line-clamp-2 leading-snug">
                            {notif.previewText}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {messages.filter(m => m.unread).length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          setAdminTab('messages');
                          setIsNotifDropdownOpen(false);
                        }}
                        className="w-full text-center py-1.5 rounded-lg bg-[#ff7a18]/15 border border-[#ff7a18]/20 hover:bg-[#ff7a18]/25 text-[10px] font-mono font-bold text-primary transition-all cursor-pointer"
                      >
                        VIEW ALL INTAKE CORRESPONDENCE
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-right sm:block hidden">
              <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                SECURE CONSOLE SHELL
              </span>
            </div>
          </div>
        </header>

        {/* Workspace Tab Switching logic rendering */}
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* TAB 1: OVERVIEW METRIC */}
          {adminTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {metrics.map((met) => (
                  <div key={met.id} className="p-6 rounded-2xl bg-[#141824] border border-white/5 relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-white/40 mb-3 text-xs font-mono uppercase tracking-wider">
                        <span>{met.label}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-primary/25 flex items-center justify-center" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-mono font-black text-white">{met.value}</span>
                        <span className={`text-[10px] font-mono font-bold ${met.trendDirection === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {met.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Lower telemetry screen splits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual states */}
                <div className="p-6 rounded-2xl bg-[#141824] border border-white/5 space-y-4">
                  <div>
                    <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest font-bold">Project State Sliders</h3>
                    <p className="text-[10px] text-white/35 mt-0.5">Drag indices to synchronize deliverables instantly with customer client profiles.</p>
                  </div>

                  <div className="space-y-3">
                    {projects.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl bg-[#0c0f18] border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{p.name} (Prefix: {p.prefix})</span>
                          <span className="text-[#ff7a18] font-mono font-bold">{p.progress}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={p.progress}
                          onChange={(e) => {
                            saveProject({...p, progress: Number(e.target.value)});
                          }}
                          className="w-full accent-primary h-1 bg-white/10 rounded-lg cursor-ew-resize"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Client Activity Feed Hub */}
                <div className="p-6 rounded-2xl bg-[#141824] border border-white/5 space-y-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest font-black">
                          Live Client Activity telemetry
                        </h3>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase animate-pulse">
                        SLA Stream Active
                      </span>
                    </div>
                    <p className="text-[10px] text-white/35 mt-1">
                      Monitoring real-time interactions, legally signed covenants, proposal reviews, and milestone downloads.
                    </p>
                  </div>

                  {/* Filtering controls line */}
                  <div className="space-y-2.5">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/35" />
                      <input 
                        type="text"
                        placeholder="Search logs by client or description..."
                        value={activitySearchQuery}
                        onChange={(e) => setActivitySearchQuery(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 text-[11px] rounded-xl pl-9 pr-4 py-2 text-white placeholder-white/35 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Client selector filter */}
                      <div>
                        <label className="block text-[8px] font-mono text-white/45 mb-1 uppercase">Filter by Client</label>
                        <select
                          value={activityClientFilter}
                          onChange={(e) => setActivityClientFilter(e.target.value)}
                          className="w-full bg-[#0a0d16] border border-white/10 text-[10px] rounded-lg px-2 py-1.5 text-white/80 focus:outline-none"
                        >
                          <option value="all">Sathi (All Clients)</option>
                          <option value="system-only">System Logs Only</option>
                          {/* Dynamically retrieve actual client names */}
                          {Array.from(new Set(clients.map(c => c.name))).map((nameObj) => {
                            const name = nameObj as string;
                            return (
                              <option key={name} value={name.toLowerCase()}>{name}</option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Action Category Filter */}
                      <div>
                        <label className="block text-[8px] font-mono text-white/45 mb-1 uppercase">Filter Action type</label>
                        <select
                          value={activityCategoryFilter}
                          onChange={(e) => setActivityCategoryFilter(e.target.value as any)}
                          className="w-full bg-[#0a0d16] border border-white/10 text-[10px] rounded-lg px-2 py-1.5 text-white/80 focus:outline-none"
                        >
                          <option value="all">Subai (All Types)</option>
                          <option value="launch">Proposals/Downloads</option>
                          <option value="done_all">Covenants/Agreements</option>
                          <option value="billing">Invoices & Billing</option>
                          <option value="ticket">Incident Support</option>
                          <option value="user">User Auth/Sessions</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Log stream with interactive list */}
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {filteredActivities.length === 0 ? (
                      <div className="p-8 text-center rounded-xl bg-[#0c0f18]/80 border border-dashed border-white/5 space-y-2">
                        <SlidersHorizontal className="w-5 h-5 text-white/20 mx-auto animate-pulse" />
                        <p className="text-[10px] text-white/45">No matches found for key query params.</p>
                      </div>
                    ) : (
                      filteredActivities.map((act) => {
                        // Badge selections
                        let badgeBg = 'bg-primary/10 text-primary border-primary/20';
                        let badgeLabel = 'SLA';
                        if (act.type === 'billing') {
                          badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                          badgeLabel = 'BILLING';
                        } else if (act.type === 'ticket') {
                          badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                          badgeLabel = 'TICKET';
                        } else if (act.type === 'done_all') {
                          badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                          badgeLabel = 'COVENANT';
                        } else if (act.type === 'user') {
                          badgeBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                          badgeLabel = 'ACCESS';
                        } else if (act.type === 'launch') {
                          badgeBg = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                          badgeLabel = 'PORTAL';
                        }

                        return (
                          <div 
                            key={act.id} 
                            onClick={() => setSelectedInspectActivity(act)}
                            className="p-3 bg-[#0c0f18] hover:bg-[#101422] rounded-xl border border-white/5 hover:border-white/10 transition-all flex items-start gap-3 cursor-pointer text-xs relative group"
                          >
                            {/* Accent badge */}
                            <div className={`p-1 font-mono text-[7px] font-black tracking-widest text-center uppercase min-w-[54px] rounded border shrink-0 ${badgeBg}`}>
                              {badgeLabel}
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <p className="text-white/85 font-medium leading-normal group-hover:text-white transition-colors break-words">
                                {act.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-white/40">
                                <span className="font-mono text-white/30">{act.relativeTime}</span>
                                {act.clientName && (
                                  <>
                                    <span className="text-white/20">•</span>
                                    <span className="px-1.5 py-0.2 rounded bg-white/5 text-white/60 font-mono text-[8px] font-bold">
                                      {act.clientName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Eye className="w-3.5 h-3.5 text-primary" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Status checklist */}
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-white/30">
                    <span>Active Telemetry nodes: <strong>{filteredActivities.length}</strong></span>
                    <span>Total Logs: <strong>{activities.length}</strong></span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: CLIENT INVITATIONS AND LINK GENERATOR */}
          {adminTab === 'invitations' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Generate form (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-[#141824] border border-white/5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                       <Key className="w-4 h-4 text-primary" /> Generate Client Invitation
                    </h3>
                    <p className="text-xs text-white/40 mt-1">Issues custom activation keys mapped instantly inside firebase security locks.</p>
                  </div>

                  <form onSubmit={handleGenerateInviteSubmit} className="space-y-4 text-xs font-sans">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">RECIPIENT EMAIL</label>
                      <input 
                        type="email" 
                        placeholder="client@growthventure.com"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#ff7a18] font-bold mb-1">RECIPIENT PHONE NUMBER</label>
                      <input 
                        type="tel" 
                        placeholder="e.g. +977-9801234567"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#edc157] font-bold mb-1">SECURE ACCESS PASSWORD (OPTIONAL)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Pass123 (or blank to auto-generate)"
                        value={invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">PROPOSED VENTURE WORKSPACE PROJECT NAME</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Lumina Mobile System V2"
                        required
                        value={inviteProjectName}
                        onChange={(e) => setInviteProjectName(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">PARTNERSHIP PLAN PACKAGE</label>
                      <select 
                        value={invitePlanName}
                        onChange={(e) => setInvitePlanName(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-xs"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.name}>{p.name} Tier ({p.price})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-secondary font-bold mb-1 flex justify-between items-center">
                        <span>Distinct Features & Deliverables for this client</span>
                        <span className="text-[8px] text-white/30 lowercase italic">one feature per line</span>
                      </label>
                      <textarea 
                        placeholder="UI/UX Design Concept&#10;5-Day Sprints&#10;Custom deliverable items..."
                        value={inviteCustomFeaturesText}
                        onChange={(e) => setInviteCustomFeaturesText(e.target.value)}
                        rows={5}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-xs font-sans whitespace-pre-wrap leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">KEY EXPIRATION VALIDITY</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {([2, 7, 14, 30] as const).map(day => (
                          <button 
                            key={day}
                            type="button"
                            onClick={() => setInviteDuration(day)}
                            className={`py-2 border text-[10px] uppercase font-mono rounded-lg transition-all ${
                              inviteDuration === day 
                                ? 'bg-primary/20 text-primary border-primary/45 font-bold' 
                                : 'bg-[#0a0d16] text-white/40 border-white/5 hover:text-white'
                            }`}
                          >
                            {day} Days
                          </button>
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-orange-950 font-black text-xs font-mono tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg"
                    >
                      GENERATE VERIFICATION KEYS
                    </button>
                  </form>

                  {/* Showcase Generated credentials */}
                  {latestGeneratedInvite && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-3 animate-fadeIn">
                      <div className="flex justify-between items-center text-[10px] font-mono text-primary/80">
                        <span>GENERATED OK:</span>
                        <span>{latestGeneratedInvite.invitationCode}</span>
                      </div>
                      
                      <div className="space-y-1 font-mono text-[10px]">
                        <p className="truncate text-white/60">Email: {latestGeneratedInvite.email}</p>
                        <p className="text-[#edc157]">Code: {latestGeneratedInvite.invitationCode}</p>
                        <p className="text-[#ff7a18] font-bold">Password: {latestGeneratedInvite.password || 'N/A'}</p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleCopyInviteLink(latestGeneratedInvite.invitationCode)}
                          className="flex-1 py-1 px-2 rounded bg-white/5 text-[9px] font-mono text-white/80 border border-white/5 flex items-center justify-center gap-1 hover:bg-white/10"
                        >
                          Copy secure link
                        </button>
                        <button 
                          onClick={() => {
                            acceptInvitation(latestGeneratedInvite.invitationCode, 'Sarah Connor');
                            triggerToast('Simulating registration accepting with name "Sarah Connor"...');
                          }}
                          className="py-1 px-2 rounded bg-[#ff7a18]/20 border border-[#ff7a18]/30 text-[#ffb68e] text-[9px] font-mono flex items-center justify-center gap-1 hover:brightness-110"
                        >
                          Accept Sandbox Profile
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* invitations status list (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="p-6 rounded-3xl bg-[#141824] border border-white/5 space-y-4">
                    <h3 className="text-xs font-mono text-white/45 uppercase tracking-widest font-bold">Cryptographic keys pipeline</h3>
                    
                    <div className="space-y-3">
                      {invitations.length === 0 ? (
                        <div className="p-8 text-center text-xs text-white/30 bg-white/[0.01] rounded-2xl border border-dashed border-white/5 font-mono">
                          No invitationsissued. Use the generator form opposite.
                        </div>
                      ) : (
                        invitations.map((inv) => (
                          <div id={`invite-card-${inv.invitationCode}`} key={inv.invitationCode} className="p-4 rounded-xl bg-[#0c0f18] border border-white/5 space-y-3 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[#ff7a18] font-bold tracking-widest">{inv.invitationCode}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold ${
                                inv.status === 'Pending' ? 'bg-orange-500/15 text-primary' :
                                inv.status === 'Accepted' ? 'bg-emerald-500/15 text-emerald-400' :
                                'bg-rose-500/15 text-rose-400'
                              }`}>
                                {inv.status.toUpperCase()}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-white/50 text-[11px]">
                              <p>Client: <strong className="text-white">{inv.email}</strong></p>
                              <p>Phone: <span className="font-mono text-white/80">{inv.phone || 'Not Specified'}</span></p>
                              <p>Project: <strong className="text-white">{inv.projectName}</strong></p>
                              <p>Plan Tier: <span className="font-mono text-secondary text-[9px] uppercase">{inv.plan}</span></p>
                              <p className="col-span-2">Security Password: <strong className="font-mono text-emerald-400 tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs select-all cursor-pointer" title="Click to copy password or select it">{inv.password || 'Auto-generated'}</strong></p>
                              <p className="col-span-2">Expires: <span className="font-mono text-[#edc157] text-[9px]">{new Date(inv.expiresAt).toLocaleDateString()}</span></p>
                              {inv.customFeatures && inv.customFeatures.length > 0 && (
                                <div className="col-span-2 text-[10px] text-emerald-400 font-sans mt-1 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                                  <span className="font-bold text-white/80 block mb-0.5 text-[9px] uppercase tracking-wider font-mono">Tailored SLA Features ({inv.customFeatures.length}):</span>
                                  <ul className="list-disc list-inside space-y-0.5 opacity-90">
                                    {inv.customFeatures.map((f, i) => <li key={i} className="truncate">{f}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-white/5">
                              <button 
                                onClick={() => handleCopyInviteLink(inv.invitationCode)}
                                className="px-2 py-1 bg-white/5 text-[9px] font-mono hover:bg-white/10 rounded text-white flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" /> Copy Simulation Link
                              </button>

                              {inv.status === 'Pending' && (
                                <>
                                  <button 
                                    onClick={() => {
                                      resendInvitationSignal(inv.invitationCode);
                                      triggerToast(`Secure credentials dispatch transmitted to ${inv.email}`);
                                    }}
                                    className="px-2 py-1 bg-[#edc157]/10 hover:bg-[#edc157]/15 rounded text-[#edc157] text-[9px] font-mono cursor-pointer"
                                  >
                                    Transmit Reminder
                                  </button>
                                  <button 
                                    onClick={() => {
                                      disableInvitation(inv.invitationCode);
                                      triggerToast(`Revoked invite keys: ${inv.invitationCode}`);
                                    }}
                                    className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-mono rounded cursor-pointer ml-auto"
                                  >
                                    Revoke Lock
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: CLIENT PROFILES MANAGEMENT */}
          {adminTab === 'clients' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141824] p-5 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" /> Client Partner Accounts
                  </h3>
                  <p className="text-xs text-white/40 font-mono mt-0.5">Identify, manage, and provision secure access credentials for client partners instantly.</p>
                </div>
                <button
                  id="btn-create-client-partner"
                  onClick={() => {
                    // Pre-generate a password
                    const passPool = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
                    let securePassword = '';
                    for (let i = 0; i < 8; i++) {
                      securePassword += passPool.charAt(Math.floor(Math.random() * passPool.length));
                    }
                    setDirectClientPassword(securePassword);
                    setShowAddClientModal(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary rounded-xl text-xs font-mono text-orange-950 font-bold hover:brightness-110 shadow-lg shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create Partner Account
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Issue Invoice (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-3xl bg-[#141824] border border-white/5 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" /> Issue Billing Invoice
                    </h3>
                    <p className="text-xs text-white/40 mt-1">Publish new invoices linked immediately inside client timelines for sandbox clearings.</p>
                  </div>

                  <form onSubmit={handleIssueInvoiceSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">SELECT CLIENT ENDPOINT</label>
                      <select 
                        value={selectedClientEmailForInv}
                        onChange={(e) => setSelectedClientEmailForInv(e.target.value)}
                        required
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-xs"
                      >
                        <option value="">-- Choose registered customer --</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.email}>{c.name} ({c.email})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">INVOICE TITLE / MILESTONE SUMMARY</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Sprint 2 Wireframe Clearance"
                        value={invoiceTitle}
                        onChange={(e) => setInvoiceTitle(e.target.value)}
                        className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">AMOUNT RATIO</label>
                        <input 
                          type="text" 
                          required
                          value={invoiceAmountStr}
                          onChange={(e) => setInvoiceAmountStr(e.target.value)}
                          className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">DUE DATE</label>
                        <input 
                          type="date" 
                          required
                          value={invoiceDueDate}
                          onChange={(e) => setInvoiceDueDate(e.target.value)}
                          className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-orange-950 font-black text-xs font-mono tracking-widest hover:brightness-110 transition-all cursor-pointer shadow-lg"
                    >
                      DISPATCH SECURED INVOICE
                    </button>
                  </form>
                </div>

                {/* Clients & active support responding lists (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Active Support Tickets queue */}
                  {tickets.length > 0 && (
                    <div className="p-6 rounded-3xl bg-[#141824] border border-white/5 space-y-4">
                      <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest font-bold flex items-center gap-1.5 animate-pulse">
                        <LifeBuoy className="w-4 h-4 text-primary" /> Active SLA Incidents Requiring Assist
                      </h4>

                      <div className="space-y-3">
                        {tickets.map((tkt) => (
                          <div key={tkt.id} className="p-4 rounded-xl bg-[#0c0f18] border border-white/5 space-y-3 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">{tkt.title}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold ${
                                tkt.severity === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-orange-500/10 text-primary'
                              }`}>
                                {tkt.severity}
                              </span>
                            </div>

                            <p className="text-white/60 italic bg-white/[0.01] p-3 rounded-xl border border-white/5">
                              {tkt.description}
                            </p>

                            {/* Existing Replies in Thread */}
                            {tkt.replies && tkt.replies.length > 0 && (
                              <div className="space-y-2 mt-2">
                                {tkt.replies.map((rep, idx) => (
                                  <div key={idx} className={`p-2 rounded-lg text-[10px] ${rep.sender === 'admin' ? 'bg-primary/5 text-white/90 border border-primary/10 ml-4' : 'bg-white/[0.02] text-white/80 mr-4'}`}>
                                    <span className="font-mono text-[8px] uppercase text-secondary font-bold mr-1">
                                      {rep.sender === 'admin' ? 'Operator' : rep.senderName}
                                    </span>
                                    {rep.message}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!ticketReplyText.trim()) return;
                                addTicketReply(tkt.id, ticketReplyText.trim(), 'admin', 'Nishant');
                                setTicketReplyText('');
                                setReplyTicketId(null);
                                triggerToast('Support feedback sent to client dashboard.');
                              }}
                              className="flex gap-2 pt-2 border-t border-white/5"
                            >
                              <input 
                                type="text"
                                placeholder="Write support diagnostic or resolution detail..."
                                value={replyTicketId === tkt.id ? ticketReplyText : ''}
                                onChange={(e) => {
                                  setReplyTicketId(tkt.id);
                                  setTicketReplyText(e.target.value);
                                }}
                                className="flex-1 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                              />
                              <button 
                                type="submit"
                                className="px-3 bg-white/5 text-white rounded-lg hover:bg-white/10 font-bold transition-all"
                              >
                                Submit Reply
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Registered Collaborators list */}
                  <div className="p-6 rounded-3xl bg-[#141824] border border-white/5 space-y-4">
                    <h3 className="text-xs font-mono text-white/45 uppercase tracking-widest font-bold">Registered Customer Profiles</h3>
                    
                    <div className="space-y-3">
                      {clients.length === 0 ? (
                        <div className="p-8 text-center text-xs text-white/30 font-mono bg-[#0c0f18] rounded-xl border border-white/5">
                          No active client profiles verified under current locks.
                        </div>
                      ) : (
                        clients.map((cl) => (
                          <div id={`client-row-${cl.id}`} key={cl.id} className="p-4 rounded-xl bg-[#0c0f18] border border-white/5 space-y-3 text-xs">
                            <div className="flex items-center gap-3 justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#141b2a] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {cl.avatar ? (
                                    <img src={cl.avatar} alt="Collaborator avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-mono text-primary font-bold">{cl.name.slice(0, 2).toUpperCase()}</span>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-white leading-none">{cl.name}</h4>
                                  <span className="text-[10px] text-white/40">{cl.email}</span>
                                </div>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase font-bold border ${
                                cl.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {cl.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-white/45 font-mono pt-1">
                              <p>Pipeline: <strong className="text-white font-sans">{cl.projectName}</strong></p>
                              <p>Pricing Tier: <strong className="text-secondary">{cl.plan} Package</strong></p>
                              <p className="col-span-2">Contact Phone: <strong className="text-white font-sans">{cl.phone || 'None Registered'}</strong></p>
                              <p className="col-span-2">Portal Cryptokey Password: <strong className="font-mono text-emerald-400 tracking-wider bg-[#141b2a] px-1.5 py-0.5 rounded text-xs select-all cursor-pointer">{cl.password || 'Temporary / Single-Factor'}</strong></p>
                              {cl.customFeatures && cl.customFeatures.length > 0 && (
                                <div className="col-span-2 bg-[#141b2a] border border-white/5 p-2 rounded-lg mt-1 space-y-1">
                                  <span className="text-[9px] uppercase tracking-wider text-[#ff7a18] font-bold block">Assigned Custom SLA Features:</span>
                                  <ul className="list-disc list-inside text-[10px] text-white/70 space-y-0.5 font-sans">
                                    {cl.customFeatures.map((feat, fIdx) => (
                                      <li key={fIdx}>{feat}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Render client issued invoices */}
                            {invoices.filter((inv) => inv.clientEmail.toLowerCase() === cl.email.toLowerCase()).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                                <p className="text-[9px] font-mono uppercase tracking-widest text-[#ff7a18]/80 font-bold">Issued Billing Accounts</p>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                  {invoices.filter((inv) => inv.clientEmail.toLowerCase() === cl.email.toLowerCase()).map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between gap-3 text-[11px] bg-white/[0.01] hover:bg-white/[0.03] p-2 rounded-lg border border-white/5 transition-all">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-white font-medium truncate">{inv.title}</p>
                                        <p className="text-[9px] text-white/35 font-mono mt-0.5">Due: {inv.dueDate || 'Immediate'}</p>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right mr-1">
                                          <p className="font-bold text-white font-mono">{inv.amount}</p>
                                          <span className={`text-[8px] font-bold font-mono tracking-wider ${inv.status === 'Paid' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                            {inv.status.toUpperCase()}
                                          </span>
                                        </div>

                                        <button
                                          onClick={() => {
                                            downloadInvoicePDF(inv, clients, projects);
                                            triggerToast(`Initiated PDF download for "${inv.title}"`);
                                          }}
                                          className="p-1 px-1.5 bg-white/5 hover:bg-white/10 hover:text-[#ff7a18] rounded text-[10px] font-mono text-white/80 transition-all cursor-pointer border border-white/5 flex items-center gap-1"
                                          title="Download PDF"
                                        >
                                          <Download className="w-3.5 h-3.5" /> PDF
                                        </button>

                                        <button
                                          onClick={() => {
                                            const consent = confirm(`Are you sure you want to delete invoice "${inv.title}"?`);
                                            if (consent) {
                                              deleteInvoice(inv.id);
                                              triggerToast(`Deleted invoice "${inv.title}" successfully.`);
                                            }
                                          }}
                                          className="p-1 hover:bg-rose-500/10 text-rose-400/60 hover:text-rose-400 rounded transition-all cursor-pointer"
                                          title="Delete Invoice"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-2 border-t border-white/5">
                              <button 
                                onClick={() => {
                                  toggleClientStatus(cl.id);
                                  triggerToast(`Toggled profile status for ${cl.name}`);
                                }}
                                className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-mono rounded text-white cursor-pointer"
                              >
                                {cl.status === 'Active' ? 'Suspend Profile' : 'Restore Connection'}
                              </button>

                              <button 
                                onClick={() => {
                                  deleteClient(cl.id);
                                  triggerToast(`Authorized client deletion for profile: ${cl.name}`);
                                }}
                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-mono rounded cursor-pointer ml-auto"
                              >
                                Disconnect
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 4: CLIENT PIPELINES WORKSPACES (With document files upload modal integration) */}
          {adminTab === 'projects' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Operational Client Pipelines</h3>
                  <p className="text-xs text-white/40">Enter active development details, update completion status, and upload assets/deliverables.</p>
                </div>

                <button 
                  onClick={() => setShowAddProjectModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-primary to-[#ff7a18] rounded-xl text-xs font-mono text-orange-950 font-bold hover:brightness-110 shadow-lg shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Initialize Development Pipeline
                </button>
              </div>

              {/* Grid of Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((p) => (
                  <div key={p.id} className="p-6 rounded-2xl bg-[#141824] border border-white/10 space-y-6 flex flex-col justify-between">
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#ff7a18] flex items-center justify-center font-mono font-extrabold shadow-inner select-none">
                            {p.prefix || 'DY'}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-white">{p.name}</h4>
                            <span className="text-xs text-white/40 font-medium">Customer: {p.client} ({p.clientEmail || 'Pending'})</span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded bg-[#0a0e18] border border-white/5 text-[10px] font-mono text-[#edc157] font-bold uppercase">
                          {p.status}
                        </span>
                      </div>

                      {/* Slider Progress */}
                      <div className="space-y-2 bg-[#0c101c] p-4 rounded-xl border border-white/5 text-xs">
                        <div className="flex justify-between font-mono">
                          <span className="text-white/40">COMPLETION SCALE</span>
                          <span className="text-primary font-bold">{p.progress}% Completeness</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={p.progress}
                          onChange={(e) => {
                            saveProject({...p, progress: Number(e.target.value)});
                          }}
                          className="w-full accent-primary h-1 bg-white/10 rounded-lg cursor-ew-resize"
                        />
                      </div>

                      {/* Display already uploaded deliverables files for this project */}
                      <div className="space-y-2.5">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Uploaded Sandbox files ({p.deliverables?.length || 0})</p>
                        
                        {p.deliverables && p.deliverables.map((del) => (
                          <div key={del.id} className="p-2.5 rounded-lg bg-[#0a0d16] border border-white/5 flex justify-between items-center text-xs font-mono">
                            <span className="text-white truncate max-w-[70%]">{del.name}</span>
                            <span className="text-[10px] text-white/40">{del.fileSize}</span>
                          </div>
                        ))}

                        <button 
                          onClick={() => setSelectedProjectIdForDel(p.id)}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-mono text-white uppercase font-bold rounded-lg transition-all border border-white/5 cursor-pointer"
                        >
                          + Upload High-Speed Deliverable Asset
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between">
                      <button 
                        onClick={() => setEditingProject(p)}
                        className="px-3 py-1.5 rounded bg-white/5 text-[10px] font-mono font-bold text-primary hover:bg-white/10"
                      >
                        Change Prefix/Status
                      </button>

                      <button 
                        onClick={() => deleteProject(p.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: PRICING PLANS CONFIGURATION */}
          {adminTab === 'pricing' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">SaaS Contract Plans Configurer</h3>
                  <p className="text-xs text-white/40">Alter status visibilities (Active/Inactive) or specify custom feature checklists</p>
                </div>

                <button 
                  onClick={() => setShowAddPlanModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-primary to-[#ff7a18] rounded-xl text-xs font-mono text-orange-950 font-bold hover:brightness-110 shadow-lg shadow-orange-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Configure Pricing Tier
                </button>
              </div>

              {/* PLANS TABLE */}
              <div className="rounded-2xl border border-white/10 bg-[#141824] overflow-hidden">
                <table className="w-full table-auto border-collapse text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-[#0b0e17] text-white/40 border-b border-white/5 uppercase">
                      <th className="px-6 py-4">Pricing Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Cost Ratio</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Badge Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {plans.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.01]">
                        <td className="px-6 py-4 font-bold text-white text-sm">{p.name}</td>
                        <td className="px-6 py-4 uppercase text-[10px] text-[#edc157]">{p.type}</td>
                        <td className="px-6 py-4 font-bold text-white">{p.price}</td>
                        <td className="px-6 py-4 text-center text-emerald-400 font-bold">{p.active ? '● LIVE' : '○ RETIRED'}</td>
                        <td className="px-6 py-4 text-center font-bold text-[#ff7a18]">{p.popular ? '★ HIGHLIGHTED' : '☆ STABILIZED'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 6: DOCK SIDE AND LIVE LIAISON MESSAGING CHAT */}
          {adminTab === 'messages' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* HEADER WITH CONTROLS */}
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#141824] p-5 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" /> Intake Inquiry Hub
                  </h3>
                  <p className="text-xs text-white/40 font-mono mt-0.5">Aggregated client briefs, intake inquiries, and secure communication channels syncing live.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* CSV Export Button */}
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/20 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                    title={`Export ${processedMessages.length} filtered inquiries to CSV`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  {/* Global search */}
                  <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input 
                      type="text" 
                      value={messageSearchQuery}
                      onChange={(e) => setMessageSearchQuery(e.target.value)}
                      placeholder="Search inquiries..."
                      className="w-full bg-[#0b0e17] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary"
                    />
                    {messageSearchQuery && (
                      <button onClick={() => setMessageSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45">
                        <X className="w-3" />
                      </button>
                    )}
                  </div>

                  {/* Archive view filter */}
                  <div className="flex items-center gap-1 bg-[#0b0e17] p-1 rounded-xl border border-white/10 text-[10px] font-mono">
                    <button 
                      onClick={() => setMessageArchiveFilter('active')}
                      className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${messageArchiveFilter === 'active' ? 'bg-primary text-orange-950 font-bold' : 'text-white/60 hover:text-white'}`}
                    >
                      Active
                    </button>
                    <button 
                      onClick={() => setMessageArchiveFilter('archived')}
                      className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${messageArchiveFilter === 'archived' ? 'bg-primary text-orange-950 font-bold' : 'text-white/60 hover:text-white'}`}
                    >
                      Archived
                    </button>
                    <button 
                      onClick={() => setMessageArchiveFilter('all')}
                      className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${messageArchiveFilter === 'all' ? 'bg-primary text-orange-950 font-bold' : 'text-white/60 hover:text-white'}`}
                    >
                      All
                    </button>
                  </div>
                </div>
              </div>

              {/* FILTER TOGGLE & ACTIONS ROW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-center bg-[#0d111d] p-4 rounded-xl border border-white/5 text-xs">
                {/* Status selector */}
                <div className="lg:col-span-5 flex flex-wrap items-center gap-2">
                  <span className="text-white/40 font-mono text-[10px] uppercase flex items-center gap-1 shrink-0">
                    <Filter className="w-3 h-3 text-secondary" /> Status:
                  </span>
                  <div className="flex bg-[#121626] p-0.5 rounded-lg border border-white/5">
                    {(['all', 'unread', 'read', 'replied'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setMessageStatusFilter(st)}
                        className={`px-3 py-1 text-[10px] rounded-md font-mono capitalize transition-all cursor-pointer ${messageStatusFilter === st ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sender Type Filter */}
                <div className="lg:col-span-4 flex items-center gap-2">
                  <span className="text-white/40 font-mono text-[10px] uppercase shrink-0">Sender:</span>
                  <div className="flex bg-[#121626] p-0.5 rounded-lg border border-white/5">
                    {(['all', 'partner', 'public'] as const).map(tp => (
                      <button
                        key={tp}
                        onClick={() => setMessageSenderTypeFilter(tp)}
                        className={`px-3 py-1 text-[10px] rounded-md font-mono capitalize transition-all cursor-pointer ${messageSenderTypeFilter === tp ? 'bg-white/10 text-white font-bold' : 'text-white/40 hover:text-white'}`}
                      >
                        {tp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bulk & stats labels */}
                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 text-[10px] font-mono text-white/40">
                  <span>Selected: <b className="text-primary">{processedMessages.length}</b> matches</span>
                  <span>Total: <b>{messages.length}</b> inquiries</span>
                </div>
              </div>

              {/* DYNAMIC BULK ACTION BALANCER TOOLBAR */}
              {selectedMessageIds.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-[#0e1220] border-2 border-cyan-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.15)] animate-fadeIn transition-all">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <div>
                      <p className="text-xs font-mono text-white/90">
                        <strong>{selectedMessageIds.length}</strong> {selectedMessageIds.length === 1 ? 'Inquiry Record' : 'Inquiry Records'} Selected
                      </p>
                      <p className="text-[10px] text-white/35">Execute operations across all selected intake records simultaneously.</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={handleBulkMarkReviewed}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:brightness-110 text-cyan-950 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Reviewed & Notify</span>
                    </button>

                    <button
                      onClick={() => handleBulkArchive(true)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>

                    <button
                      onClick={() => handleBulkArchive(false)}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      <ArchiveRestore className="w-4 h-4" />
                      <span>Restore</span>
                    </button>

                    <button
                      onClick={() => setSelectedMessageIds([])}
                      className="px-3 py-2 hover:bg-rose-500/15 text-rose-400 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border border-transparent hover:border-rose-500/10 text-center"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              {/* DATA TABLE */}
              <div className="bg-[#101422] rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#141825] border-b border-white/5 text-[10px] font-mono uppercase tracking-wider text-white/50">
                        {/* Master bulk select checkbox column */}
                        <th className="px-6 py-4 w-12 text-center select-none">
                          <input 
                            type="checkbox"
                            checked={processedMessages.length > 0 && processedMessages.every(msg => selectedMessageIds.includes(msg.id))}
                            onChange={() => {
                              const isAllSelected = processedMessages.length > 0 && processedMessages.every(msg => selectedMessageIds.includes(msg.id));
                              if (isAllSelected) {
                                const processedIds = processedMessages.map(m => m.id);
                                setSelectedMessageIds(prev => prev.filter(id => !processedIds.includes(id)));
                              } else {
                                const processedIds = processedMessages.map(m => m.id);
                                setSelectedMessageIds(prev => {
                                  const next = [...prev];
                                  processedIds.forEach(id => {
                                    if (!next.includes(id)) {
                                      next.push(id);
                                    }
                                  });
                                  return next;
                                });
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-white/10 bg-[#0a0d16] text-[#ff7a18] focus:ring-0 cursor-pointer accent-primary"
                          />
                        </th>
                        {/* Sort indicators on click */}
                        <th 
                          onClick={() => {
                            if (messageSortField === 'status') {
                              setMessageSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setMessageSortField('status');
                              setMessageSortDirection('desc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-all text-center select-none w-28"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            Status
                            {messageSortField === 'status' ? (
                              messageSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary animate-bounce" /> : <ArrowDown className="w-3 h-3 text-primary animate-bounce" />
                            ) : null}
                          </div>
                        </th>
                        
                        <th 
                          onClick={() => {
                            if (messageSortField === 'name') {
                              setMessageSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setMessageSortField('name');
                              setMessageSortDirection('asc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-all select-none"
                        >
                          <div className="flex items-center gap-1.5">
                            Sender & Email
                            {messageSortField === 'name' ? (
                              messageSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary animate-bounce" /> : <ArrowDown className="w-3 h-3 text-primary animate-bounce" />
                            ) : null}
                          </div>
                        </th>

                        <th className="px-6 py-4">Inquiry text preview</th>
                        <th className="px-6 py-4 w-44">Liaison Type</th>
                        
                        <th 
                          onClick={() => {
                            if (messageSortField === 'date') {
                              setMessageSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setMessageSortField('date');
                              setMessageSortDirection('desc');
                            }
                          }}
                          className="px-6 py-4 cursor-pointer hover:bg-white/5 transition-all select-none text-right w-36"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            Received At
                            {messageSortField === 'date' ? (
                              messageSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                            ) : null}
                          </div>
                        </th>
                        
                        <th className="px-6 py-4 text-center w-40">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/5 text-xs text-white/80 font-sans">
                      {processedMessages.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center text-white/30 font-mono">
                            <SlidersHorizontal className="w-8 h-8 text-white/10 mx-auto mb-3" />
                            No matching inquiry records found correlating with pipeline filter keys.
                          </td>
                        </tr>
                      ) : (
                        processedMessages.map((msg) => {
                          const isArchived = archivedMessageIds.includes(msg.id);
                          const hasReplied = msg.replies && msg.replies.length > 0;
                          
                          return (
                            <tr 
                              key={msg.id} 
                              className={`hover:bg-white/[0.02] transition-all duration-150 ${msg.unread ? 'bg-[#ff7a18]/[0.02]' : ''} ${selectedMessageIds.includes(msg.id) ? 'bg-cyan-500/10' : ''}`}
                            >
                              {/* SELECTION CHECKBOX CELL */}
                              <td className="px-6 py-4 text-center select-none w-12">
                                <input 
                                  type="checkbox"
                                  checked={selectedMessageIds.includes(msg.id)}
                                  onChange={() => {
                                    setSelectedMessageIds(prev => 
                                      prev.includes(msg.id) 
                                        ? prev.filter(x => x !== msg.id) 
                                        : [...prev, msg.id]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 rounded border-white/10 bg-[#0a0d16] text-[#ff7a18] focus:ring-0 cursor-pointer accent-primary"
                                />
                              </td>

                              {/* STATUS CELL */}
                              <td className="px-6 py-4 text-center">
                                {reviewedMessageIds.includes(msg.id) ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-mono font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Reviewed ✓
                                  </span>
                                ) : msg.unread ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[#ff7a18] text-[9px] font-mono font-bold animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a18]" /> Unread
                                  </span>
                                ) : hasReplied ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Replied
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-[9px] font-mono">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> Read
                                  </span>
                                )}
                              </td>

                              {/* SENDER INFO */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0">
                                    {msg.senderName.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="truncate max-w-[180px]">
                                    <div className="font-semibold text-white truncate flex items-center gap-1.5">
                                      {msg.senderName}
                                      {msg.isClientMessage && (
                                        <span className="text-[8px] font-mono px-1 bg-secondary/20 text-[#edc157] rounded-sm font-bold scale-90">
                                          Partner
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-white/40 truncate">{msg.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* TEXT PREVIEW */}
                              <td className="px-6 py-4 max-w-xs md:max-w-sm">
                                <div className="truncate text-white/70 font-sans pr-4" title={msg.previewText}>
                                  {msg.previewText}
                                </div>
                                {hasReplied && (
                                  <div className="text-[10px] text-secondary font-mono mt-1 flex items-center gap-1 truncate">
                                    <MessageSquare className="w-3 h-3 shrink-0" />
                                    <span>Last Reply: {msg.replies![msg.replies!.length - 1]}</span>
                                  </div>
                                )}
                              </td>

                              {/* LIAISON TYPE */}
                              <td className="px-6 py-4 text-white/40 font-mono text-[10px] tracking-wider truncate">
                                {msg.senderRole || 'Generic Prospect'}
                              </td>

                              {/* RECEIVED AT */}
                              <td className="px-6 py-4 text-right font-mono text-[10px] text-white/45">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : msg.relativeTime}
                              </td>

                              {/* ACTIONS */}
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* View More & Respond */}
                                  <button
                                    onClick={() => {
                                      markMessageRead(msg.id);
                                      setSelectedViewingMessage(msg);
                                    }}
                                    className="p-1.5 bg-[#171b26] hover:bg-primary/25 text-white/80 hover:text-primary rounded-lg border border-white/5 hover:border-primary/20 transition-all cursor-pointer"
                                    title="View entire inquiry with replies"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Toggle Read status */}
                                  <button
                                    onClick={() => {
                                      if (msg.unread) {
                                        markMessageRead(msg.id);
                                        triggerToast(`Marked inquiry from "${msg.senderName}" as read.`);
                                      } else {
                                        // Simple toggling helper in local context
                                        const updatedMessages = messages.map(m => m.id === msg.id ? { ...m, unread: true } : m);
                                        localStorage.setItem('diyo_messages', JSON.stringify(updatedMessages));
                                        // Dispatch local storage event to sync components
                                        window.dispatchEvent(new Event('storage'));
                                        triggerToast(`Marked inquiry from "${msg.senderName}" as unread.`);
                                      }
                                    }}
                                    className={`p-1.5 rounded-lg border border-white/5 transition-all cursor-pointer ${msg.unread ? 'bg-[#171b26] text-white/40 hover:text-white' : 'bg-primary/10 border-primary/20 text-primary hover:text-white'}`}
                                    title={msg.unread ? "Mark inquiry as Read" : "Keep marked as Unread"}
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Mark as Reviewed with automated email dispatch */}
                                  <button
                                    onClick={() => handleMarkReviewed(msg.id, msg.senderName, msg.email)}
                                    disabled={reviewedMessageIds.includes(msg.id)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      reviewedMessageIds.includes(msg.id) 
                                        ? 'bg-cyan-500/15 border-cyan-500/20 text-cyan-400 cursor-not-allowed opacity-90' 
                                        : 'bg-[#171b26] border-white/5 text-cyan-400 hover:text-white hover:border-cyan-500/30 hover:bg-cyan-500/10'
                                    }`}
                                    title={reviewedMessageIds.includes(msg.id) ? "Successfully Reviewed & Client Notified" : "Mark as Reviewed & Send Automated Email"}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Archive Toggle */}
                                  <button
                                    onClick={() => handleToggleArchiveMessage(msg.id)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${isArchived ? 'bg-secondary/10 border-secondary/20 text-secondary hover:brightness-110' : 'bg-[#171b26] border-white/5 text-white/40 hover:text-white hover:bg-white/5'}`}
                                    title={isArchived ? "Unarchive inquiry back to Inbox" : "Archive inquiry"}
                                  >
                                    {isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AUTOMATED OUTBOX SECTION */}
              <div className="p-6 rounded-2xl bg-[#141824] border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-3 gap-2">
                  <div>
                    <h4 className="text-xs font-mono text-white/40 uppercase tracking-widest font-black flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      Simulated SMTP Automated Outbox Log
                    </h4>
                    <p className="text-[10px] text-white/30 font-sans mt-0.5">
                      Sathi, tracks real-time transactional thank-you dispatches triggered on inquiry review.
                    </p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase shrink-0">
                    SMTP Host Live
                  </span>
                </div>

                {simulatedEmails.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#0c0f18]/40 border border-dashed border-white/5 text-white/30 text-[11px] font-mono">
                    No outbox logs yet. Mark an inbound inquiry as "Reviewed" (dhanyabad) to watch instant messages dispatch!
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                    {simulatedEmails.map((em) => (
                      <div key={em.id} className="p-4 rounded-xl bg-[#0d101a] border border-white/5 space-y-2 text-xs">
                        <div className="flex justify-between items-start gap-2 bg-[#080b13] p-2 rounded-lg">
                          <div>
                            <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider block">RECIPIENT PORTAL ADDR</span>
                            <span className="text-white/80 font-bold font-mono text-[10.5px]">
                              {em.recipientName} &lt;{em.recipient}&gt;
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-[#edc157] font-bold">
                            {new Date(em.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="space-y-1 pl-1">
                          <p className="font-semibold text-white text-[11px]"><span className="text-white/40 font-mono text-[10px]">Subject:</span> {em.subject}</p>
                          <p className="text-[10.5px] text-white/50 leading-relaxed font-sans whitespace-pre-wrap pl-2 border-l border-white/5">{em.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 7: SYSTEM AUDIT LOGS DISPLAY */}
          {adminTab === 'audit' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" /> Platform Security System Audit Logs
                  </h3>
                  <p className="text-xs text-white/40">Real-time telemetry tracking when admins perform bulk actions or update client statuses</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Custom CSV export for Audit Logs
                      const headers = ["Log ID", "Event description", "Category", "Target Client", "Absolute Timestamp"];
                      const rows = activities.map(act => {
                        const sanitize = (text: string) => {
                          if (!text) return '""';
                          const str = text.toString().replace(/"/g, '""');
                          return `"${str}"`;
                        };
                        const timestamp = act.timestamp ? new Date(act.timestamp).toISOString() : act.relativeTime;
                        return [
                          sanitize(act.id),
                          sanitize(act.title),
                          sanitize(act.type),
                          sanitize(act.clientName || "System / Admin"),
                          sanitize(timestamp)
                        ];
                      });
                      const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `diyo_security_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      triggerToast("Dispatched secure download for system audit logs!");
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#121624] border border-white/5 hover:border-white/10 text-xs font-mono text-white/70 rounded-xl hover:text-white cursor-pointer hover:bg-white/5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Audit Logs CSV</span>
                  </button>
                </div>
              </div>

              {/* STAT CARDS FOR AUDIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#141824] border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block font-bold">TOTAL ACTIONS RECORDED</span>
                  <p className="text-xl font-bold text-white font-mono">{activities.length}</p>
                  <p className="text-[10px] text-white/40 font-sans">Consolidated telemetry stream</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-[#141824] border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">BULK OPERATIONS</span>
                  <p className="text-xl font-bold text-cyan-400 font-mono">
                    {activities.filter(a => a.title.toLowerCase().includes('bulk')).length}
                  </p>
                  <p className="text-[10px] text-white/40 font-sans">Multi-record updates</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#141824] border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono text-[#ff7a18] uppercase tracking-widest block font-bold">CLIENT LOGS</span>
                  <p className="text-xl font-bold text-[#ff7a18] font-mono">
                    {activities.filter(a => a.title.toLowerCase().includes('client') || a.title.toLowerCase().includes('partner')).length}
                  </p>
                  <p className="text-[10px] text-white/40 font-sans">Status and profile shifts</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#141824] border border-white/5 space-y-1">
                  <span className="text-[9px] font-mono text-pink-400 uppercase tracking-widest block font-bold flex items-center gap-1">DISPATCHED RESPONSES</span>
                  <p className="text-xl font-bold text-pink-400 font-mono">
                    {activities.filter(a => a.type === 'email' || a.title.toLowerCase().includes('dispatched')).length}
                  </p>
                  <p className="text-[10px] text-white/40 font-sans">Automated SMTP triggers</p>
                </div>
              </div>

              {/* FILTERING HEADER */}
              <div className="p-5 rounded-2xl bg-[#141824] border border-white/5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search telemetry payload by description, keywords, or partners..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="w-full bg-[#0a0d16] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest mr-1">Filter Block:</span>
                    {[
                      { key: 'all', label: 'All Logs' },
                      { key: 'bulk', label: 'Bulk Ops' },
                      { key: 'client', label: 'Client States' },
                      { key: 'email', label: 'SMTP Dispatches' },
                      { key: 'others', label: 'Other' }
                    ].map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => setAuditCategory(btn.key as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                          auditCategory === btn.key
                            ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                            : 'bg-[#101422] border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TELEMETRY LOGS FEED */}
                <div className="bg-[#0c0f18] rounded-xl border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-[#080a10] text-[9px] uppercase tracking-widest text-white/40 border-b border-white/5">
                          <th className="px-5 py-3 w-16">ID</th>
                          <th className="px-5 py-3 w-40">Timestamp</th>
                          <th className="px-5 py-3 w-32 text-center">Telemetry Group</th>
                          <th className="px-5 py-3">Event Signature / Payload</th>
                          <th className="px-5 py-3 text-right">Target Party</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {filteredAudits.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-white/30">
                              No telemetry logs correlating with selection query framework.
                            </td>
                          </tr>
                        ) : (
                          filteredAudits.map((item) => {
                            let typeBadge = (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 text-[9px]">
                                System
                              </span>
                            );
                            if (item.title.toLowerCase().includes('bulk')) {
                              typeBadge = (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold font-mono">
                                  Bulk Action
                                </span>
                              );
                            } else if (item.title.toLowerCase().includes('status updated') || item.title.toLowerCase().includes('client status')) {
                              typeBadge = (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ff7a18]/10 border border-[#ff7a18]/20 text-[#ff7a18] text-[9px] font-bold font-mono">
                                  Status Change
                                </span>
                              );
                            } else if (item.type === 'email' || item.title.toLowerCase().includes('dispatched')) {
                              typeBadge = (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[9px] font-bold font-mono">
                                  SMTP dispatch
                                </span>
                              );
                            } else if (item.type === 'user') {
                              typeBadge = (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-mono">
                                  Profile Change
                                </span>
                              );
                            }

                            const displayTime = item.timestamp 
                              ? new Date(item.timestamp).toLocaleString() 
                              : `${item.relativeTime} (Simulated)`;

                            return (
                              <tr key={item.id} className="hover:bg-white/[0.01] transition-all">
                                <td className="px-5 py-3 text-white/30 text-[10px]">#{item.id.slice(-5)}</td>
                                <td className="px-5 py-3 text-white/50 text-[10.5px] font-semibold">{displayTime}</td>
                                <td className="px-5 py-3 text-center">{typeBadge}</td>
                                <td className="px-5 py-3 text-white/95 text-[11px] leading-relaxed max-w-sm overflow-hidden text-ellipsis whitespace-nowrap" title={item.title}>
                                  {item.title}
                                </td>
                                <td className="px-5 py-3 text-right text-cyan-400 text-[10px] font-semibold">
                                  {item.clientName || "System Administrator"}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* DIALOG MODEL 1: REGISTER DEVELOPMENT PIPELINE */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none animate-fadeIn">
          <div className="w-full max-w-md bg-[#121626] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowAddProjectModal(false)}
              className="absolute top-4 right-4 text-white/45 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-bold text-white font-mono uppercase tracking-wider">Initialize Project Pipeline</h3>
              <p className="text-xs text-white/40 mt-0.5">Registering a new client development channel.</p>
            </div>

            <form onSubmit={handleCreateProjectSave} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">VENTURE SYSTEM NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Lumina Portal Framework" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#cfd3db] mb-1">CLIENT REPRESENTATIVE NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="Sarah Jenkins" 
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#cfd3db] mb-1">CLIENT SYSTEM EMAIL</label>
                <input 
                  type="email" 
                  required
                  placeholder="sarah@example.com" 
                  value={newProjClientEmail}
                  onChange={(e) => setNewProjClientEmail(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/53 mb-1">PREFIX ID</label>
                  <input 
                    type="text" 
                    placeholder="LV" 
                    value={newProjPrefix}
                    onChange={(e) => setNewProjPrefix(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/53 mb-1">INITIAL PROGRESS VALUE</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={newProjProgress}
                    onChange={(e) => setNewProjProgress(Number(e.target.value))}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-orange-950 font-extrabold text-xs tracking-widest font-mono rounded-xl transition-all hover:brightness-110 cursor-pointer shadow-lg"
              >
                DEPLOY DEVELOPMENT PIPELINE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODEL 2: CONFIGURE DELIVERABLE ASSETS */}
      {selectedProjectIdForDel && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none animate-fadeIn">
          <div className="w-full max-w-md bg-[#121626] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setSelectedProjectIdForDel(null)}
              className="absolute top-4 right-4 text-white/45 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-bold text-white font-mono uppercase tracking-wider">Upload Secure Deliverable Asset</h3>
              <p className="text-xs text-white/40 mt-0.5">Files uploaded here are published instantly to the linked customer.</p>
            </div>

            <form onSubmit={handleUploadDeliverableSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">FILE NAME</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Lumina_Prototype_Sprint_1.zip"
                  value={newDelName}
                  onChange={(e) => setNewDelName(e.target.value)}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">ASSET TIER CATEGORY</label>
                  <select 
                    value={newDelType}
                    onChange={(e: any) => setNewDelType(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white text-xs"
                  >
                    <option value="design">Design Link</option>
                    <option value="specification">Specification Json</option>
                    <option value="document">Contract pdf doc</option>
                    <option value="archive">Zip build Archive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">FILE SIZE RATIO</label>
                  <input 
                    type="text" 
                    value={newDelSize}
                    onChange={(e) => setNewDelSize(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-orange-950 font-black tracking-widest font-mono text-xs rounded-xl"
              >
                PUBLISH SECURED ASSET
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODEL 3: PRICING CONFIG DETAILS */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none animate-fadeIn">
          <div className="w-full max-w-lg bg-[#121626] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowAddPlanModal(false)}
              className="absolute top-4 right-4 text-white/45 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-bold text-white font-mono uppercase tracking-wider">Configure Pricing Option</h3>
              <p className="text-xs text-white/40 mt-0.5">Parameters set here are synchronized live across public landing spec sheets.</p>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">OPTION NAME</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Scaling MVP"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#cfd3db] mb-1">BILLING TERM STRUCTURE</label>
                  <select 
                    value={newPlanType}
                    onChange={(e: any) => setNewPlanType(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white text-xs"
                  >
                    <option value="fixed">Fixed Single Sprint Cost</option>
                    <option value="monthly">Monthly Engineering Retainer</option>
                    <option value="enterprise">Custom Enterprise Negotiable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">PRICE ratio (USD)</label>
                  <input 
                    type="text"
                    required
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#cfd3db] mb-1">PERIOD DESCRIPTOR</label>
                  <input 
                    type="text"
                    required
                    value={newPlanPeriod}
                    onChange={(e) => setNewPlanPeriod(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">SUMMARY DESCRIPTION</label>
                <textarea 
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                  placeholder="Brief synopsis summarizing this operational contract."
                  rows={2}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">PLAN CHECKLIST FEATURES (LINE SEPARATED)</label>
                <textarea 
                  value={newPlanFeatures}
                  onChange={(e) => setNewPlanFeatures(e.target.value)}
                  placeholder="Continuous UI/UX Updates&#10;2 Full-stack Developers&#10;Dedicated PM lead"
                  rows={3}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-orange-950 font-black tracking-widest font-mono text-xs rounded-xl"
              >
                PUBLISH LIVE CONFIG TIER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODEL 4: CREATE CLIENT PARTNER ACCOUNT */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-sm z-50 flex items-center justify-center p-6 select-none animate-fadeIn">
          <div className="w-full max-w-lg bg-[#121626] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowAddClientModal(false)}
              className="absolute top-4 right-4 text-white/45 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-md font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" /> Create Partner Account
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Provision direct secure access locks and credentials for a partner.</p>
            </div>

            <form onSubmit={handleCreateClientSubmit} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">PARTNER FULL NAME</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={directClientName}
                    onChange={(e) => setDirectClientName(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#cfd3db] mb-1">SECURE PORTAL PASSWORD</label>
                  <div className="relative">
                    <input 
                      type="text"
                      required
                      placeholder="e.g. securePass123"
                      value={directClientPassword}
                      onChange={(e) => setDirectClientPassword(e.target.value)}
                      className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const passPool = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
                        let newPass = '';
                        for (let i = 0; i < 8; i++) {
                          newPass += passPool.charAt(Math.floor(Math.random() * passPool.length));
                        }
                        setDirectClientPassword(newPass);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-white text-[10px] font-mono cursor-pointer"
                    >
                      Regen
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">EMAIL ENDPOINT</label>
                  <input 
                    type="email"
                    required
                    placeholder="e.g. partner@auroradigital.co"
                    value={directClientEmail}
                    onChange={(e) => setDirectClientEmail(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#cfd3db] mb-1">CONTACT PHONE</label>
                  <input 
                    type="tel"
                    placeholder="e.g. +977-9801234567"
                    value={directClientPhone}
                    onChange={(e) => setDirectClientPhone(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-white/55 mb-1">VENTURE SYSTEM PIPELINE NAME</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Solaris Tech Portal"
                    value={directClientProject}
                    onChange={(e) => setDirectClientProject(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#cfd3db] mb-1">PARTNERSHIP PACKAGE TARGET</label>
                  <select 
                    value={directClientPlan}
                    onChange={(e) => setDirectClientPlan(e.target.value)}
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white text-xs"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.name}>{p.name} Tier ({p.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-secondary font-bold mb-1 flex justify-between items-center">
                  <span>Assigned Custom SLA features checklist</span>
                  <span className="text-[8px] text-white/30 lowercase italic">one feature per line</span>
                </label>
                <textarea 
                  placeholder="UI/UX Design Concepts&#10;Vite Build Integrations&#10;Continuous SLA Sprints..."
                  value={directClientCustomFeaturesText}
                  onChange={(e) => setDirectClientCustomFeaturesText(e.target.value)}
                  rows={4}
                  className="w-full bg-[#0a0d16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary text-xs font-sans whitespace-pre-wrap leading-relaxed"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-orange-950 font-black tracking-widest font-mono text-xs rounded-xl hover:brightness-110 shadow-lg cursor-pointer"
              >
                DEPLOY PARTNER CREDENTIALS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG MODEL 5: DETAILED INTAKE INQUIRY & REPLY */}
      {selectedViewingMessage && (
        <div className="fixed inset-0 bg-[#000]/85 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#121626] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setSelectedViewingMessage(null)}
              className="absolute top-4 right-4 text-white/45 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                  INQUIRY DETAILS
                </span>
                {reviewedMessageIds.includes(selectedViewingMessage.id) && (
                  <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                    Reviewed ✓
                  </span>
                )}
                {selectedViewingMessage.isClientMessage && (
                  <span className="text-[9px] font-mono bg-secondary/15 text-secondary border border-secondary/20 px-2 py-0.5 rounded font-bold uppercase">
                    Partner Sync
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white font-mono mt-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" /> {selectedViewingMessage.senderName}
              </h3>
              <p className="text-xs text-white/40 mt-0.5 font-mono">
                {selectedViewingMessage.email} &bull; {selectedViewingMessage.senderRole || 'Generic Client'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Core inquiry message block */}
              <div className="bg-[#0a0d16] p-5 rounded-2xl border border-white/5 space-y-3">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">Inbound Brief</p>
                <p className="text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap">{selectedViewingMessage.previewText}</p>
                {selectedViewingMessage.createdAt && (
                  <p className="text-[9px] font-mono text-white/30 text-right">Received At: {new Date(selectedViewingMessage.createdAt).toLocaleString()}</p>
                )}
              </div>

              {/* Replies chronological log */}
              <div className="space-y-3">
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Chronological replies ({selectedViewingMessage.replies?.length || 0})</p>
                
                {(!selectedViewingMessage.replies || selectedViewingMessage.replies.length === 0) ? (
                  <p className="text-[10px] text-white/30 font-mono italic px-2">No preceding liaison communications transmitted yet.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedViewingMessage.replies.map((rep, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs font-sans text-white/95 relative">
                        <p className="font-mono text-[9px] uppercase text-secondary font-black tracking-widest mb-1">Diyo Operator Transmission:</p>
                        <p className="leading-relaxed">{rep}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Directly submit reply */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const txt = messageReplyText[selectedViewingMessage.id];
                  if (!txt?.trim()) return;
                  
                  // Post reply to Storage
                  replyToMessage(selectedViewingMessage.id, txt.trim());
                  
                  // Update local modal view instantly
                  setSelectedViewingMessage(prev => prev ? {
                    ...prev,
                    unread: false,
                    replies: [...(prev.replies || []), txt.trim()]
                  } : null);

                  setMessageReplyText({...messageReplyText, [selectedViewingMessage.id]: ''});
                  triggerToast('Reply posted live to collaborator view dashboard.');
                }}
                className="space-y-3 pt-3 border-t border-white/5"
              >
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-secondary font-black mb-1">Transmit response</label>
                  <textarea 
                    rows={3}
                    required
                    value={messageReplyText[selectedViewingMessage.id] || ''}
                    onChange={(e) => setMessageReplyText({...messageReplyText, [selectedViewingMessage.id]: e.target.value})}
                    placeholder="Provide developer feedback, pricing response or next-step SLA schedule..."
                    className="w-full bg-[#0a0d16] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-primary placeholder-white/20"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleArchiveMessage(selectedViewingMessage.id);
                        setSelectedViewingMessage(null); // auto-close details to reflect archive action immediately
                      }}
                      className="px-4 py-2 bg-[#171b26] border border-white/5 hover:border-white/10 text-xs font-mono text-white/70 rounded-xl hover:text-white cursor-pointer hover:bg-white/5 transition-all text-center flex-1 sm:flex-initial"
                    >
                      {archivedMessageIds.includes(selectedViewingMessage.id) ? 'Unarchive Brief' : 'Archive Brief'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleMarkReviewed(selectedViewingMessage.id, selectedViewingMessage.senderName, selectedViewingMessage.email);
                        setSelectedViewingMessage(null); // auto-close details to reflect action immediately
                      }}
                      disabled={reviewedMessageIds.includes(selectedViewingMessage.id)}
                      className={`px-4 py-2 border text-xs font-mono rounded-xl transition-all text-center flex-1 sm:flex-initial ${
                        reviewedMessageIds.includes(selectedViewingMessage.id)
                          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 cursor-not-allowed opacity-85'
                          : 'bg-[#171b26] border-white/10 text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5 cursor-pointer'
                      }`}
                    >
                      {reviewedMessageIds.includes(selectedViewingMessage.id) ? 'Reviewed ✓' : 'Mark Reviewed & Notify'}
                    </button>
                  </div>

                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-orange-950 font-black tracking-wider font-mono text-xs rounded-xl hover:brightness-110 shadow-lg cursor-pointer text-center"
                  >
                    POST TRANSMISSION
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVITY TELEMETRY INSPECT MODAL */}
      {selectedInspectActivity && (
        <div className="fixed inset-0 bg-[#060810]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#121624] border border-white/10 overflow-hidden shadow-2xl relative animate-scaleIn">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0d101a]">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    Telemetry Diagnostic Log
                  </h4>
                  <p className="text-[10px] text-white/40 mt-0.5">SECURITY ACCESS LEVEL V1.0</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInspectActivity(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              
              {/* Event general identity card */}
              <div className="p-4 rounded-2xl bg-[#090b16] border border-white/5 space-y-3">
                <div className="flex justify-between items-center bg-[#070911] p-2 rounded-lg">
                  <span className="text-[9px] font-mono tracking-widest text-[#edc157] font-bold">EVENT PAYLOAD ID</span>
                  <span className="text-[9px] font-mono text-white/40">{selectedInspectActivity.id}</span>
                </div>
                <div>
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Action Outcome Decrypted</p>
                  <p className="text-xs font-bold text-white mt-1 font-sans">{selectedInspectActivity.title}</p>
                </div>
              </div>

              {/* Grid data */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#090b16] border border-white/5">
                  <span className="block text-[9px] font-mono text-white/30 uppercase">Timestamp (ISO)</span>
                  <span className="block font-mono text-white/80 font-bold mt-1 text-[9px] truncate">
                    {selectedInspectActivity.timestamp || new Date().toISOString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090b16] border border-white/5">
                  <span className="block text-[9px] font-mono text-white/30 uppercase">Relative Ingestion Time</span>
                  <span className="block font-mono text-white/80 font-bold mt-1 text-[10px]">
                    {selectedInspectActivity.relativeTime}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090b16] border border-white/5 col-span-2 bg-[#080a13]">
                  <span className="block text-[9px] font-mono text-white/30 uppercase">Client Actor Association</span>
                  <span className="block font-semibold text-white/90 mt-1">
                    {selectedInspectActivity.clientName ? (
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary uppercase text-[8px] font-mono font-bold border border-primary/20">
                        {selectedInspectActivity.clientName}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[8px] font-mono">
                        SYSTEM INITIATED EVENT
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Node status checklist */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] space-y-2">
                <span className="block text-[9px] font-mono text-white/35 uppercase tracking-wider font-bold">Node Assurance Metrics</span>
                <div className="flex justify-between items-center text-white/70">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Host Connection Secure</span>
                  <span className="font-mono text-emerald-400 text-[10px] font-bold">VERIFIED</span>
                </div>
                <div className="flex justify-between items-center text-white/70">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> Event Log Synchronized</span>
                  <span className="font-mono text-primary text-[10px] font-bold">REAL-TIME</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0d101a] border-t border-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedInspectActivity(null)}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-mono text-[10px] font-bold uppercase rounded-xl transition-all cursor-pointer border border-white/5"
              >
                Close Diagnostic View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
