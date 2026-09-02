import { useAuth } from "../../context/useAuth";
import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { iconMap } from "../../utils/iconMap";
import {
  Building,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Factory,
  FileCheck,
  FileText,
  Folder,
  Globe,
  Landmark,
  LogOut,
  Scale,
  Shield,
  ShieldCheck,
  Store,
  Truck,
  Wallet
} from "lucide-react";
import Swal from "sweetalert2";
import BrandLogo from "../BrandLogo";

const QUICK_FORM_MENU = {
  id: "quick-form-menu",
  name: "Quick Form",
  path: "/client/company-profile-setup",
  parent_id: null,
  display_order: -1,
  children: []
};
const CLIENT_STATUTORY_PROFILE_MENU = { id:"statutory-profile", name:"Statutory Profile", path:"/client/statutory-profile", parent_id:null, display_order:90, children:[] };
const ADMIN_STATUTORY_PROFILE_MENU = { id:"admin-statutory-profile", name:"Statutory Profile", path:"/admin/statutory-profile", parent_id:null, display_order:90, children:[] };

const SERVICE_STORE_SEGMENT_ALIASES = {
  coo: "certificate-of-origin",
  "certificate-origin": "certificate-of-origin",
  "origin-certificate": "certificate-of-origin",
  certificateoforigin: "certificate-of-origin",
  iem: "iem-registration",
  "industrial-licence": "industrial-license",
  "wpc-licence": "wpc-license",
  "warehouse-licence": "warehouse-license",
  "epr-authorisation": "epr-authorization",
  "licensing-incentive": "licensing",
  "customs-portops": "logistics",
  "legal-audit": "dispute-resolution",
  "regulatory-bis": "registration"
};

function slugifySegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeServiceStoreSegment(segment) {
  const slug = slugifySegment(segment);

  if (!slug) {
    return "";
  }

  return SERVICE_STORE_SEGMENT_ALIASES[slug] || slug;
}

function getMenuNameKey(value) {
  return slugifySegment(value)
    .replace(/licence/g, "license")
    .replace(/customs-filing/g, "custom-filing")
    .replace(/iso-and-trademark/g, "iso-trademark");
}

const nameIconMap = {
  "service-store": Store,
  compliance: ShieldCheck,
  licensing: Landmark,
  registration: Building,
  incentives: Wallet,
  "custom-filing": FileText,
  "dispute-resolution": Scale,
  "iso-trademark": FileCheck,
  logistics: Truck,
  "iem-registration": Building,
  "industrial-license": Factory,
  "wpc-license": Globe,
  "un-iip-certificate": FileCheck,
  "gst-returns": FileText,
  "gst-return": FileText,
  "gst-lut-filing": FileText,
  "certificate-of-origin": FileText,
  "warehouse-license": Factory,
  "dsc-services": Shield,
  ebrc: FileCheck,
  "bulk-ebrc": ClipboardList,
  "igcr-return": ClipboardList,
  "pollution-control": Shield,
  "ca-certification": FileCheck,
  lmpc: Scale,
  "epr-authorization": ClipboardList,
  "epr-authorisation": ClipboardList
};

