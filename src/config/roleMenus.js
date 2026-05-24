import {
  LayoutGrid,
  Users,
  Layers,
  Building,
  Database,
  Wallet,
  Receipt,
  Shield,
  ClipboardList,
  Workflow,
  Store,
  BarChart3,
  User
} from "lucide-react";

export const roleMenus = {

  ADMIN: [
    { name: "Command Center", path: "/admin/command-center", icon: LayoutGrid },
    { name: "Workforce", path: "/workforce", icon: Users },
    { name: "Request Board", path: "/requests", icon: Layers },
    { name: "Client Management", path: "/clients", icon: Building },
    { name: "Smart Vault", path: "/vault", icon: Database },
    { name: "Wallet & Credit", path: "/wallet", icon: Wallet },
    { name: "Invoice & Billing", path: "/billing", icon: Receipt },
    { name: "Compliance Audits", path: "/audit", icon: Shield }
  ],

  CLIENT: [
    { name: "Command Center", path: "/client/command-center", icon: LayoutGrid },
    { name: "Track Request", path: "/track-request", icon: ClipboardList },
    { name: "Active Workflows", path: "/active-workflows", icon: Workflow },
    { name: "Service Store", path: "/client/service-store", icon: Store },
    { name: "Compliance Audit", path: "/compliance-audit", icon: Shield },
    { name: "Schemes & Analytics", path: "/schemes-analytics", icon: BarChart3 },
    { name: "Smart Vault", path: "/smart-vault", icon: Database },
    { name: "Invoices & Billing", path: "/invoices-billing", icon: Receipt },
    { name: "Wallet", path: "/wallet", icon: Wallet },
    { name: "Company Profile", path: "/company-profile", icon: User }
  ],

  AGENT: [
    { name: "My Dashboard", path: "/agent/dashboard", icon: LayoutGrid },
    { name: "My Tasks", path: "/agent/tasks", icon: ClipboardList },
    { name: "Data Entry", path: "/agent/data-entry", icon: Database },
    { name: "Conduct Audits", path: "/agent/conduct-audits", icon: Shield }
  ]
};
