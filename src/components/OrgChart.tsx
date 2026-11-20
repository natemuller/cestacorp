import org from '../data/org.json'

export default function OrgChart({ selected, onSelect }: { selected?: string; onSelect?: (roleId: string) => void }) {
  return (
    <div className="org">
      <svg width="100%" height="470" aria-hidden>
        {org.lines.map((l, i) => <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#aab1e0" strokeWidth="1.5" />)}
      </svg>
      {org.nodes.map((n) => {
        const isRole = !!n.roleId
        return (
          <div key={n.id} className={`node ${n.kind === 'dir' ? 'dir' : ''} ${n.kind === 'out' ? 'out' : ''} ${isRole ? 'role' : ''} ${n.roleId && n.roleId === selected ? 'sel' : ''}`}
            style={{ left: n.x, top: n.y, width: n.w, height: n.h }} role={isRole ? 'button' : undefined} tabIndex={isRole ? 0 : undefined}
            onClick={() => isRole && onSelect?.(n.roleId!)} onKeyDown={(e) => e.key === 'Enter' && isRole && onSelect?.(n.roleId!)}>{n.label}</div>
        )
      })}
    </div>
  )
}
