import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import logisticsPort from "../assets/logistics-port.jpg";
import { forgotPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const response = await forgotPassword({ email });

      await Swal.fire({
        icon: "success",
        title: "Check your email",
        text:
          response.message ||
          "If the account exists, password reset instructions have been sent.",
        confirmButtonColor: "#2563eb"
      });
    } catch (err) {
      const status = err.response?.status;
      const message =
        status === 404
          ? "Forgot Password is not available yet because the backend endpoint has not been added."
          : err.response?.data?.message || "Unable to process forgot password right now.";

      Swal.fire({
        icon: "error",
        title: "Request failed",
        text: message,
        confirmButtonColor: "#2563eb"
      });
    } finally {
      setIsSubmitting(false);
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
          <p className="text-lg mb-6">Recover access to your account</p>

          <ul className="space-y-2 text-sm opacity-90">
            <li>Enter your registered email address</li>
            <li>We will send instructions to reset your password</li>
            <li>Use the link in that email to finish securely</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center bg-gray-50">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-2xl shadow-xl w-[400px]"
        >
          <h2 className="text-2xl font-bold mb-2">Forgot Password</h2>
          <p className="text-gray-500 mb-6">
            Enter your email and we will start the password reset process.
          </p>

          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full border p-3 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Send Reset Link"}
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
