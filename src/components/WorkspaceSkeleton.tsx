export default function WorkspaceSkeleton() {
  return (
    <div className="workspace-loading" role="status" aria-live="polite">
      <span className="visually-hidden">환자 기록을 불러오고 있어요</span>
      <div className="loading-topbar" aria-hidden="true"><b>SocDoc</b><span className="skeleton-line" /></div>
      <div className="loading-layout" aria-hidden="true">
        <div className="loading-sidebar">{Array.from({ length: 5 }, (_, i) => <div className="skeleton-patient" key={i}><span /><i /></div>)}</div>
        <div className="loading-main"><div className="skeleton-line loading-title" /><div className="skeleton-overview" /><div className="loading-panels"><div /><div /></div></div>
      </div>
    </div>
  );
}
