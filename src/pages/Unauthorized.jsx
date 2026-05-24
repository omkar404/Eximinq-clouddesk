import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">

      <div className="bg-white p-8 rounded-xl shadow-md text-center w-[400px]">

        <h1 className="text-3xl font-bold text-red-500 mb-4">
          403
        </h1>

        <h2 className="text-xl font-semibold mb-2">
          Unauthorized Access
        </h2>

        <p className="text-gray-500 mb-6">
          You do not have permission to access this page.
        </p>

        <div className="flex gap-4 justify-center">

          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Dashboard
          </button>

        </div>

      </div>

    </div>
  );
}