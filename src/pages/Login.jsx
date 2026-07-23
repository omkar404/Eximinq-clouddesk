import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { loginUser } from "../services/authService";
import logisticsPort from "../assets/logistics-port.jpg";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const { login, user, menus, onboarding } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  if (user) {
    const lockedPath =
      user.role === "CLIENT" && onboarding?.dashboardLocked
        ? onboarding.actionPath || "/client/company-profile-setup"
        : null;

    if (lockedPath || menus.length > 0) {
      return <Navigate to={lockedPath || menus[0].path} replace />;
    }
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await loginUser(form);

      login(response);

      if (response.user?.role === "CLIENT" && response.onboarding?.dashboardLocked) {
        navigate(response.onboarding.actionPath || "/client/company-profile-setup", {
          replace: true
        });
        return;
      }

      const firstMenu = response.menus?.[0];
      navigate(firstMenu?.path || "/unauthorized", { replace: true });
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setErrorMessage("CloudDesk is unavailable. Please try again in a moment.");
      } else if (err.response.status === 401) {
        setErrorMessage("The email or password you entered is incorrect.");
      } else {
        setErrorMessage(err.response.data?.message || "Unable to sign in right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[#f4f7fb] lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src={logisticsPort}
          className="absolute inset-0 h-full w-full scale-105 object-cover"
          alt="Container vessel at an international trade port"
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,15,42,.96)_0%,rgba(16,30,85,.86)_52%,rgba(30,64,175,.52)_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_20%_20%,#6ee7b7_0,transparent_22%),radial-gradient(circle_at_80%_75%,#60a5fa_0,transparent_25%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between px-10 py-10 text-white xl:px-16 xl:py-14">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6b86ff] to-[#3157ff] text-lg font-black shadow-2xl">E</div>
            <div>
              <p className="text-base font-extrabold tracking-[-0.02em]">EXIMINQ</p>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-blue-200">CloudDesk</p>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-bold text-blue-100 backdrop-blur-xl">
              <Sparkles size={14} className="text-emerald-300" />
              The operating system for global trade
            </div>
            <h1 className="text-5xl font-black leading-[1.04] tracking-[-0.055em] xl:text-6xl">
              Compliance clarity.
              <span className="block bg-gradient-to-r from-[#a7f3d0] to-[#93c5fd] bg-clip-text text-transparent">Operational control.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Unify filings, documents, workflows, and financial visibility in one secure enterprise workspace.
            </p>
            <div className="mt-9 grid grid-cols-2 gap-3">
              {["Real-time compliance", "Secure document vault", "Workflow automation", "Role-based access"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[.07] px-3.5 py-3 text-xs font-semibold text-slate-200 backdrop-blur-xl">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-5 text-[11px] text-slate-400">
            <span>Enterprise-grade trade intelligence</span>
            <span className="flex items-center gap-2"><ShieldCheck size={14} /> Secure access</span>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute left-5 top-5 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3157ff] text-sm font-black text-white">E</div>
          <span className="font-extrabold text-slate-950">EXIMINQ CloudDesk</span>
        </div>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[450px] rounded-[32px] border border-white/90 bg-white/90 p-7 shadow-[0_30px_80px_rgba(15,23,42,.14)] backdrop-blur-2xl sm:p-10"
        >
          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#3157ff]"><LockKeyhole size={21} /></div>
            <p className="premium-kicker">Secure workspace access</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to continue to your personalized CloudDesk workspace.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-bold text-slate-700">
                Email
              </label>
              <div className="relative mt-2">
                <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-4 text-sm outline-none" autoComplete="email" required />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-bold text-slate-700">
                Password
              </label>

              <div className="relative mt-2">
                <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-12 text-sm outline-none"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-[#3157ff] hover:text-[#1831c9]"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3157ff] to-[#1831c9] p-3.5 text-sm font-bold text-white shadow-[0_16px_30px_rgba(49,87,255,.28)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Signing in…" : "Sign in securely"}
            {!isSubmitting ? <ArrowRight size={17} /> : null}
          </button>

          <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
            Protected by encrypted authentication and role-based access controls.
          </p>
        </form>
      </section>
    </main>
  );
}
