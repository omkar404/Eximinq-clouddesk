import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import logisticsPort from "../assets/logistics-port.jpg";
import { resetForgottenPassword } from "../services/authService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [showPassword, setShowPassword] = useState({
    next: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
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

    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Invalid reset link",
        text: "This password reset link is missing its token.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password mismatch",
        text: "New password and confirm password must match.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await resetForgottenPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword
      });

      await Swal.fire({
        icon: "success",
        title: "Password reset successful",
        text: response.message || "Please log in with your new password.",
        confirmButtonColor: "#2563eb"
      });

      navigate("/login", { replace: true });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reset failed",
        text: err.response?.data?.message || "Unable to reset password.",
        confirmButtonColor: "#2563eb"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPasswordField = (label, name, keyName, placeholder) => (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="relative mt-1">
        <input
          type={showPassword[keyName] ? "text" : "password"}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full border p-3 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          required
          minLength={6}
          disabled={!token || isSubmitting}
        />
        <button
          type="button"
          onClick={() => togglePassword(keyName)}
          className="absolute right-3 top-3 text-gray-500"
          disabled={!token}
        >
          {showPassword[keyName] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img
          src={logisticsPort}
          className="absolute h-full w-full object-cover"
          alt="background"
        />

        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 text-white flex flex-col justify-center h-full px-16">
          <h1 className="text-4xl font-bold mb-4">CloudDesk</h1>
          <p className="text-lg mb-6">Create your new password securely</p>

          <ul className="space-y-2 text-sm opacity-90">
            <li>This reset link expires in 15 minutes</li>
            <li>Choose a password with at least 6 characters</li>
            <li>After saving, return to login and continue normally</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gray-50">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-2xl shadow-xl w-[420px]"
        >
          <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
          <p className="text-gray-500 mb-6">
            {token
              ? "Enter and confirm your new password."
              : "This reset link is invalid or missing its token."}
          </p>

          <div className="space-y-4">
            {renderPasswordField("New Password", "newPassword", "next", "Enter new password")}
            {renderPasswordField("Confirm Password", "confirmPassword", "confirm", "Confirm new password")}
          </div>

          <button
            type="submit"
            disabled={!token || isSubmitting}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Reset Password"}
          </button>

          <div className="mt-5 text-center text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
