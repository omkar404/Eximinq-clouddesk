import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Bell, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  MessageSquare, 
  ChevronRight, 
  Shield, 
  Briefcase, 
  DollarSign, 
  PieChart, 
  Activity, 
  Menu, 
  X, 
  LogOut, 
  Download, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Send, 
  UserCheck, 
  Building, 
  CreditCard, 
  Wallet, 
  Globe, 
  Lock,
  Layers, 
  Plus,
  Copy,
  Edit2,
  Trash2,
  FileCheck,
  AlertTriangle,
  Save,
  BarChart3,
  TrendingUp,
  Calendar,
  Flag,
  PenTool,
  Hash,
  FileBox,
  Megaphone,
  RefreshCw,
  FileInput,
  Folder,
  ChevronDown,
  Receipt,
  Landmark,
  UploadCloud,
  ChevronUp,
  AlertOctagon,
  Wrench
} from 'lucide-react';

// --- MOCK DATA ---

const ADMIN_STATS = {
  totalRevenue: '₹ 1.2 Cr',
  revenueGrowth: '+12.5%',
  activeClients: 142,
  pendingRequests: 18,
  avgSlaCompliance: '94%',
  systemHealth: 'Optimal',
  agentsOnline: 8
};

const COMPLIANCE_AUDITS_DB = [
  {
    clientId: 'C-001',
    clientName: 'Acme Exports Pvt Ltd',
    score: 72,
    riskLevel: 'Medium',
    financialRisk: 1250000,
    lastAuditDate: 'Oct 25, 2025',
    categories: [
      { name: 'DGFT Licensing', score: 90, status: 'Good' },
      { name: 'Customs / e-BRC', score: 45, status: 'Critical' },
      { name: 'GST / LUT', score: 95, status: 'Excellent' }
    ],
    findings: [
      { id: 1, severity: 'High', area: 'Export Obligation', issue: '3 EPCG Licenses Expired without EODC', impact: '₹ 8.5 Lakhs Penalty', status: 'Open' },
      { id: 2, severity: 'High', area: 'Banking (e-BRC)', issue: '12 Shipping Bills > 9 months pending', impact: 'Caution Listing Risk', status: 'Open' },
      { id: 3, severity: 'Medium', area: 'Incentives', issue: 'RoDTEP not claimed for HS 8504', impact: '₹ 2.1 Lakhs Loss', status: 'In Progress' }
    ]
  },
  {
    clientId: 'C-002',
    clientName: 'Global Traders Inc',
    score: 45,
    riskLevel: 'High',
    financialRisk: 4500000,
    lastAuditDate: 'Oct 20, 2025',
    categories: [
      { name: 'DGFT Licensing', score: 30, status: 'Critical' },
      { name: 'Customs / e-BRC', score: 50, status: 'Risk' },
      { name: 'GST / LUT', score: 60, status: 'Fair' }
    ],
    findings: [
      { id: 1, severity: 'Critical', area: 'Advance Auth', issue: 'Unaccounted Imports vs Exports', impact: '₹ 35 Lakhs Duty + Interest', status: 'Open' },
      { id: 2, severity: 'High', area: 'GST', issue: 'ITC Mismatch in 3B vs 2A', impact: 'Notice Received', status: 'Open' }
    ]
  }
];

const AGENTS_DB = [
  { 
    id: 'A-001', name: 'Rahul S.', role: 'Senior Ops', activeTasks: 12, completedThisMonth: 45, productivity: 94, avgCompletionTime: '1.2 Days', rating: 4.8, status: 'Online',
    tasks: [
      { 
          id: 'REQ-1001', service: 'EPCG License', client: 'Acme Exports', status: 'In Process', sla: 'On Track', due: '2 Days',
          clientDocs: [
              { name: 'Proforma_Invoice.pdf', date: 'Oct 26, 2025' },
              { name: 'Nexus_Certificate.pdf', date: 'Oct 26, 2025' }
          ]
      },
      { 
          id: 'REQ-1008', service: 'AA Closure', client: 'Acme Exports', status: 'Needs Clarification', sla: 'Delayed', due: 'Overdue 4h',
          clientDocs: [
              { name: 'AA_Original_License.pdf', date: 'Oct 28, 2025' }
          ]
      },
    ]
  },
  { 
    id: 'A-002', name: 'Vikram Singh', role: 'Licensing Expert', activeTasks: 8, completedThisMonth: 32, productivity: 88, avgCompletionTime: '2.5 Days', rating: 4.5, status: 'Busy',
    tasks: [
      { 
          id: 'REQ-1004', service: 'SCOMET', client: 'Global Traders', status: 'Submitted', sla: 'On Track', due: '5 Days',
          clientDocs: [
              { name: 'End_User_Certificate.pdf', date: 'Oct 20, 2025' },
              { name: 'Tech_Specs.pdf', date: 'Oct 20, 2025' }
          ]
      },
    ]
  },
  { id: 'A-003', name: 'Priya M.', role: 'Legal Consultant', activeTasks: 15, completedThisMonth: 28, productivity: 96, avgCompletionTime: '3.0 Days', rating: 4.9, status: 'Online', tasks: [] },
  { id: 'A-004', name: 'Auto-Bot', role: 'Automation', activeTasks: 120, completedThisMonth: 500, productivity: 100, avgCompletionTime: '0.01 Days', rating: 5.0, status: 'Online', tasks: [] },
];

const CLIENTS_DB = [
  { 
    id: 'C-001', 
    name: 'Acme Exports Pvt Ltd', 
    iec: '0588291022',
    type: 'Private Limited',
    tier: 'Platinum', 
    walletBalance: 42500, 
    creditLimit: 500000, 
    creditUsed: 125000, 
    email: 'compliance@acmeexports.com',
    phone: '+91 98765 43210',
    address: 'Plot 42, MIDC, Mumbai',
    status: 'Active',
    riskScore: 72,
    serviceStats: { submitted: 15, inProcess: 5, completed: 120, needsAction: 2 },
    monthlyUsage: [24, 30, 45, 32, 28, 50],
    statutory: {
        pan: 'AAZCS1234K',
        gst: '27AAZCS1234K1Z5',
        rcmc: 'EPC/ENG/2024/99 (EEPC)',
        msme: 'UDYAM-MH-03-001292'
    },
    credentials: [
      { id: 1, portal: 'DGFT', username: 'acme_dgft', password: 'Password123!', lastLogin: 'Yesterday' },
      { id: 2, portal: 'ICEGATE', username: 'acme_ice', password: 'IcePassword!', lastLogin: '2 days ago' },
      { id: 3, portal: 'Eximinq Portal', username: 'acme_admin', password: 'TempUser@2025', lastLogin: 'Today' }
    ],
    branches: [
        { id: 1, name: 'Mumbai HO', gst: '27AAZCS...' },
        { id: 2, name: 'Pune Factory', gst: '27AAZCS...' }
    ]
  },
  { 
    id: 'C-002', 
    name: 'Global Traders Inc', 
    iec: '0339921211', 
    type: 'Partnership', 
    tier: 'Gold', 
    walletBalance: 1200, 
    creditLimit: 200000, 
    creditUsed: 190000, 
    status: 'Risk', 
    riskScore: 45, 
    serviceStats: { submitted: 8, inProcess: 2, completed: 45, needsAction: 5 },
    monthlyUsage: [10, 12, 15, 18, 20, 22],
    credentials: [] 
  },
];

const VAULT_FOLDERS = [
  { id: 1, name: 'Shipping Bills', count: 842, type: 'folder' },
  { id: 2, name: 'Bill of Entries', count: 315, type: 'folder' },
  { id: 3, name: 'Active Licenses', count: 12, type: 'folder' },
  { id: 4, name: 'Bank e-BRCs', count: 650, type: 'folder' },
];

