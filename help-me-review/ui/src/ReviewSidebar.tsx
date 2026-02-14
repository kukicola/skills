import type { ReviewData } from './types';

interface ReviewSidebarProps {
  data: ReviewData;
}

export function ReviewSidebar({ data }: ReviewSidebarProps) {
  const scrollToSection = (index: number) => {
    const el = document.getElementById(`section-${index}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: 300,
      height: '100vh',
      background: '#161b22',
      borderRight: '1px solid #30363d',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #30363d',
      }}>
        <h1 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#e6edf3',
          marginBottom: '8px',
          lineHeight: '1.3',
        }}>
          {data.title}
        </h1>
        <div style={{
          fontSize: '12px',
          color: '#8b949e',
          fontFamily: 'monospace',
        }}>
          <span>{data.base_ref}</span>
          <span style={{ margin: '0 6px', color: '#484f58' }}>&larr;</span>
          <span>{data.head_ref}</span>
        </div>
      </div>

      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 0',
      }}>
        {data.sections.map((section, i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              color: '#e6edf3',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#1c2128')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
          >
            <span style={{
              flexShrink: 0,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#388bfd',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {i + 1}
            </span>
            <span style={{ flex: 1 }}>{section.title}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

