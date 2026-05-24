import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../../context/useAuth";

function findCompanyProfilePath(menus) {
  const stack = [...(menus || [])];

  while (stack.length) {
    const item = stack.pop();

    if (item.path === "/client/company-profile") {
      return item.path;
    }

    if (item.children?.length) {
      stack.push(...item.children);
    }
  }

  return null;
}

export default function OnboardingNote() {
  const { onboarding, menus } = useAuth();
  const companyProfilePath = findCompanyProfilePath(menus);
  const isSubmitted = onboarding?.profileApprovalStatus === "submitted";
  const targetPath =
    onboarding?.actionPath ||
    (isSubmitted
      ? companyProfilePath || "/client/company-profile"
      : "/client/company-profile-setup");

  if (!onboarding?.showCompanyProfileNote) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-blue-50 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
              Workspace Setup
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {isSubmitted
                ? "Company profile submitted for review"
                : "Company profile still needs attention"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {onboarding.message || "Complete your company profile to unlock a fully set up workspace."}
            </p>
          </div>
        </div>

        <Link
          to={targetPath}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#101eb9] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/10 transition hover:bg-[#0b1793]"
        >
          {onboarding.actionLabel || "Complete Company Profile"}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