const serviceStoreSubmenus = {
  compliance: [
    ["Certificate of Origin", "certificate-of-origin"],
    ["IEM Registration", "iem-registration"],
    ["Industrial Licence", "industrial-licence"],
    ["Factory License", "factory-license"],
    ["FSSAI Licensing", "fssai"],
    ["REX Registration", "rex"],
    ["BIS Registration", "bis"],
    ["WPC Licence", "wpc-licence"],
    ["UN IIP Certificate", "un-iip-certificate"],
    ["GST Returns", "gst-return"],
    ["GST LUT Filing", "gst-lut-filing"],
    ["Warehouse License", "warehouse-license"],
    ["DSC Services", "dsc-services"],
    ["EPR Authorisation", "epr-authorisation"]
  ],
  licensing: [
    ["Advance Authorisation", "advance-auth"],
    ["EPCG License", "epcg"],
    ["Star Export House", "star"],
    ["IEC Services", "iec"]
  ],
  registration: [
    ["CDSCO Registration", "cdsco"],
    ["AQCS & PQMS", "aqcs"],
    ["Legal Metrology", "legal-metrology"]
  ],
  incentives: [
    ["RoDTEP Claims", "rodtep"],
    ["RoSCTL Claims", "rosctl"],
    ["Duty Drawback", "duty"],
    ["Interest Equalisation", "interest"],
    ["IGST Refund", "igst"]
  ],
  "custom-filing": [
    ["MOOWR Filing", "moowr"],
    ["DPD Registration", "dpd"],
    ["RMCC Support", "rmcc"],
    ["SVB Filing", "svb"],
    ["Factory Stuffing", "factory-stuffing"]
  ],
  "dispute-resolution": [
    ["DGFT Relaxation", "dgft-relaxation"],
    ["Customs Defence", "customs-defense"],
    ["SCN Reply", "scn-reply"],
    ["Appeal Support", "appeal-support"],
    ["CA Certification", "ca-certification"]
  ],
  "iso-trademark": [
    ["ISO Certification", "iso"],
    ["Trademark Filing", "trademark"],
    ["Brand Protection", "brand-protection"],
    ["Audit Support", "audit-support"]
  ],
  logistics: [
    ["Freight Coordination", "freight"],
    ["Port Operations", "port-operations"],
    ["Warehouse Coordination", "warehouse"],
    ["Shipment Tracking", "shipment-tracking"],
    ["Documentation Desk", "documentation-desk"]
  ]
};

function getMenuIcon(menu) {
  return (
    iconMap[menu.path] ||
    nameIconMap[getMenuNameKey(menu.name)] ||
    nameIconMap[normalizeServiceStoreSegment(menu.name)] ||
    Folder
  );
}

function getServiceStoreCategoryKey(menu) {
  const pathParts = getComparablePathParts(menu.path || "");
  const serviceStoreIndex = pathParts.indexOf("service-store");
  const pathCategory = serviceStoreIndex >= 0
    ? normalizeServiceStoreSegment(pathParts[serviceStoreIndex + 1])
    : "";
  const nameCategory = getMenuNameKey(menu.name);

  return serviceStoreSubmenus[pathCategory]
    ? pathCategory
    : serviceStoreSubmenus[nameCategory]
      ? nameCategory
      : "";
}

function buildSyntheticServiceStoreChildren(menu) {
  const categoryKey = getServiceStoreCategoryKey(menu);

  if (!categoryKey || menu.children?.length) {
    return [];
  }

  const basePath =
    menu.path && menu.path.includes("/service-store/")
      ? menu.path.replace(/\/+$/, "")
      : `/client/service-store/${categoryKey}`;

  return serviceStoreSubmenus[categoryKey].map(([name, segment], index) => ({
    id: `${menu.id || categoryKey}-synthetic-${segment}`,
    name,
    path: `${basePath}/${segment}`,
    parent_id: menu.id || null,
    display_order: index,
    children: []
  }));
}

function getComparablePathParts(path) {
  const cleanPath = (path || "").replace(/\/+$/, "");
  const parts = cleanPath.split("/").filter(Boolean);
  const serviceStoreIndex = parts.indexOf("service-store");

  if (serviceStoreIndex === -1) {
    return parts;
  }

  return parts.map((part, index) =>
    index > serviceStoreIndex ? normalizeServiceStoreSegment(part) : part
  );
}

function matchesMenuPath(pathname, menuPath) {
  if (!menuPath) {
    return false;
  }

  if (pathname === menuPath || pathname.startsWith(`${menuPath}/`)) {
    return true;
  }

  const pathnameParts = getComparablePathParts(pathname);
  const menuPathParts = getComparablePathParts(menuPath);

  if (!menuPathParts.length || pathnameParts.length < menuPathParts.length) {
    return false;
  }

  return menuPathParts.every((part, index) => pathnameParts[index] === part);
}

function isMenuBranchActive(menu, pathname) {
  if (matchesMenuPath(pathname, menu.path)) {
    return true;
  }

  if (!menu.children?.length) {
    const pathnameParts = getComparablePathParts(pathname);
    const menuNameKey = normalizeServiceStoreSegment(menu.name);

    return pathnameParts.includes(menuNameKey);
  }

  return menu.children.some((child) => isMenuBranchActive(child, pathname));
}

