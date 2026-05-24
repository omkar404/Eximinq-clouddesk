import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const [isPrimaryCollapsed, setIsPrimaryCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[linear-gradient(180deg,#f9fbff_0%,#f3f7fc_52%,#eef3f9_100%)] text-slate-900">
      <Sidebar
        isCollapsed={isPrimaryCollapsed}
        onToggle={() => setIsPrimaryCollapsed((prevState) => !prevState)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 md:px-5">
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