const VAULT_FILES = {
  1: [
    { 
      id: 'SB-1001', name: 'SB_4276784.pdf', date: 'Aug 05, 2020', size: '1.2 MB', status: 'Verified', dataEntered: true,
      details: { sb_no: '4276784', sb_date: '05-Aug-2020', fob: 'USD 20,700', port: 'INCOK1', invoice: 'BLL/EX-40', dbk: '₹ 0', igst: 'LUT', rodtep: '₹ 0', license: '1010060567', ebrc: 'Pending' }
    },
    { 
      id: 'SB-1002', name: 'SB_992813.pdf', date: 'Oct 24, 2025', size: '1.1 MB', status: 'Pending e-BRC', dataEntered: false,
      details: { sb_no: '992813', sb_date: '24-Oct-2025', fob: 'USD 12,000', port: 'Mundra', invoice: 'INV-2025-002', dbk: '₹ 3,100', igst: 'LUT', rodtep: '₹ 950', license: 'Adv Auth: AA-992', ebrc: 'Pending' }
    },
  ],
  2: [
    {
      id: 'BE-2001', name: 'BE_9493099.pdf', date: 'Nov 08, 2020', size: '2.0 MB', status: 'Cleared', dataEntered: true,
      details: { boe_no: '9493099', boe_date: '08-Nov-2020', fob: 'USD 14,212', port: 'INCOK1', invoice: 'BB200820', dbk: '-', igst: '₹ 0', rodtep: '-', duty_paid: '₹ 0', license: '1010060567', ebrc: '-' }
    },
  ],
  3: [
    { 
      id: 'LIC-001', name: 'EPCG_02291.pdf', date: 'Sep 10, 2024', size: '2.5 MB', status: 'Active', dataEntered: true,
      details: { lic_no: '0229100042', lic_date: '10-Sep-2024', type: 'EPCG', duty_saved: '₹ 45,00,000', obligation: 'USD 3,21,428', validity: '10-Sep-2030', status: 'Active - 1st Block' }
    },
    { 
      id: 'LIC-002', name: 'AA_1011000666.pdf', date: 'Dec 02, 2021', size: '1.8 MB', status: 'Active', dataEntered: true,
      details: { lic_no: '1011000666', lic_date: '02-Dec-2021', type: 'Adv Auth', duty_saved: '₹ 95,404,926', obligation: 'USD 1,509,196', validity: '02-Jun-2023', status: 'Expired' }
    },
  ]
};

const MASTER_REQUESTS = [
  { 
    id: 'REQ-2025-1008', clientId: 'C-001', clientName: 'Acme Exports', service: 'Advance Auth Closure', category: 'Licensing', status: 'Needs Clarification', priority: 'High', assignee: 'Rahul S.', 
    submissionTime: '2025-10-28T09:00:00', slaHours: 48, cost: 5000, isBilled: false, documents: [{ id: 1, type: 'EODC', docNo: 'EODC-9921', date: '2025-10-20', status: 'Blurry', name: 'eodc_scan.pdf' }], messages: [],
    outputs: []
  },
  { 
    id: 'REQ-2025-1001', clientId: 'C-001', clientName: 'Acme Exports', service: 'EPCG License', category: 'Licensing', status: 'Approval Pending', priority: 'Medium', assignee: 'Rahul S.', 
    submissionTime: '2025-10-26T14:30:00', slaHours: 72, cost: 10000, isBilled: false, documents: [], messages: [], outputs: []
  },
  { 
    id: 'REQ-2025-1009', clientId: 'C-002', clientName: 'Global Traders', service: 'Certificate of Origin', category: 'Transactional', status: 'Completed', priority: 'Low', assignee: 'Auto-Bot', 
    submissionTime: '2025-10-29T09:15:00', slaHours: 4, cost: 800, isBilled: true, documents: [], messages: [], 
    outputs: [{id: 1, name: 'Final_CoO_Certificate.pdf', type: 'Certificate', docNo: 'COO-2025-001', date: '2025-10-29'}]
  },
  { 
    id: 'REQ-2025-1015', clientId: 'C-001', clientName: 'Acme Exports', service: 'Legal Reply (SCN)', category: 'Legal', status: 'Completed', priority: 'High', assignee: 'Priya M.', 
    submissionTime: '2025-10-25T14:00:00', slaHours: 72, cost: 15000, isBilled: false, documents: [], messages: [], outputs: []
  },
  { 
    id: 'REQ-2025-1016', clientId: 'C-001', clientName: 'Acme Exports', service: 'RoDTEP Scrip Issuance', category: 'Schemes', status: 'Submitted', priority: 'Medium', assignee: 'Unassigned', 
    submissionTime: '2025-10-30T10:00:00', slaHours: 24, cost: 2500, isBilled: false, documents: [], messages: [], outputs: []
  }
];

const COMPLIANCE_FIX_REQUESTS = [
    { id: 'FIX-9001', clientId: 'C-001', clientName: 'Acme Exports', issue: 'EPCG EODC Pending', source: 'Audit Report', status: 'Quote Required', requestedDate: 'Oct 28, 2025', description: 'Lic No 02291 expired. Client requests closure services.' },
    { id: 'FIX-9002', clientId: 'C-002', clientName: 'Global Traders', issue: 'e-BRC Pending > 9 months', source: 'Schemes Analytics', status: 'Quote Sent', requestedDate: 'Oct 27, 2025', description: 'Assistance needed for bank realization of 12 SBs.' }
];

const MASTER_QUOTES = [
    { id: 'Q-2025-001', client: 'Global Traders', service: 'AEO T2 Certification', category: 'Licensing', amount: 50000, date: 'Oct 28, 2025', status: 'Pending Approval', description: 'Complete end-to-end AEO T2 certification including site audit.' },
    { id: 'Q-2025-002', client: 'Acme Exports', service: 'Legal Reply (High Court)', category: 'Legal', amount: 75000, date: 'Oct 29, 2025', status: 'Pending Approval', description: 'Drafting and filing writ petition.' },
    { id: 'Q-2025-003', client: 'TechFlow', service: 'SCOMET', category: 'Licensing', amount: 35000, date: 'Oct 25, 2025', status: 'Approved', description: 'SCOMET Application' }
];

const RECENT_TRANSACTIONS = [
  { id: 'TX-9912', client: 'Acme Exports', type: 'Credit', amount: 15000, date: '2025-10-28', method: 'Wallet Top-up', service: 'Wallet Top-up' },
  { id: 'TX-9913', client: 'Global Traders', type: 'Debit', amount: 800, date: '2025-10-28', method: 'Wallet Usage', service: 'Certificate of Origin' },
  { id: 'TX-9914', client: 'Acme Exports', type: 'Debit', amount: 5000, date: '2025-10-27', method: 'Credit Line', service: 'Advisory' },
  { id: 'TX-9915', client: 'TechFlow', type: 'Debit', amount: 1200, date: '2025-10-25', method: 'Wallet Usage', service: 'IEC Update' },
];

const INITIAL_INVOICES = [
  { id: 'INV-1001', client: 'Acme Exports', reqNo: 'REQ-2025-1002', service: 'Certificate of Origin', category: 'Transactional', date: '2025-10-27', amount: 800, status: 'Paid', mode: 'Wallet', dueDate: '-', details: [{item: 'Professional Fees', cost: 600}, {item: 'Govt Fees', cost: 100}, {item: 'GST (18%)', cost: 100}] },
  { id: 'INV-1002', client: 'Global Traders', reqNo: 'REQ-2025-1005', service: 'AD Code Reg', category: 'Transactional', date: '2025-10-22', amount: 2500, status: 'Paid', mode: 'Credit Line', dueDate: '-', details: [{item: 'Professional Fees', cost: 2000}, {item: 'GST (18%)', cost: 500}] },
  { id: 'INV-1003', client: 'Acme Exports', reqNo: 'REQ-2025-1006', service: 'RoDTEP Audit', category: 'Audit', date: '2025-10-10', amount: 5000, status: 'Unpaid', mode: '-', dueDate: '2025-11-10', details: [{item: 'Audit Fees', cost: 5000}] },
];

// --- HELPERS ---

const calculateSlaStatus = (submissionTime, slaHours) => {
    const start = new Date(submissionTime);
    const mockNow = new Date('2025-10-30T12:00:00'); 
    const diffMs = mockNow - start;
    const diffHrs = diffMs / (1000 * 60 * 60);
    const remaining = slaHours - diffHrs;

    if (remaining < 0) return { status: 'Breached', label: `${Math.abs(Math.round(remaining))}h Overdue`, color: 'text-red-600 bg-red-50 border-red-100' };
    if (remaining < 4) return { status: 'Risk', label: `${Math.round(remaining)}h Left`, color: 'text-orange-600 bg-orange-50 border-orange-100' };
    return { status: 'On Track', label: `${Math.round(remaining)}h Left`, color: 'text-green-600 bg-green-50 border-green-100' };
};

// --- SHARED COMPONENTS ---