function getMenuClasses({ level, isLeafActive, isDirectParentActive, hasActiveChild }) {
  if (isLeafActive) {
    return {
      item: "bg-[linear-gradient(135deg,#2952ff_0%,#1737d6_100%)] text-white shadow-[0_10px_24px_rgba(41,82,255,0.18)]",
      icon: "text-white bg-white/14",
      chevron: "text-white/90",
      label: "font-semibold"
    };
  }

  if (isDirectParentActive) {
    return {
      item:
        level === 0
          ? "bg-white/10 text-white border border-white/10"
          : "bg-white/8 text-white border border-white/10",
      icon: "text-[#91a8ff] bg-white/10",
      chevron: "text-[#91a8ff]",
      label: "font-semibold"
    };
  }

  if (hasActiveChild) {
    return {
      item:
        level === 0
          ? "bg-white/8 text-white border border-white/10"
          : "bg-white/6 text-white border border-white/8",
      icon: "text-[#91a8ff] bg-white/10",
      chevron: "text-[#91a8ff]",
      label: "font-medium"
    };
  }

  return {
    item:
      level === 0
        ? "text-slate-400 hover:bg-white/8 hover:text-white"
        : "text-slate-400 hover:bg-white/8 hover:text-white",
    icon:
      level === 0
        ? "text-slate-500 bg-white/5 group-hover:bg-white/10 group-hover:text-white"
        : "text-slate-500 bg-white/5 group-hover:bg-white/10 group-hover:text-white",
    chevron: "text-slate-500 group-hover:text-white",
    label: "font-medium"
  };
}

