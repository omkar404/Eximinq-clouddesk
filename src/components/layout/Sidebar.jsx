import { useAuth } from "../../context/useAuth";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { iconMap } from "../../utils/iconMap";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import Swal from "sweetalert2";

const QUICK_FORM_MENU = {
  id: "quick-form-menu",
  name: "Quick Form",
  path: "/client/company-profile-setup",
  parent_id: null,
  display_order: -1,
  children: []
};

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
          ? "bg-[#eef3ff] text-[#1737d6] border border-[#d8e2ff]"
          : "bg-[#f5f8ff] text-[#1737d6] border border-[#dfe7ff]",
      icon: "text-[#2952ff] bg-white",
      chevron: "text-[#2952ff]",
      label: "font-semibold"
    };
  }

  if (hasActiveChild) {
    return {
      item:
        level === 0
          ? "bg-[#f8faff] text-slate-900 border border-slate-200"
          : "bg-white text-slate-900 border border-slate-200",
      icon: "text-[#2952ff] bg-[#eef3ff]",
      chevron: "text-[#2952ff]",
      label: "font-medium"
    };
  }

  return {
    item:
      level === 0
        ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        : "text-slate-500 hover:bg-white hover:text-slate-900",
    icon:
      level === 0
        ? "text-slate-400 bg-slate-50 group-hover:text-slate-700"
        : "text-slate-400 bg-slate-50 group-hover:text-slate-700",
    chevron: "text-slate-400 group-hover:text-slate-700",
    label: "font-medium"
  };
}

function MenuItem({ menu, isCollapsed, level = 0 }) {
  const { user, onboarding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const hasChildren = menu.children && menu.children.length > 0;
  const Icon = iconMap[menu.path];
  const formIncomplete =
    user?.role === "CLIENT" && onboarding?.companyProfileCompleted !== true;
  const approvalPending =
    user?.role === "CLIENT" && onboarding?.profileApprovalStatus === "submitted";

  const isDirectPathActive = matchesMenuPath(location.pathname, menu.path);
  const hasActiveChild = Boolean(
    menu.children?.some((child) => isMenuBranchActive(child, location.pathname))
  );
  const isInActiveBranch = isMenuBranchActive(menu, location.pathname);
  const isLeafActive = isInActiveBranch && !hasChildren;
  const isDirectParentActive = isDirectPathActive && hasChildren;
  const menuClasses = getMenuClasses({
    level,
    isLeafActive,
    isDirectParentActive,
    hasActiveChild
  });

  useEffect(() => {
    if (hasChildren && isInActiveBranch) {
      setOpen(true);
    }
  }, [hasChildren, isInActiveBranch]);

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

      setOpen((prevOpen) => (isInActiveBranch ? !prevOpen : true));
    }
  };

  return (
    <div className="relative">
      <NavLink
        to={menu.path || "#"}
        onClick={handleClick}
        className={() =>
          `group flex min-w-0 items-center justify-between rounded-2xl px-3 transition-all duration-300 ease-out ${
            menuClasses.item
          } ${level === 0 ? "py-3" : "py-2.5"}`
        }
      >
        {() => (
          <>
            <div className={`flex min-w-0 flex-1 items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
              {Icon ? (
                <span
                  className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${menuClasses.icon}`}
                >
                  <Icon size={level === 0 ? 18 : 17} strokeWidth={isInActiveBranch ? 2.4 : 2} />
                </span>
              ) : null}

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
              <ChevronDown
                size={15}
                className={`shrink-0 transition-all duration-300 ${menuClasses.chevron} ${
                  open ? "rotate-180" : ""
                }`}
              />
            ) : null}
          </>
        )}
      </NavLink>

      {!isCollapsed && hasChildren ? (
        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <div className="relative ml-2.5 mt-1.5 space-y-1 rounded-[20px] border border-slate-200/90 bg-[#fbfcff] px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="absolute bottom-3 left-3.5 top-3 w-px bg-gradient-to-b from-[#dbe4ff] via-slate-200 to-transparent" />
              <div className="space-y-1 pl-2.5">
                {menu.children.map((child) => (
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

export default function Sidebar({ isCollapsed = false, onToggle }) {
  const { menus, user, logout, onboarding } = useAuth();
  const navigate = useNavigate();

  const sidebarMenus =
    user?.role === "CLIENT" && onboarding?.companyProfileCompleted !== true
      ? [QUICK_FORM_MENU, ...(menus || []).filter((menu) => menu.path !== QUICK_FORM_MENU.path)]
      : (menus || []).filter((menu) => menu.path !== QUICK_FORM_MENU.path);

  if (!sidebarMenus.length) {
    return null;
  }

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[14px_0_32px_rgba(15,23,42,0.045)] transition-all duration-300 ${
        isCollapsed ? "w-[94px]" : "w-[278px]"
      }`}
    >
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)]"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={`px-4 pb-3 pt-4 ${isCollapsed ? "px-3.5" : ""}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-4"}`}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2952ff_0%,#1737d6_100%)] text-lg font-black text-white shadow-[0_14px_26px_rgba(41,82,255,0.18)]">
            E
          </div>
          {!isCollapsed ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#7c90c4]">
                Dashboard
              </p>
              <h1 className="mt-0.5 text-[24px] font-black tracking-[-0.05em] text-slate-900">
                EXIMINQ
              </h1>
            </div>
          ) : null}
        </div>
      </div>

      {!isCollapsed ? (
        <div className="px-4 pb-2 pt-1">
          <div className="rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Workspace Navigation
            </p>
          </div>
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1.5 custom-scrollbar">
        <div className="space-y-1">
          {sidebarMenus.map((menu) => (
            <MenuItem key={menu.id} menu={menu} isCollapsed={isCollapsed} />
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-200 px-3 pb-3.5 pt-3">
        <div
          className={`rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${
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
              className="h-10 w-10 rounded-2xl border border-white object-cover shadow-[0_8px_20px_rgba(41,82,255,0.14)]"
            />
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.name || "User Name"}
                </p>
                <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.22em] text-[#7c90c4]">
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
          className={`mt-3 flex w-full items-center rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 ${
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
