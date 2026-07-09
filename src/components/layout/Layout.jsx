import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#e7e8eb] p-3 text-slate-900">
      <Sidebar
        isCollapsed={isPrimaryCollapsed}
        onToggle={() => setIsPrimaryCollapsed((prevState) => !prevState)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-r-[18px] border-y border-r border-slate-200 bg-[#f8fafc]">
        <Header />
        <main className="min-w-0 flex-1 overflow-y-auto px-3 pb-3 pt-3 custom-scrollbar">
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
