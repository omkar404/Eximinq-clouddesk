import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "../services/authService";
import logisticsPort from "../assets/logistics-port.jpg";
import { useAuth } from "../context/useAuth";

export default function Login() {
  const { login, user, menus, onboarding } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  if (user && menus.length > 0) {
    const lockedPath =
      user.role === "CLIENT" && onboarding?.dashboardLocked
        ? onboarding.actionPath || "/client/company-profile-setup"
        : null;

    return <Navigate to={lockedPath || menus[0].path} replace />;
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

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
      alert("Invalid credentials");
    }
  };

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

          <p className="text-lg mb-6">
            Global Import Export Compliance Platform
          </p>

          <ul className="space-y-2 text-sm opacity-90">
            <li>• Shipping Bill Management</li>
            <li>• Import Export Documentation</li>
            <li>• Compliance Audit</li>
            <li>• Trade Workflow Automation</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gray-50">
        <form
          onSubmit={handleLogin}
          className="bg-white p-10 rounded-2xl shadow-xl w-[380px]"
        >
          <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>

          <p className="text-gray-500 mb-6">
            Sign in to CloudDesk
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Password
              </label>

              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full border p-3 rounded-lg pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded-lg font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