const StatusBadge = ({ status }) => {
  const styles = {
    'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Paid': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Approved': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Active': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Good': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Excellent': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Submitted': 'bg-blue-50 text-blue-700 border-blue-200',
    'In Process': 'bg-blue-100 text-blue-800 border-blue-200',
    'Drafting': 'bg-slate-100 text-slate-600 border-slate-200',
    'Approval Pending': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Pending Approval': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Needs Clarification': 'bg-orange-50 text-orange-700 border-orange-200',
    'Risk': 'bg-red-50 text-red-700 border-red-200',
    'Critical': 'bg-red-50 text-red-700 border-red-200',
    'High': 'bg-orange-100 text-orange-700 border-orange-200',
    'Medium': 'bg-amber-100 text-amber-700 border-amber-200',
    'Online': 'bg-green-100 text-green-700 border-green-200',
    'Busy': 'bg-amber-100 text-amber-700 border-amber-200',
    'Unpaid': 'bg-red-50 text-red-700 border-red-200',
    'Open': 'bg-red-50 text-red-700 border-red-200',
    'Quote Required': 'bg-purple-100 text-purple-700 border-purple-200',
    'Quote Sent': 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded text-[11px] uppercase font-bold border tracking-wide ${styles[status] || styles['Drafting']}`}>
      {status}
    </span>
  );
};

const StatCard = ({ title, value, subtext, icon: Icon, color, actions }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>
    <div className="flex justify-between items-start mb-2 relative z-10">
      <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-50 text-blue-600' : color === 'purple' ? 'bg-purple-50 text-purple-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{title}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      
      {actions && (
          <div className="mt-4 flex gap-2">
              {actions}
          </div>
      )}
    </div>
  </div>
);

const SidebarItem = ({ id, label, icon: Icon, activeTab, setActiveTab, isSidebarOpen }) => (
  <button 
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
      activeTab === id 
      ? 'bg-slate-800 text-white border-blue-500' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-transparent'
    }`}
  >
    <Icon size={18} />
    {isSidebarOpen && <span>{label}</span>}
  </button>
);

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- SUB-VIEW COMPONENTS ---

const ComplianceAuditViewComponent = ({ setSelectedAudit }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Compliance Audit Overview</h2>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">
                <Plus size={16} /> New Audit
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMPLIANCE_AUDITS_DB.map(audit => (
                <div key={audit.clientId} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedAudit(audit)}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                                {audit.clientName.substring(0,1)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">{audit.clientName}</h3>
                                <p className="text-xs text-slate-500 font-mono">{audit.clientId}</p>
                            </div>
                        </div>
                        <StatusBadge status={audit.riskLevel} />
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${audit.score > 70 ? 'text-green-600' : 'text-red-600'}`}>{audit.score}</div>
                            <div className="text-xs text-slate-400">Health Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-slate-800">₹ {(audit.financialRisk/100000).toFixed(2)} L</div>
                            <div className="text-xs text-slate-400">Financial Risk</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {audit.categories.map((cat, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                                <span className="text-slate-600">{cat.name}</span>
                                <span className={`font-bold ${cat.status === 'Critical' ? 'text-red-600' : 'text-green-600'}`}>{cat.status}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                        <button className="text-blue-600 text-xs font-bold hover:underline">View Full Report</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

const WalletCreditDashboard = ({ requests }) => {
    const [filterClient, setFilterClient] = useState('All');
    const [filterService, setFilterService] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const unbilledTasks = requests.filter(r => r.status === 'Completed' && !r.isBilled);
    
    const filteredTransactions = RECENT_TRANSACTIONS.filter(tx => {
        const matchesClient = filterClient === 'All' || tx.client === filterClient;
        const matchesService = filterService === 'All' || tx.service.includes(filterService);
        const matchesDate = (!dateFrom || tx.date >= dateFrom) && (!dateTo || tx.date <= dateTo);
        return matchesClient && matchesService && matchesDate;
    });

    const totalUsage = filteredTransactions.reduce((acc, curr) => curr.type === 'Debit' ? acc + curr.amount : acc, 0);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Wallet & Credit Analytics</h2>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Client</label>
                    <select className="w-full text-sm border p-2 rounded bg-white text-slate-700" value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                        <option value="All">All Clients</option>
                        {CLIENTS_DB.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Service</label>
                    <select className="w-full text-sm border p-2 rounded bg-white text-slate-700" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                        <option value="All">All Services</option>
                        <option value="Certificate">Certificates</option>
                        <option value="License">Licensing</option>
                        <option value="Legal">Legal</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">From</label>
                    <input type="date" className="text-sm border p-2 rounded text-slate-700" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">To</label>
                    <input type="date" className="text-sm border p-2 rounded text-slate-700" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={24} /></div>
                            <div><h3 className="font-bold text-slate-800">Usage Summary</h3><p className="text-xs text-slate-500">Based on filters</p></div>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 mb-2">₹ {totalUsage.toLocaleString()}</div>
                    <p className="text-xs text-slate-500">Total consumption in period</p>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
                        <h3 className="font-bold text-amber-900 text-sm">Completed Tasks Pending Billing</h3>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-2">Client</th>
                                    <th className="px-4 py-2">Service</th>
                                    <th className="px-4 py-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {unbilledTasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="px-4 py-2 text-xs">{task.clientName}</td>
                                        <td className="px-4 py-2 text-xs">{task.service}</td>
                                        <td className="px-4 py-2 text-right">
                                            <button className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold">Invoice</button>
                                        </td>
                                    </tr>
                                ))}
                                {unbilledTasks.length === 0 && (
                                    <tr><td colSpan="3" className="text-center py-4 text-slate-400 italic">No pending tasks.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">Usage Logs</h3>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Service</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTransactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-mono text-xs">{tx.id}</td>
                                <td className="px-6 py-3">{tx.client}</td>
                                <td className="px-6 py-3 text-slate-500">{tx.date}</td>
                                <td className="px-6 py-3">{tx.service}</td>
                                <td className="px-6 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tx.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tx.type}</span></td>
                                <td className={`px-6 py-3 text-right font-bold ${tx.type === 'Credit' ? 'text-green-600' : 'text-slate-800'}`}>
                                    {tx.type === 'Credit' ? '+' : '-'} {tx.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const InvoiceBillingDashboard = ({ invoices }) => {
    const [period, setPeriod] = useState('Monthly');
    const [filterClient, setFilterClient] = useState('All');
    const [filterServiceCat, setFilterServiceCat] = useState('All');
    const [expandedInvoice, setExpandedInvoice] = useState(null);

    const filteredInvoices = invoices.filter(inv => {
        const matchesClient = filterClient === 'All' || inv.client === filterClient;
        const matchesCat = filterServiceCat === 'All' || inv.category === filterServiceCat;
        return matchesClient && matchesCat;
    });

    const totalDue = filteredInvoices.filter(i => i.status === 'Unpaid').reduce((acc, curr) => acc + curr.amount, 0);
    const totalPaid = filteredInvoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Invoice & Billing Analytics</h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                    {['Daily', 'Weekly', 'Monthly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-xs font-bold rounded ${period === p ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>{p}</button>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                <select className="text-sm border p-2 rounded bg-white text-slate-700" value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
                    <option value="All">All Clients</option>
                    {CLIENTS_DB.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select className="text-sm border p-2 rounded bg-white text-slate-700" value={filterServiceCat} onChange={(e) => setFilterServiceCat(e.target.value)}>
                    <option value="All">All Categories</option>
                    <option value="Licensing">Licensing</option>
                    <option value="Transactional">Transactional</option>
                    <option value="Legal">Legal</option>
                    <option value="Audit">Audit</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold">Outstanding (Filtered)</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-2">₹ {totalDue.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase font-bold">Collected (Filtered)</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-2">₹ {totalPaid.toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-end">
                    <div className="flex gap-2 items-end w-full h-12">
                        {[40, 70, 30, 80, 50, 90, 60].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-100 rounded-t h-full relative">
                                <div className="absolute bottom-0 w-full bg-blue-600 rounded-t" style={{height: `${h}%`}}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-3"></th>
                            <th className="px-6 py-3">Invoice ID</th>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Service</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInvoices.map(inv => (
                            <React.Fragment key={inv.id}>
                                <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)}>
                                    <td className="px-6 py-3 text-slate-400">
                                        {expandedInvoice === inv.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-slate-600">{inv.id}</td>
                                    <td className="px-6 py-3 font-medium">{inv.client}</td>
                                    <td className="px-6 py-3">{inv.service}</td>
                                    <td className="px-6 py-3 font-bold">₹ {inv.amount.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-slate-500">{inv.date}</td>
                                    <td className="px-6 py-3"><StatusBadge status={inv.status} /></td>
                                </tr>
                                {expandedInvoice === inv.id && (
                                    <tr className="bg-slate-50">
                                        <td colSpan="7" className="px-6 py-4">
                                            <div className="text-xs space-y-2">
                                                <p className="font-bold uppercase text-slate-500">Breakdown</p>
                                                {inv.details.map((d, i) => (
                                                    <div key={i} className="flex justify-between w-64">
                                                        <span>{d.item}</span>
                                                        <span className="font-mono">₹ {d.cost}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between w-64 pt-2 border-t border-slate-200 font-bold">
                                                    <span>Total</span>
                                                    <span>₹ {inv.amount}</span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DashboardViewComponent = ({ requests, quotes, setActiveTab, openQuoteModal, openActionModal }) => (
  <div className="space-y-6 animate-in fade-in">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="Revenue" 
        value={ADMIN_STATS.totalRevenue} 
        subtext={`${ADMIN_STATS.revenueGrowth} vs last month`} 
        icon={DollarSign} 
        color="blue" 
        actions={<button onClick={() => setActiveTab('finance_billing')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">View Invoices</button>} 
      />
      <StatCard title="Workforce" value={`${ADMIN_STATS.agentsOnline} Online`} subtext="Avg Productivity: 94%" icon={Users} color="purple" actions={<button onClick={() => setActiveTab('workforce')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">Track Agents</button>} />
      <StatCard title="Requests" value={requests.filter(r => r.status !== 'Completed').length} subtext="5 Critical SLA Risk" icon={Layers} color="amber" actions={<button onClick={() => setActiveTab('requests')} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200">Board</button>} />
      <StatCard title="System Health" value={ADMIN_STATS.systemHealth} subtext="DGFT API: 42ms Latency" icon={Activity} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
              <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider flex items-center gap-2"><PenTool size={16} /> Command Center Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => openActionModal('new_request')} className="p-3 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Plus size={18} /></div><span className="text-xs font-bold text-slate-700">New Request</span></button>
                  <button onClick={() => openActionModal('verify_client')} className="p-3 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"><UserCheck size={18} /></div><span className="text-xs font-bold text-slate-700">Verify Client</span></button>
                  <button onClick={() => openActionModal('broadcast')} className="p-3 border border-slate-200 rounded-lg hover:bg-amber-50 hover:border-amber-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"><Megaphone size={18} /></div><span className="text-xs font-bold text-slate-700">Broadcast</span></button>
                  <button onClick={() => openActionModal('bulk_import')} className="p-3 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><FileBox size={18} /></div><span className="text-xs font-bold text-slate-700">Bulk Import</span></button>
                  <button onClick={() => openActionModal('report')} className="p-3 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><FileText size={18} /></div><span className="text-xs font-bold text-slate-700">Generate Report</span></button>
                  <button onClick={() => openActionModal('rates')} className="p-3 border border-slate-200 rounded-lg hover:bg-pink-50 hover:border-pink-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center"><RefreshCw size={18} /></div><span className="text-xs font-bold text-slate-700">Update Rates</span></button>
                  <button onClick={() => openActionModal('alert')} className="p-3 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center"><AlertTriangle size={18} /></div><span className="text-xs font-bold text-slate-700">System Alert</span></button>
                  <button onClick={() => openActionModal('team')} className="p-3 border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-200 flex flex-col items-center gap-2 transition-colors"><div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center"><Users size={18} /></div><span className="text-xs font-bold text-slate-700">Team Meet</span></button>
              </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-blue-600" /> Recent Activity</h3><button onClick={() => setActiveTab('requests')} className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1">Expand All <ChevronRight size={14} /></button></div>
            <div className="divide-y divide-slate-100">
                {requests.slice(0, 4).map(req => (
                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                    <div className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{req.id}</div>
                    <div><h4 className="text-sm font-semibold text-slate-800">{req.service}</h4><p className="text-xs text-slate-500">{req.clientName}</p></div>
                    </div>
                    <StatusBadge status={req.status} />
                </div>
                ))}
            </div>
          </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Pending Quotes</h3><button onClick={openQuoteModal} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><ArrowUpRight size={16} /></button></div>
          <div className="space-y-3">
            {quotes.filter(q => q.status === 'Pending Approval').length > 0 ? quotes.filter(q => q.status === 'Pending Approval').map(quote => (
                <div key={quote.id} className="flex gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100"><FileCheck className="text-indigo-600 shrink-0" size={18} /><div className="flex-1"><p className="text-sm font-bold text-indigo-800">{quote.client}</p><p className="text-xs text-indigo-600 mt-1">{quote.service} - ₹{quote.amount.toLocaleString()}</p></div></div>
            )) : <p className="text-xs text-slate-400">No pending quotes.</p>}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const WorkforceViewComponent = ({ selectedAgent, setSelectedAgent }) => {
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState(null);
  const getFilteredTasks = (agent) => {
      if (taskStatusFilter === 'All') return agent.tasks;
      return agent.tasks.filter(t => t.status === taskStatusFilter);
  };
  return (
  <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800">Workforce & Productivity</h2><div className="flex gap-2"><button className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-medium">Daily</button><button className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium">Monthly</button></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {AGENTS_DB.map(agent => (
             <div key={agent.id} onClick={() => { setSelectedAgent(agent); setSelectedTask(null); }} className={`bg-white border cursor-pointer transition-all rounded-xl p-5 shadow-sm hover:shadow-md ${selectedAgent?.id === agent.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                 <div className="flex justify-between items-start mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">{agent.name.substring(0,1)}</div><div><h4 className="font-bold text-slate-800 text-sm">{agent.name}</h4><p className="text-xs text-slate-500">{agent.role}</p></div></div><StatusBadge status={agent.status} /></div>
                 <div className="space-y-3"><div><div className="flex justify-between text-xs mb-1"><span className="text-slate-500">Productivity</span><span className="font-bold text-slate-700">{agent.productivity}%</span></div><div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-blue-600 h-full rounded-full" style={{ width: `${agent.productivity}%` }}></div></div></div><div className="bg-slate-50 rounded-lg p-2 text-center mt-2"><p className="text-xs font-mono text-slate-500">Active Tasks: <span className="font-bold text-slate-800">{agent.activeTasks}</span></p></div></div>
             </div>
         ))}
      </div>
      {selectedAgent && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} /> Tasks: {selectedAgent.name}</h3><div className="flex items-center gap-2"><select value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} className="text-xs border border-slate-200 rounded p-1"><option value="All">All Tasks</option><option value="In Process">In Process</option><option value="Submitted">Submitted</option><option value="Needs Clarification">Clarification</option></select><button onClick={() => setSelectedAgent(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button></div></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>{getFilteredTasks(selectedAgent).length > 0 ? (<table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold"><tr><th className="px-4 py-2">Task ID</th><th className="px-4 py-2">Service</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Due</th></tr></thead><tbody>{getFilteredTasks(selectedAgent).map(task => (<tr key={task.id} onClick={() => setSelectedTask(task)} className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedTask?.id === task.id ? 'bg-blue-50' : ''}`}><td className="px-4 py-3 font-mono text-blue-600">{task.id}</td><td className="px-4 py-3"><div className="font-medium text-slate-800">{task.service}</div><div className="text-xs text-slate-500">{task.client}</div></td><td className="px-4 py-3"><StatusBadge status={task.status} /></td><td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${task.sla === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{task.due}</span></td></tr>))}</tbody></table>) : (<p className="text-slate-400 text-sm italic py-4 text-center">No tasks match the filter.</p>)}</div>
                  {selectedTask ? (<div className="border-l border-slate-100 pl-6 animate-in slide-in-from-right"><h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2"><FileText size={16} /> Client Documents ({selectedTask.clientDocs?.length || 0})</h4><div className="space-y-2 mb-4">{selectedTask.clientDocs && selectedTask.clientDocs.length > 0 ? (selectedTask.clientDocs.map((doc, idx) => (<div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-sm"><span className="text-slate-700">{doc.name}</span><span className="text-xs text-slate-400">{doc.date}</span></div>))) : (<p className="text-xs text-slate-400 italic">No documents attached.</p>)}</div><div className="bg-slate-50 p-3 rounded text-xs text-slate-500"><p><span className="font-bold">SLA Status:</span> {selectedTask.sla}</p><p><span className="font-bold">Client:</span> {selectedTask.client}</p></div></div>) : (<div className="flex items-center justify-center text-slate-400 text-sm italic border-l border-slate-100">Select a task to view details.</div>)}
              </div>
          </div>
      )}
  </div>
  );
};

