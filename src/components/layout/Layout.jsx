import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="app-shell cloud-workdesk-experience text-slate-900">
      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="mobile-sidebar-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      ) : null}
      <Sidebar
        isCollapsed={isPrimaryCollapsed}
        isMobileOpen={isMobileOpen}
        onToggle={() => setIsPrimaryCollapsed((prevState) => !prevState)}
      />
      <div className="app-workspace">
        <Header onOpenSidebar={() => setIsMobileOpen(true)} />
        <main className="app-content custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// import { useAuth } from "../../context/AuthContext";
// import Sidebar from "./Sidebar";

// export default function Layout() {
//   const { menus } = useAuth();

//   return (
//     <div className="flex">
//       <Sidebar menus={menus} />
//       <div className="flex-1">CONTENT</div>
//     </div>
//   );
// }
