import { CheckCircle2, LogOut, Plus } from "lucide-react";

import type { Company } from "../../types";
import { getInitials } from "../../utils/format";

interface CompanySidebarProps {
  companies: Company[];
  selectedCompanyId: string | null;
  onSelectCompany: (id: string) => void;
  onNewCompany: () => void;
  isNewCompanyActive: boolean;
  userLabel: string;
  onLogout: () => void;
}

export function CompanySidebar({
  companies,
  selectedCompanyId,
  onSelectCompany,
  onNewCompany,
  isNewCompanyActive,
  userLabel,
  onLogout,
}: CompanySidebarProps) {
  return (
    <aside className="dash-sidebar">
      <div className="brand">
        <span className="brand-mark"><CheckCircle2 size={16} /></span>
        <span>Resolvi</span>
      </div>

      <div className="dash-side-label">
        <span>Suas empresas</span>
        <button type="button" onClick={onNewCompany} title="Cadastrar nova empresa">
          <Plus size={13} />
        </button>
      </div>

      {companies.map((company) => (
        <button
          key={company.id}
          type="button"
          className={`company-item${!isNewCompanyActive && company.id === selectedCompanyId ? " active" : ""}`}
          onClick={() => onSelectCompany(company.id)}
        >
          <span className="company-avatar">{getInitials(company.name)}</span>
          <span className="company-item-meta">
            <span className="company-item-name">{company.name}</span>
            <span className="company-item-sub">/atendimento/{company.slug}</span>
          </span>
        </button>
      ))}

      {isNewCompanyActive && (
        <div className="company-item active">
          <span className="company-avatar">
            <Plus size={14} />
          </span>
          <span className="company-item-meta">
            <span className="company-item-name">Nova empresa</span>
          </span>
        </div>
      )}

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <span className="sidebar-user-avatar">{getInitials(userLabel)}</span>
          <span>
            <span className="sidebar-user-name">{userLabel}</span>
            <span className="sidebar-user-role">Conta empresarial</span>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout} title="Sair">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