const SmartVaultViewComponent = ({ currentVaultFolder, setCurrentVaultFolder, setVaultDocToEdit }) => (
  <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800">Client Portal Smart Vault (Admin Access)</h2><div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">Accessing Vault for:</span><select className="text-sm border border-slate-200 rounded-lg p-1.5 bg-white font-medium text-slate-800"><option>Acme Exports Pvt Ltd (C-001)</option><option>Global Traders (C-002)</option></select></div></div>
      {!currentVaultFolder ? (<div className="grid grid-cols-1 md:grid-cols-4 gap-6">{VAULT_FOLDERS.map(folder => (<div key={folder.id} onClick={() => setCurrentVaultFolder(folder)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"><div className="flex justify-between items-start mb-4"><Folder size={40} className="text-blue-100 group-hover:text-blue-500 transition-colors fill-current" /><span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{folder.count}</span></div><h3 className="font-bold text-slate-800 mb-1">{folder.name}</h3></div>))}</div>) : (
          <div className="space-y-4">
              <button onClick={() => setCurrentVaultFolder(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"><ArrowUpRight className="rotate-180" size={16} /> Back to Folders</button><h3 className="font-bold text-xl text-slate-800">{currentVaultFolder.name}</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase"><tr>{(currentVaultFolder.id === 1) && <th className="px-6 py-4">SB No & Date</th>}{(currentVaultFolder.id === 2) && <th className="px-6 py-4">BOE No & Date</th>}{(currentVaultFolder.id === 3) && <th className="px-6 py-4">License No & Date</th>}{(currentVaultFolder.id !== 1 && currentVaultFolder.id !== 2 && currentVaultFolder.id !== 3) && <th className="px-6 py-4">Document Name</th>}{(currentVaultFolder.id === 1 || currentVaultFolder.id === 2) ? (<><th className="px-6 py-4">Port & Invoice</th><th className="px-6 py-4">Value</th><th className="px-6 py-4">Financials & Duties</th><th className="px-6 py-4">License / Scheme</th>{currentVaultFolder.id === 1 && <th className="px-6 py-4">e-BRC</th>}</>) : currentVaultFolder.id === 3 ? (<><th className="px-6 py-4">Type & Validity</th><th className="px-6 py-4">Duty Saved</th><th className="px-6 py-4">Export Obligation</th><th className="px-6 py-4">Status</th></>) : (<><th className="px-6 py-4">Upload Date</th><th className="px-6 py-4">Size</th><th className="px-6 py-4">Status</th></>)}<th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{VAULT_FILES[currentVaultFolder.id]?.map(file => (<tr key={file.id} className="hover:bg-slate-50">{(currentVaultFolder.id === 1) && (<td className="px-6 py-4"><div className="font-bold text-slate-800 text-base">{file.details.sb_no}</div><div className="text-xs text-slate-500">{file.details.sb_date}</div></td>)}{(currentVaultFolder.id === 2) && (<td className="px-6 py-4"><div className="font-bold text-slate-800 text-base">{file.details.boe_no}</div><div className="text-xs text-slate-500">{file.details.boe_date}</div></td>)}{(currentVaultFolder.id === 3) && (<td className="px-6 py-4"><div className="font-bold text-slate-800 text-base">{file.details.lic_no}</div><div className="text-xs text-slate-500">{file.details.lic_date}</div></td>)}{(currentVaultFolder.id !== 1 && currentVaultFolder.id !== 2 && currentVaultFolder.id !== 3) && (<td className="px-6 py-4 font-medium text-slate-800"><div className="flex items-center gap-2"><FileText className="text-red-500 shrink-0" size={18} /> <div><div>{file.name}</div><div className="text-[10px] text-slate-400 font-normal">{file.date} • {file.size}</div></div></div></td>)}{(currentVaultFolder.id === 1 || currentVaultFolder.id === 2) ? (<><td className="px-6 py-4"><div className="font-bold text-slate-700">{file.details.port}</div><div className="text-xs text-slate-500 font-mono">Inv: {file.details.invoice}</div></td><td className="px-6 py-4"><div className="font-bold text-slate-800">{file.details.fob}</div><div className="text-[10px] text-slate-500 uppercase">FOB Value</div></td><td className="px-6 py-4 text-xs">{currentVaultFolder.id === 1 ? (<div className="space-y-1"><div className="flex justify-between gap-4"><span className="text-slate-500">DBK:</span> <span className="font-medium">{file.details.dbk}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">IGST:</span> <span className="font-medium">{file.details.igst}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">RoDTEP:</span> <span className="font-medium">{file.details.rodtep}</span></div></div>) : (<div className="space-y-1"><div className="flex justify-between gap-4"><span className="text-slate-500">Duty Paid:</span> <span className="font-bold text-red-600">{file.details.duty_paid}</span></div><div className="flex justify-between gap-4"><span className="text-slate-500">IGST:</span> <span className="font-medium">{file.details.igst}</span></div></div>)}</td><td className="px-6 py-4"><span className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded font-medium border border-purple-100">{file.details.license}</span></td>{currentVaultFolder.id === 1 && (<td className="px-6 py-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${file.details.ebrc.includes('Issued') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{file.details.ebrc}</span></td>)}</>) : currentVaultFolder.id === 3 ? (<><td className="px-6 py-4"><div className="font-medium text-slate-800">{file.details.type}</div><div className="text-xs text-slate-500">Valid till: {file.details.validity}</div></td><td className="px-6 py-4 font-bold text-green-700">{file.details.duty_saved}</td><td className="px-6 py-4 font-medium text-slate-700">{file.details.obligation}</td><td className="px-6 py-4"><StatusBadge status={file.details.status} /></td></>) : null}<td className="px-6 py-3 text-right"><button onClick={() => setVaultDocToEdit(file)} className="text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 flex items-center gap-1 ml-auto"><FileInput size={14} /> Input Data</button></td></tr>))}</tbody></table></div></div>
      )}
  </div>
);

const RequestsViewComponent = ({ requests, openChat, setSelectedRequest, handleSendQuote }) => {
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'compliance_fix'

    const filteredReqs = requests.filter(req => {
        const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
        const matchesCategory = filterCategory === 'All' || req.category === filterCategory;
        const matchesSearch = req.id.toLowerCase().includes(searchQuery.toLowerCase()) || req.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || req.clientId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesCategory && matchesSearch;
    });

    return (
        <div className="space-y-4 animate-in fade-in">
            {/* Toggle Header */}
            <div className="flex gap-4 border-b border-slate-200 pb-2 mb-2">
                <button onClick={() => setViewMode('active')} className={`pb-2 text-sm font-bold ${viewMode === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Active Requests</button>
                <button onClick={() => setViewMode('compliance_fix')} className={`pb-2 text-sm font-bold flex items-center gap-2 ${viewMode === 'compliance_fix' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-slate-500'}`}><Wrench size={14} /> Compliance Fix Requests</button>
            </div>

            {viewMode === 'active' ? (
                <>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center"><div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Search requests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" /></div><div className="flex items-center gap-2 w-full md:w-auto"><select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="All">All Categories</option><option value="Licensing">Licensing</option><option value="Transactional">Transactional</option><option value="Legal">Legal</option></select><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="All">All Status</option><option value="Submitted">Submitted</option><option value="Needs Clarification">Clarification</option><option value="Completed">Completed</option></select></div></div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider"><tr><th className="px-6 py-4">Request ID</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Service</th><th className="px-6 py-4">Submission Time</th><th className="px-6 py-4">SLA Tracker</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Issuance</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredReqs.map(req => {const sla = calculateSlaStatus(req.submissionTime, req.slaHours); return (<tr key={req.id} className="hover:bg-blue-50/30 transition-colors"><td className="px-6 py-4 font-mono font-medium text-blue-600">{req.id}</td><td className="px-6 py-4"><div className="font-medium text-slate-800">{req.clientName}</div><div className="text-xs text-slate-500 font-mono">{req.clientId}</div></td><td className="px-6 py-4"><div className="text-slate-800">{req.service}</div><div className="text-xs text-slate-400">{req.category}</div></td><td className="px-6 py-4 text-xs text-slate-500">{new Date(req.submissionTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td className="px-6 py-4"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sla.color} border border-transparent`}>{sla.label}</span></td><td className="px-6 py-4"><StatusBadge status={req.status} /></td><td className="px-6 py-4 text-xs font-mono">{req.outputs?.[0]?.docNo || '-'}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => openChat(req)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><MessageSquare size={16} /></button><button onClick={() => setSelectedRequest(req)} className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"><MoreVertical size={16} /></button></div></td></tr>);})}</tbody></table></div></div>
                </>
            ) : (
                // Compliance Fix Requests View
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-amber-50 flex items-center gap-2 text-amber-800">
                        <AlertOctagon size={18} /> <span className="font-bold text-sm">Discrepancy Fix Requests from Clients</span>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                            <tr><th className="px-6 py-4">Fix ID</th><th className="px-6 py-4">Client</th><th className="px-6 py-4">Issue Description</th><th className="px-6 py-4">Source</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {COMPLIANCE_FIX_REQUESTS.map(fix => (
                                <tr key={fix.id} className="hover:bg-amber-50/30">
                                    <td className="px-6 py-4 font-mono font-medium text-amber-700">{fix.id}</td>
                                    <td className="px-6 py-4"><div className="font-medium text-slate-800">{fix.clientName}</div><div className="text-xs text-slate-500 font-mono">{fix.clientId}</div></td>
                                    <td className="px-6 py-4"><div className="text-slate-800">{fix.issue}</div><div className="text-xs text-slate-500 truncate w-48" title={fix.description}>{fix.description}</div></td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded w-fit">{fix.source}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{fix.requestedDate}</td>
                                    <td className="px-6 py-4"><StatusBadge status={fix.status} /></td>
                                    <td className="px-6 py-4 text-right">
                                        {fix.status === 'Quote Required' ? (
                                            <button 
                                                onClick={() => handleSendQuote(fix)}
                                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 shadow-sm"
                                            >
                                                Send Quote
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Quote Sent</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const ClientsViewComponent = ({ clients, setIsNewClientModalOpen, setSelectedClient }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredClients = clients.filter(client => client.id.toLowerCase().includes(searchQuery.toLowerCase()) || client.name.toLowerCase().includes(searchQuery.toLowerCase()) || client.iec.includes(searchQuery));
    
    return (
      <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-slate-800">Client Management</h2><div className="flex gap-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search Client ID, Name, IEC..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-64" /></div><button onClick={() => setIsNewClientModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700"><Plus size={18} /> Add New Client</button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{filteredClients.map(client => (
              <div key={client.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">{client.name.substring(0,1)}</div>
                          <div><h3 className="font-bold text-slate-800 text-sm">{client.name}</h3><p className="text-xs text-slate-500 font-mono">{client.id}</p></div>
                      </div>
                      <StatusBadge status={client.status} />
                  </div>
                  <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Credit Limit</p>
                              <p className="font-bold text-slate-800">₹ {client.creditLimit.toLocaleString()}</p>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Wallet</p>
                              <p className="font-bold text-slate-800">₹ {client.walletBalance.toLocaleString()}</p>
                          </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                          <span>Active Requests: <b>{client.serviceStats?.inProcess || 0}</b></span>
                          <span>Risk: <b className={client.riskScore < 50 ? 'text-red-600' : 'text-green-600'}>{client.riskScore}/100</b></span>
                      </div>
                      <button onClick={() => setSelectedClient(client)} className="w-full bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">View Profile</button>
                  </div>
              </div>
          ))}</div>
      </div>
    );
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [requests, setRequests] = useState(MASTER_REQUESTS);
  const [quotes, setQuotes] = useState(MASTER_QUOTES);
  const [clients, setClients] = useState(CLIENTS_DB);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [complianceFixes, setComplianceFixes] = useState(COMPLIANCE_FIX_REQUESTS);
  
  // Selection States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState(null);
  
  // Vault & Data Input States
  const [currentVaultFolder, setCurrentVaultFolder] = useState(null);
  const [vaultDocToEdit, setVaultDocToEdit] = useState(null);
  
  // New Client Form State
  const [newClientData, setNewClientData] = useState({ name: '', email: '', phone: '', type: 'Private Limited' });
  const [generatedClientCreds, setGeneratedClientCreds] = useState(null);

  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quoteFilter, setQuoteFilter] = useState('All');
  
  // Function States
  const [clarificationNote, setClarificationNote] = useState('');
  const [showPassword, setShowPassword] = useState({});
  const [docFormData, setDocFormData] = useState({});
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // --- HANDLERS ---

  const handleStatusChange = (reqId, newStatus) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
    if (selectedRequest && selectedRequest.id === reqId) {
      setSelectedRequest(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleApproveQuote = (quote) => {
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, status: 'Approved' } : q));
      // Add to Requests
      const newReq = {
          id: `REQ-${Math.floor(Math.random()*10000)}`,
          clientId: 'C-002',
          clientName: quote.client,
          service: quote.service,
          category: quote.category || 'Compliance Fix',
          status: 'Submitted',
          priority: 'High',
          assignee: 'Unassigned',
          submissionTime: new Date().toISOString(),
          slaHours: 48,
          cost: quote.amount,
          isBilled: false,
          documents: [],
          outputs: [],
          messages: [{id: 1, sender: 'system', text: `Generated from approved quote ${quote.id}`}]
      };
      setRequests(prev => [newReq, ...prev]);
  };

  const handleSendQuoteForFix = (fix) => {
      // 1. Update Fix Status
      setComplianceFixes(prev => prev.map(f => f.id === fix.id ? { ...f, status: 'Quote Sent' } : f));
      // 2. Create Quote
      const newQuote = {
          id: `Q-${Math.floor(Math.random()*1000)}`,
          client: fix.clientName,
          service: `Compliance Fix: ${fix.issue}`,
          category: 'Compliance',
          amount: 15000, // Mock amount
          date: new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
          status: 'Pending Approval',
          description: fix.description
      };
      setQuotes(prev => [newQuote, ...prev]);
      setIsQuoteModalOpen(true); // Open modal to show it's added
  };

  const handleDocDataSave = () => {
      setVaultDocToEdit(null);
      setDocFormData({});
  };

  const handleCreateClient = (e) => {
      e.preventDefault();
      const newId = `C-${Math.floor(Math.random() * 10000)}`;
      const loginId = newClientData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.floor(Math.random()*100);
      const tempPass = Math.random().toString(36).slice(-8).toUpperCase();
      
      const newClient = {
          id: newId,
          name: newClientData.name,
          iec: 'PENDING',
          type: newClientData.type,
          tier: 'Silver',
          walletBalance: 0,
          creditLimit: 0,
          creditUsed: 0,
          status: 'Active',
          riskScore: 100, // Default safe
          serviceStats: { submitted: 0, inProcess: 0, completed: 0, needsAction: 0 },
          monthlyUsage: [0,0,0,0,0,0],
          statutory: {},
          credentials: [
              { id: Date.now(), portal: 'Eximinq Portal', username: loginId, password: tempPass, lastLogin: 'Never' }
          ],
          branches: []
      };
      
      setClients([...clients, newClient]);
      setGeneratedClientCreds({ id: newId, login: loginId, password: tempPass });
  };

  const openChat = (req) => {
    setSelectedRequest(req);
    setChatHistory(req.messages || []);
    setIsChatOpen(true);
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    const newMsg = { id: Date.now(), sender: 'admin', text: chatMessage };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, messages: updatedHistory } : r));
    setChatMessage('');
  };

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 font-sans">
      
      {/* Sidebar */}
      <aside className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0">A</div>
          {isSidebarOpen && <span className="ml-3 font-bold text-lg tracking-tight">Admin<span className="text-blue-500">Panel</span></span>}
        </div>

        <div className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <SidebarItem id="dashboard" label="Command Center" icon={LayoutDashboard} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          <SidebarItem id="workforce" label="Workforce" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          <SidebarItem id="requests" label="Request Board" icon={Layers} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          <SidebarItem id="clients" label="Client Management" icon={Building} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          <SidebarItem id="vault" label="Smart Vault" icon={FileBox} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          <SidebarItem id="wallet_usage" label="Wallet & Credit" icon={Wallet} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          <SidebarItem id="finance_billing" label="Invoice & Billing" icon={Receipt} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
          <SidebarItem id="audit" label="Compliance Audits" icon={Shield} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} />
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            {isSidebarOpen ? <ArrowDownLeft className="rotate-45" size={20} /> : <ArrowUpRight className="rotate-45" size={20} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 text-slate-900">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
          <h1 className="font-bold text-slate-800 text-xl capitalize">{activeTab.replace('_', ' ')}</h1>
          <div className="flex items-center gap-4">
             <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <div className="h-8 w-px bg-slate-200"></div>
             <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                   <p className="text-sm font-bold text-slate-800">Admin User</p>
                   <p className="text-xs text-slate-500">Super Admin</p>
                </div>
                <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold">AD</div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
           {activeTab === 'dashboard' && <DashboardViewComponent requests={requests} quotes={quotes} setActiveTab={setActiveTab} openQuoteModal={() => setIsQuoteModalOpen(true)} openActionModal={setActionModalType} />}
           {activeTab === 'workforce' && <WorkforceViewComponent selectedAgent={selectedAgent} setSelectedAgent={setSelectedAgent} />}
           {activeTab === 'requests' && <RequestsViewComponent requests={requests} openChat={openChat} setSelectedRequest={setSelectedRequest} handleSendQuote={handleSendQuoteForFix} />}
           {activeTab === 'vault' && <SmartVaultViewComponent currentVaultFolder={currentVaultFolder} setCurrentVaultFolder={setCurrentVaultFolder} setVaultDocToEdit={setVaultDocToEdit} />}
           {activeTab === 'clients' && <ClientsViewComponent clients={clients} setIsNewClientModalOpen={setIsNewClientModalOpen} setSelectedClient={setSelectedClient} />}
           {activeTab === 'wallet_usage' && <WalletCreditDashboard requests={requests} />}
           {activeTab === 'finance_billing' && <InvoiceBillingDashboard invoices={invoices} />}
           {activeTab === 'audit' && <ComplianceAuditViewComponent setSelectedAudit={setSelectedAudit} />}
        </div>
      </main>

      {/* MODAL: ADD NEW CLIENT */}
      <Modal isOpen={isNewClientModalOpen} onClose={() => { setIsNewClientModalOpen(false); setGeneratedClientCreds(null); }} title="Add New Client">
          {!generatedClientCreds ? (
              <form onSubmit={handleCreateClient} className="space-y-4">
                  <div><label className="text-sm font-bold text-slate-700">Company Name</label><input required type="text" className="w-full p-2 border border-slate-200 rounded mt-1 bg-white text-slate-800" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} placeholder="e.g. Alpha Exports" /></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm font-bold text-slate-700">Phone</label><input required type="text" className="w-full p-2 border border-slate-200 rounded mt-1 bg-white text-slate-800" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} placeholder="+91..." /></div>
                      <div><label className="text-sm font-bold text-slate-700">Type</label><select className="w-full p-2 border border-slate-200 rounded mt-1 bg-white text-slate-800" value={newClientData.type} onChange={e => setNewClientData({...newClientData, type: e.target.value})}><option value="Private Limited">Private Limited</option><option value="Partnership">Partnership</option><option value="Proprietorship">Proprietorship</option></select></div>
                  </div>
                  <div><label className="text-sm font-bold text-slate-700">Email</label><input required type="email" className="w-full p-2 border border-slate-200 rounded mt-1 bg-white text-slate-800" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} placeholder="admin@alpha.com" /></div>
                  <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 mt-4">Create Client Account</button>
              </form>
          ) : (
              <div className="space-y-4 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                  <h3 className="text-xl font-bold text-slate-800">Client Created Successfully!</h3>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 text-left space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500">Client ID:</span><span className="font-mono font-bold text-slate-800">{generatedClientCreds.id}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Login ID:</span><span className="font-mono font-bold text-blue-600">{generatedClientCreds.login}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Temp Password:</span><span className="font-mono font-bold text-red-600">{generatedClientCreds.password}</span></div>
                  </div>
                  <p className="text-xs text-slate-400">Share these credentials securely with the client.</p>
                  <button onClick={() => { setIsNewClientModalOpen(false); setGeneratedClientCreds(null); }} className="w-full bg-slate-800 text-white py-2 rounded font-bold hover:bg-slate-700">Close</button>
              </div>
          )}
      </Modal>

      {/* MODAL: ADMIN DATA INPUT FOR VAULT (Enhanced with Document Fields) */}
      <Modal isOpen={!!vaultDocToEdit} onClose={() => setVaultDocToEdit(null)} title="Data Entry & Audit Input">
          {vaultDocToEdit && (
              <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded flex items-center gap-3 border border-blue-100"><FileText size={20} className="text-blue-600" /><div className="text-sm"><p className="font-bold text-slate-800">{vaultDocToEdit.name}</p><p className="text-xs text-slate-500">Extraction for Analytics & Compliance</p></div></div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Document No</label><input type="text" className="w-full border p-1.5 rounded text-sm font-mono text-slate-800" defaultValue={vaultDocToEdit.details?.sb_no || vaultDocToEdit.details?.boe_no || vaultDocToEdit.details?.lic_no} /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Date</label><input type="text" className="w-full border p-1.5 rounded text-sm text-slate-800" defaultValue={vaultDocToEdit.details?.sb_date || vaultDocToEdit.details?.boe_date || vaultDocToEdit.details?.lic_date} /></div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 mt-2">Logistics & Valuation</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Port of Loading</label><input type="text" className="w-full border p-1.5 rounded text-sm text-slate-800" defaultValue={vaultDocToEdit.details?.port} placeholder="e.g. INNSA1" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Country Discharge</label><input type="text" className="w-full border p-1.5 rounded text-sm text-slate-800" placeholder="e.g. US" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">FOB Value (FC)</label><input type="number" className="w-full border p-1.5 rounded text-sm text-slate-800" defaultValue={vaultDocToEdit.details?.fob?.replace(/[^0-9.]/g, '')} placeholder="0.00" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Freight</label><input type="number" className="w-full border p-1.5 rounded text-sm text-slate-800" placeholder="0.00" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Insurance</label><input type="number" className="w-full border p-1.5 rounded text-sm text-slate-800" placeholder="0.00" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Exchange Rate</label><input type="number" className="w-full border p-1.5 rounded text-sm text-slate-800" placeholder="e.g. 84.50" /></div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 mt-2">Schemes & Benefits</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">Scheme Code</label><input type="text" className="w-full border p-1.5 rounded text-sm text-slate-800" placeholder="e.g. 19" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">License No</label><input type="text" className="w-full border p-1.5 rounded text-sm text-slate-800" defaultValue={vaultDocToEdit.details?.license} /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">DBK Amt (₹)</label><input type="number" className="w-full border p-1.5 rounded text-sm text-slate-800" defaultValue={vaultDocToEdit.details?.dbk?.replace(/[^0-9.]/g, '')} /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase">RoDTEP Amt (₹)</label><input type="number" className="w-full border p-1.5 rounded text-sm text-slate-800" defaultValue={vaultDocToEdit.details?.rodtep?.replace(/[^0-9.]/g, '')} /></div>
                  </div>
                  
                  <div className="pt-4 flex gap-3"><button onClick={() => setVaultDocToEdit(null)} className="flex-1 py-2 border border-slate-200 rounded text-slate-600 text-sm font-bold hover:bg-slate-50">Cancel</button><button onClick={handleDocDataSave} className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">Save & Calc Audit</button></div>
              </div>
          )}
      </Modal>

      {/* CLIENT PROFILE MODAL (Enhanced) */}
      <Modal isOpen={!!selectedClient} onClose={() => { setSelectedClient(null); setShowPassword({}); }} title="Client Profile" maxWidth="max-w-3xl">
         {selectedClient && (
            <div className="space-y-6">
               <div className="flex items-start justify-between pb-4 border-b border-slate-100"><div className="flex items-center gap-4"><div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-2xl">{selectedClient.name.substring(0,1)}</div><div><h3 className="font-bold text-slate-800 text-xl">{selectedClient.name}</h3><div className="flex items-center gap-3 mt-1"><span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">ID: {selectedClient.id}</span><span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">IEC: {selectedClient.iec}</span></div></div></div></div>
               
               {/* Credit Line Section */}
               <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 text-white flex justify-between items-center">
                   <div>
                       <p className="text-slate-400 text-xs uppercase font-bold">Available Credit Line</p>
                       <p className="text-2xl font-mono font-bold">₹ {(selectedClient.creditLimit - selectedClient.creditUsed).toLocaleString()}</p>
                       <p className="text-xs text-slate-500 mt-1">Total Limit: ₹ {selectedClient.creditLimit.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                       <p className="text-slate-400 text-xs uppercase font-bold">Wallet Balance</p>
                       <p className="text-xl font-mono font-bold text-blue-400">₹ {selectedClient.walletBalance.toLocaleString()}</p>
                   </div>
               </div>

               {/* Service Stats */}
               <div className="grid grid-cols-4 gap-4 text-center">
                   <div className="p-3 bg-blue-50 rounded-lg border border-blue-100"><p className="text-2xl font-bold text-blue-700">{selectedClient.serviceStats?.submitted || 0}</p><p className="text-[10px] text-blue-600 uppercase font-bold">Submitted</p></div>
                   <div className="p-3 bg-amber-50 rounded-lg border border-amber-100"><p className="text-2xl font-bold text-amber-700">{selectedClient.serviceStats?.inProcess || 0}</p><p className="text-[10px] text-amber-600 uppercase font-bold">In Process</p></div>
                   <div className="p-3 bg-green-50 rounded-lg border border-green-100"><p className="text-2xl font-bold text-green-700">{selectedClient.serviceStats?.completed || 0}</p><p className="text-[10px] text-green-600 uppercase font-bold">Completed</p></div>
                   <div className="p-3 bg-red-50 rounded-lg border border-red-100"><p className="text-2xl font-bold text-red-700">{selectedClient.serviceStats?.needsAction || 0}</p><p className="text-[10px] text-red-600 uppercase font-bold">Action Req</p></div>
               </div>

               {/* Monthly Usage Graph (Mock) */}
               <div>
                   <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2"><TrendingUp size={16} /> Monthly Service Usage</h4>
                   <div className="flex items-end h-24 gap-2 border-b border-slate-200 pb-2 px-2">
                       {selectedClient.monthlyUsage?.map((count, i) => (
                           <div key={i} className="flex-1 bg-slate-100 rounded-t hover:bg-blue-200 transition-colors relative group">
                               <div className="absolute bottom-0 w-full bg-blue-600 rounded-t" style={{height: `${count * 2}%`}}></div>
                               <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-slate-800 text-white px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                           </div>
                       ))}
                   </div>
                   <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-2"><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span></div>
               </div>

               {/* Standard Credentials & Statutory */}
               <div className="grid grid-cols-2 gap-4"><div className="p-3 border border-slate-200 rounded-lg"><p className="text-xs text-slate-500 uppercase">GSTIN</p><p className="font-mono font-bold text-slate-800">{selectedClient.statutory?.gst || 'N/A'}</p></div><div className="p-3 border border-slate-200 rounded-lg"><p className="text-xs text-slate-500 uppercase">PAN</p><p className="font-mono font-bold text-slate-800">{selectedClient.statutory?.pan || 'N/A'}</p></div></div>
               
               <div><h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Lock size={16} /> Portal Credentials</h4><div className="border border-slate-200 rounded-lg overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase"><tr><th className="px-4 py-2">Portal</th><th className="px-4 py-2">Username</th><th className="px-4 py-2">Password</th></tr></thead><tbody className="divide-y divide-slate-100">{selectedClient.credentials.map(cred => (<tr key={cred.id}><td className="px-4 py-3 font-medium">{cred.portal}</td><td className="px-4 py-3 font-mono text-slate-600">{cred.username}</td><td className="px-4 py-3 font-mono"><div className="flex items-center gap-2"><span>{showPassword[cred.id] ? cred.password : '••••••••'}</span><button onClick={() => setShowPassword({...showPassword, [cred.id]: !showPassword[cred.id]})} className="text-slate-400 hover:text-blue-600">{showPassword[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></td></tr>))}</tbody></table></div></div>
            </div>
         )}
      </Modal>

      {/* ... (Other Modals: Quote Management, Request Detail - implicitly included same as before) ... */}
      <Modal isOpen={!!selectedRequest && !isChatOpen} onClose={() => { setSelectedRequest(null); setClarificationNote(''); }} title={`Manage Request: ${selectedRequest?.id}`} maxWidth="max-w-4xl">
        {selectedRequest && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6"><div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100"><div><p className="text-slate-500 mb-1">Client ID</p><p className="font-mono font-bold text-blue-700">{selectedRequest.clientId}</p></div><div><p className="text-slate-500 mb-1">Service Type</p><p className="font-bold text-slate-800">{selectedRequest.service}</p></div><div><p className="text-slate-500 mb-1">Submission Time</p><p className="font-medium text-slate-800">{new Date(selectedRequest.submissionTime).toLocaleString()}</p></div><div><p className="text-slate-500 mb-1">Cost</p><p className="font-medium text-slate-800">₹ {selectedRequest.cost.toLocaleString()}</p></div></div><div><h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileCheck size={18} /> Smart Vault Documents</h4>{selectedRequest.documents && selectedRequest.documents.length > 0 ? (<div className="border border-slate-200 rounded-lg overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold"><tr><th className="px-4 py-2">Doc Type</th><th className="px-4 py-2">Ref No.</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{selectedRequest.documents.map(doc => (<tr key={doc.id}><td className="px-4 py-2 font-medium">{doc.type}</td><td className="px-4 py-2 font-mono text-xs">{doc.docNo}</td><td className="px-4 py-2 text-xs text-slate-500">{doc.date}</td><td className="px-4 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{doc.status}</span></td><td className="px-4 py-2 text-right text-blue-600 hover:underline cursor-pointer text-xs">View</td></tr>))}</tbody></table></div>) : <p className="text-slate-400 italic text-sm">No documents uploaded yet.</p>}</div>
            {/* Output Files Section */}
            {selectedRequest.status === 'Completed' && (
                <div>
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><UploadCloud size={18} /> Deliverables & Output</h4>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                        {selectedRequest.outputs && selectedRequest.outputs.length > 0 ? (
                            <div className="space-y-2">
                                {selectedRequest.outputs.map((out, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-green-100">
                                        <div>
                                            <p className="text-sm font-bold text-green-800">{out.name}</p>
                                            <p className="text-xs text-green-600 font-mono">{out.type} • {out.docNo}</p>
                                        </div>
                                        <button className="text-xs text-slate-500 hover:text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs text-green-700 italic mb-2">No output files uploaded yet.</p>}
                        
                        <div className="mt-4 pt-4 border-t border-green-200">
                            <label className="text-xs font-bold text-green-800 mb-1 block">Upload New Deliverable</label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input className="text-xs border p-1 rounded" placeholder="Doc No / Issuance No" />
                                <input type="date" className="text-xs border p-1 rounded" />
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-white border border-green-300 text-green-700 text-xs font-bold py-2 rounded hover:bg-green-100">Select File</button>
                                <button className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-700">Upload</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
            <div className="space-y-4"><div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"><label className="text-sm font-bold text-slate-700 block mb-2">Update Status</label><select value={selectedRequest.status} onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="Submitted">Submitted</option><option value="In Process">In Process</option><option value="Quote Requested">Quote Requested</option><option value="Approval Pending">Approval Pending</option><option value="Needs Clarification">Needs Clarification</option><option value="Completed">Completed</option></select>{selectedRequest.status === 'Needs Clarification' && (<div className="mt-4 animate-in fade-in"><label className="text-xs font-bold text-orange-700 mb-1 block">Required Details / Missing Docs</label><textarea value={clarificationNote} onChange={(e) => setClarificationNote(e.target.value)} className="w-full p-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 bg-orange-50 placeholder-orange-300" rows="3" placeholder="E.g., Please upload original EODC copy..." /></div>)}</div><div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><h4 className="text-sm font-bold text-blue-800 mb-2">Admin Actions</h4><div className="flex flex-col gap-2"><button className="w-full bg-white border border-blue-200 text-blue-700 py-2 rounded font-medium text-xs hover:bg-blue-100">Generate Invoice</button><button className="w-full bg-white border border-blue-200 text-blue-700 py-2 rounded font-medium text-xs hover:bg-blue-100">Upload Output Doc</button></div></div><button onClick={() => setSelectedRequest(null)} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800">Save Changes</button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!actionModalType} onClose={() => setActionModalType(null)} title={actionModalType?.replace('_', ' ').toUpperCase()} maxWidth="max-w-md">
          <div className="space-y-4">
              <p className="text-slate-600 text-sm">Action functionality placeholder for: <b>{actionModalType}</b></p>
              {actionModalType === 'broadcast' && <textarea className="w-full p-2 border border-slate-200 rounded text-sm" placeholder="Type broadcast message..." rows={3}></textarea>}
              <div className="flex justify-end gap-2 pt-2"><button onClick={() => setActionModalType(null)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded">Cancel</button><button onClick={() => setActionModalType(null)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Proceed</button></div>
          </div>
      </Modal>

      <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Quote Management" maxWidth="max-w-4xl">
          <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 mb-4"><div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center"><p className="text-xs font-bold text-slate-500 uppercase">Total Requested</p><p className="text-2xl font-bold text-slate-800">{quotes.length}</p></div><div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center"><p className="text-xs font-bold text-green-700 uppercase">Approved</p><p className="text-2xl font-bold text-green-800">{quotes.filter(q => q.status === 'Approved').length}</p></div><div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center"><p className="text-xs font-bold text-amber-700 uppercase">Pending Action</p><p className="text-2xl font-bold text-amber-800">{quotes.filter(q => q.status === 'Pending Approval').length}</p></div></div>
              <div className="flex justify-between items-center"><h4 className="font-bold text-slate-800">Requests</h4><select value={quoteFilter} onChange={(e) => setQuoteFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg p-2 bg-white"><option value="All">All Categories</option><option value="Licensing">Licensing</option><option value="Legal">Legal</option><option value="Transactional">Transactional</option></select></div>
              {quotes.filter(q => quoteFilter === 'All' || q.category === quoteFilter).map(quote => (<div key={quote.id} className="border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row gap-6 hover:shadow-sm transition-shadow"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><h3 className="font-bold text-slate-800 text-lg">{quote.service}</h3><span className={`text-xs px-2 py-0.5 rounded font-bold ${quote.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>{quote.status}</span><span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{quote.category}</span></div><p className="text-sm font-medium text-slate-600 mb-2">Client: {quote.client}</p><p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">{quote.description}</p></div><div className="flex flex-col items-end justify-center gap-3 min-w-[150px]"><div className="text-right"><p className="text-xs text-slate-400 uppercase font-bold">Quoted Amount</p><p className="text-2xl font-bold text-slate-800">₹ {quote.amount.toLocaleString()}</p></div>{quote.status !== 'Approved' && (<button onClick={() => handleApproveQuote(quote)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm w-full">Approve & Convert</button>)}</div></div>))}
              {quotes.length === 0 && <div className="text-center py-10 text-slate-400">No quotes found.</div>}
          </div>
      </Modal>

      {/* CHAT DRAWER */}
      {isChatOpen && selectedRequest && (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50"><div><h3 className="font-bold text-slate-800">Support Chat</h3><p className="text-xs text-blue-600 font-mono">{selectedRequest.id}</p></div><button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X size={20} /></button></div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">{chatHistory.length === 0 && <div className="text-center text-slate-400 text-sm py-8">No messages yet. Start a conversation.</div>}{chatHistory.map((msg, idx) => (<div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-xl text-sm shadow-sm ${msg.sender === 'admin' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>{msg.text}</div></div>))}</div>
          <div className="p-4 border-t border-slate-100 bg-white"><div className="flex gap-2"><input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()} placeholder="Type a reply..." className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /><button onClick={sendChatMessage} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Send size={20} /></button></div></div>
        </div>
      )}

    </div>
  );
}
