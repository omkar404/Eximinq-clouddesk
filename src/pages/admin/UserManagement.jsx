import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../context/useAuth";
import API from "../../services/interceptor";
import {
  UserPlus,
  Users,
  RotateCcw,
  Eye,
  EyeOff,
  Search,
  LockKeyhole,
  Sparkles
} from "lucide-react";

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT"
  });

  const brandColor = "#101eb9";

  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    showCloseButton: true,
    didOpen: (instance) => {
      instance.addEventListener("mouseenter", Swal.stopTimer);
      instance.addEventListener("mouseleave", Swal.resumeTimer);
    }
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await API.get("/auth/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      try {
        const res = await API.get("/auth/users");

        if (isMounted) {
          setUsers(res.data);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleReset = () => {
    setForm({ name: "", email: "", password: "", role: "AGENT" });
  };

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.name, user.email, user.user_code, user.role?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [searchQuery, users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", form);

      toast.fire({
        icon: "success",
        title: "User Created Successfully",
        text: `${form.name} is now part of the system.`,
        iconColor: brandColor
      });

      handleReset();
      fetchUsers();
    } catch (err) {
      toast.fire({
        icon: "error",
        title: "Registration Failed",
        text: err.response?.data?.message || "Something went wrong"
      });
    }
  };

  return (
    <div className="dashboard-page animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="dashboard-hero px-6 py-6 md:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="dashboard-badge">
              <Sparkles size={14} />
              Identity And Access
            </div>
            <h1 className="mt-4 text-[2.1rem] font-black tracking-[-0.05em] text-slate-900 md:text-[2.5rem]">
              Manage system users with clearer controls and less visual clutter
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Onboard team members, assign access, and handle credential workflows from a
              compact workspace that uses screen space more efficiently.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white/80 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 rounded-[18px] bg-blue-50 px-4 py-3">
              <Users size={18} className="text-[#101eb9]" />
              <span className="font-bold text-[#101eb9]">{users.length} Active</span>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#101eb9] text-white">
              <UserPlus size={16} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                User Creation
              </p>
              <h2 className="text-lg font-black tracking-[-0.03em] text-slate-900">
                Onboard New Member
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-[#101eb9]"
          >
            <RotateCcw size={14} />
            Reset Form
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ex: Alex Rivera"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white focus:ring-4 focus:ring-[#101eb9]/5"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Work Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="alex@eximinq.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white focus:ring-4 focus:ring-[#101eb9]/5"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="********"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white focus:ring-4 focus:ring-[#101eb9]/5"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#101eb9]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                System Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white focus:ring-4 focus:ring-[#101eb9]/5"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="AGENT">AGENT</option>
                <option value="CLIENT">CLIENT</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{ backgroundColor: brandColor }}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-[0_18px_34px_rgba(16,30,185,0.18)] transition-all hover:shadow-[0_20px_38px_rgba(16,30,185,0.24)] active:scale-[0.99]"
          >
            Create User Account
          </button>
        </form>
      </section>

      <section className="dashboard-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Directory
            </p>
            <h2 className="mt-1 text-lg font-black tracking-[-0.03em] text-slate-900">
              User Directory
            </h2>
          </div>

          <div className="relative w-full lg:w-[320px]">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, email, code, or role"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#101eb9] focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50/70">
              <tr className="text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Cloudesk ID</th>
                <th className="px-6 py-4">Access Level</th>
                <th className="px-6 py-4 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCurrentUser =
                  currentUser &&
                  (u.id === currentUser.id || u.email === currentUser.email);

                return (
                  <tr key={u.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#101eb9] to-blue-400 text-sm font-bold text-white shadow-inner">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{u.name}</p>
                          <p className="text-xs font-medium text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs font-bold tracking-[0.16em] text-slate-700">
                        {u.user_code || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${
                          u.role?.name === "ADMIN" || u.role === "ADMIN"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {u.role?.name || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => navigate("/account/reset-password")}
                        disabled={!isCurrentUser}
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                          isCurrentUser
                            ? "bg-blue-50 text-[#101eb9] hover:bg-blue-100"
                            : "cursor-not-allowed bg-slate-100 text-slate-400"
                        }`}
                      >
                        <LockKeyhole size={14} />
                        Reset Password
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-24 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                <Users className="text-slate-300" size={32} />
              </div>
              <p className="font-bold tracking-tight text-slate-400">
                No users match the current filter
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
