import { CheckCircle2, ChevronLeft, ChevronRight, LogOut, Plus } from "lucide-react";
import { useState } from "react";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`dash-sidebar${isCollapsed ? " collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setIsCollapsed((current) => !current)}
        aria-label={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      <div className="dash-sidebar-content" aria-hidden={isCollapsed}>
      <div className="brand">
        <span className="brand-mark"><CheckCircle2 size={16} /></span>
        <span>Resolvi</span>
      </div>

      <div className="dash-side-label">
        <span>Suas empresas</span>
        <button type="button" onClick={onNewCompany} title="Cadastrar nova empresa" tabIndex={isCollapsed ? -1 : 0}>
          <Plus size={13} />
        </button>
      </div>

      {companies.map((company) => (
        <button
          key={company.id}
          type="button"
          className={`company-item${!isNewCompanyActive && company.id === selectedCompanyId ? " active" : ""}`}
          onClick={() => onSelectCompany(company.id)}
          tabIndex={isCollapsed ? -1 : 0}
        >
          <span className="company-avatar">{getInitials(company.name)}</span>
          <span className="company-item-meta">
            <span className="company-item-name">{company.name}</span>
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
          <span className="sidebar-user-meta">
            <span className="sidebar-user-name">{userLabel}</span>
            <span className="sidebar-user-role">Conta empresarial</span>
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout} title="Sair" tabIndex={isCollapsed ? -1 : 0}>
            <LogOut size={15} />
          </button>
        </div>
      </div>
      </div>
    </aside>
  );
}
