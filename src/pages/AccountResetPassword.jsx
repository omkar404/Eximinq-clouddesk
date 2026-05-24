import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../context/useAuth";
import API from "../services/interceptor";

export default function AccountResetPassword() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const togglePassword = (key) => {
    setShowPassword((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password mismatch",
        text: "New password and confirm password must match.",
        confirmButtonColor: "#101eb9"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await API.post("/auth/reset-password", form);

      await Swal.fire({
        icon: "success",
        title: "Password updated",
        text: response.data?.message || "Please sign in again with your new password.",
        confirmButtonColor: "#101eb9"
      });

      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reset failed",
        text: err.response?.data?.message || "Unable to reset password.",
        confirmButtonColor: "#101eb9"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPasswordField = (label, name, keyName, placeholder) => (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword[keyName] ? "text" : "password"}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-11 bg-slate-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:border-[#101eb9] focus:ring-4 focus:ring-[#101eb9]/5 transition-all outline-none"
          required
          minLength={name === "currentPassword" ? undefined : 6}
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={() => togglePassword(keyName)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#101eb9] transition-colors"
        >
          {showPassword[keyName] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#101eb9] text-white flex items-center justify-center">
              <LockKeyhole size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>
              <p className="text-sm text-slate-500 mt-1">
                {user?.email || "Update your account password securely."}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            After saving your new password, you will be logged out and asked to sign in again.
          </div>

          {renderPasswordField("Current Password", "currentPassword", "current", "Enter current password")}
          {renderPasswordField("New Password", "newPassword", "next", "Enter new password")}
          {renderPasswordField("Confirm Password", "confirmPassword", "confirm", "Confirm new password")}

          <div className="flex items-center justify-between pt-2">
            <Link to="/" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
              Back to Dashboard
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl bg-[#101eb9] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
