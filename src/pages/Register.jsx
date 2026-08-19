import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerUser } from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CLIENT" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const change = (event) => setForm((value) => ({ ...value, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError(""); setMessage(""); setSubmitting(true);
    try { const data = await registerUser(form); setMessage(data.message); setForm({ name: "", email: "", password: "", role: form.role }); }
    catch (err) { setError(err.response?.data?.message || "Unable to submit registration."); }
    finally { setSubmitting(false); }
  };
  return <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] p-5">
    <form onSubmit={submit} className="w-full max-w-lg rounded-[32px] border bg-white p-8 shadow-xl">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><UserPlus /></div>
      <p className="premium-kicker">CloudDesk registration</p><h1 className="mt-2 text-3xl font-black">Create your account</h1>
      <p className="mt-2 text-sm text-slate-500">Client and Agent registrations require Admin approval before login.</p>
      <div className="mt-6 space-y-4">
        <input name="name" value={form.name} onChange={change} required placeholder="Full name" className="w-full rounded-2xl border p-3.5" />
        <input name="email" type="email" value={form.email} onChange={change} required placeholder="Email address" className="w-full rounded-2xl border p-3.5" />
        <select name="role" value={form.role} onChange={change} className="w-full rounded-2xl border p-3.5"><option value="CLIENT">Client</option><option value="AGENT">Agent</option></select>
        <div className="relative"><input name="password" type={showPassword ? "text" : "password"} minLength="8" value={form.password} onChange={change} required placeholder="Password (minimum 8 characters)" className="w-full rounded-2xl border p-3.5 pr-12" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-4 text-slate-400">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
      </div>
      {message && <div className="mt-4 flex gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 size={18}/>{message}</div>}
      {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
      <button disabled={submitting} className="mt-6 w-full rounded-2xl bg-[#101eb9] p-4 font-bold text-white disabled:opacity-60">{submitting ? "Submitting…" : "Submit registration"}</button>
      <p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-bold text-blue-700">Sign in</Link></p>
    </form>
  </main>;
}