function MenuItem({ menu, isCollapsed, level = 0 }) {
  const { user, onboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const syntheticChildren = buildSyntheticServiceStoreChildren(menu);
  const visibleChildren = menu.children?.length ? menu.children : syntheticChildren;
  const serviceStoreCategoryKey = getServiceStoreCategoryKey(menu);
  const forceExpandable = Boolean(serviceStoreCategoryKey);
  const hasChildren = visibleChildren.length > 0 || forceExpandable;
  const Icon = getMenuIcon(menu);
  const formIncomplete =
    user?.role === "CLIENT" && onboarding?.companyProfileCompleted !== true;
  const approvalPending =
    user?.role === "CLIENT" && onboarding?.profileApprovalStatus === "submitted";

  const isDirectPathActive = matchesMenuPath(location.pathname, menu.path);
  const hasActiveChild = Boolean(
    visibleChildren.some((child) => isMenuBranchActive(child, location.pathname))
  );
  const isInActiveBranch = isMenuBranchActive(menu, location.pathname);
  const [open, setOpen] = useState(() => hasChildren && isInActiveBranch);
  const isLeafActive = isInActiveBranch && !hasChildren;
  const isDirectParentActive = isDirectPathActive && hasChildren;
  const menuClasses = getMenuClasses({
    level,
    isLeafActive,
    isDirectParentActive,
    hasActiveChild
  });
  const displayOpen = open || isInActiveBranch;
  const ExpandIcon = displayOpen ? ChevronUp : ChevronDown;

  const showToast = () => {
    if (menu.path === "/client/company-profile-setup") {
      return;
    }

    if (formIncomplete) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: "Please complete your Quick form.",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true
      });
      return;
    }

    if (approvalPending) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: "Admin approval is still pending.",
        text: "You can browse the portal, but activation is awaiting admin approval.",
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true
      });
    }
  };

  const handleClick = (event) => {
    showToast();

    if (hasChildren) {
      event.preventDefault();

      if (menu.path) {
        navigate(menu.path);
      }

      setOpen(true);
    }
  };

  return (
    <div className="relative">
      <NavLink
        to={menu.path || "#"}
        onClick={handleClick}
        className={() =>
          `group flex min-w-0 items-center justify-between rounded-xl px-2.5 transition-all duration-300 ease-out ${
            menuClasses.item
          } ${level === 0 ? "py-2.5" : "py-2"}`
        }
      >
        {() => (
          <>
            <div className={`flex min-w-0 flex-1 items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${menuClasses.icon}`}
              >
                <Icon size={level === 0 ? 18 : 17} strokeWidth={isInActiveBranch ? 2.4 : 2} />
              </span>

              {!isCollapsed ? (
                <span
                  className={`block min-w-0 truncate ${
                    level === 0 ? "text-[15px]" : "text-[14px]"
                  } ${menuClasses.label}`}
                >
                  {menu.name}
                </span>
              ) : null}
            </div>

            {!isCollapsed && hasChildren ? (
              <span
                className={`ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                  isInActiveBranch
                    ? "border-white/15 bg-white/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white"
                }`}
                aria-hidden="true"
              >
                <ExpandIcon size={15} strokeWidth={2.4} />
              </span>
            ) : null}
          </>
        )}
      </NavLink>

      {!isCollapsed && visibleChildren.length > 0 ? (
        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out ${
            displayOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="relative ml-2 mt-1 space-y-1 rounded-xl border border-white/8 bg-white/[0.035] px-2 py-2">
              <div className="absolute bottom-3 left-3.5 top-3 w-px bg-gradient-to-b from-[#637ff7]/60 via-white/10 to-transparent" />
              <div className="space-y-1 pl-2.5">
                {visibleChildren.map((child) => (
                  <MenuItem
                    key={child.id}
                    menu={child}
                    isCollapsed={isCollapsed}
                    level={level + 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar({ isCollapsed = false, isMobileOpen = false, onToggle }) {
  const { menus, user, logout, onboarding } = useAuth();
  const navigate = useNavigate();

  const sidebarMenus =
    user?.role === "CLIENT" && onboarding?.companyProfileCompleted !== true
      ? [QUICK_FORM_MENU]
      : user?.role === "CLIENT"
        ? [...(menus || []).filter((menu) => menu.path !== QUICK_FORM_MENU.path && !menu.path?.includes("statutory-profile")), CLIENT_STATUTORY_PROFILE_MENU]
        : user?.role === "ADMIN"
          ? [...(menus || []).filter((menu) => menu.path !== QUICK_FORM_MENU.path && !menu.path?.includes("statutory-profile")), ADMIN_STATUTORY_PROFILE_MENU]
          : (menus || []).filter((menu) => menu.path !== QUICK_FORM_MENU.path && !menu.path?.includes("statutory-profile"));

  if (!sidebarMenus.length) {
    return null;
  }

  return (
    <aside
      className={`premium-sidebar mobile-sidebar-panel relative flex h-full min-h-0 self-stretch flex-col overflow-hidden transition-all duration-300 ${
        isMobileOpen ? "is-open" : ""
      } ${
        isCollapsed ? "w-[74px]" : "w-[260px]"
      }`}
    >
      <button
        onClick={onToggle}
        className="absolute right-2 top-4 z-30 hidden h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white md:flex"
      >
        {isCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      <div className={`px-4 pb-3 pt-3 ${isCollapsed ? "px-2" : ""}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : ""}`}>
          {isCollapsed ? <BrandLogo compact inverse className="drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]" /> : <div className="w-[184px] opacity-95 drop-shadow-[0_8px_18px_rgba(0,0,0,.4)]"><BrandLogo inverse /></div>}
        </div>
      </div>

      {!isCollapsed ? (
        <div className="px-4 pb-2">
          <div className="rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Main Menu
            </p>
          </div>
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-1 custom-scrollbar">
        <div className="space-y-1">
          {sidebarMenus.map((menu) => (
            <MenuItem key={menu.id} menu={menu} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>

      <div className="border-t border-white/8 px-2.5 pb-3 pt-2.5">
        <div
          className={`rounded-xl border border-white/8 bg-white/[0.06] p-2.5 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${user?.name || "U"}&background=2952ff&color=fff`
              }
              alt="profile"
              className="h-9 w-9 rounded-xl border border-white object-cover shadow-[0_8px_18px_rgba(41,82,255,0.12)]"
            />
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {user?.name || "User Name"}
                </p>
                <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#7c90c4]">
                  {user?.role || "Role"}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className={`mt-2 flex w-full items-center rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition-all hover:bg-white/8 hover:text-white ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <LogOut size={18} />
          {!isCollapsed ? <span>Log out</span> : null}
        </button>
      </div>
    </aside>
  );
}
