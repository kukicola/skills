import { useState } from 'react';
import { ReviewSidebar } from './ReviewSidebar';
import { SectionView } from './SectionView';
import { CommentProvider, useComments } from './CommentContext';
import { ExportModal } from './ExportModal';
import type { ReviewData } from './types';

interface AppProps {
  data: ReviewData | null;
}

export function App({ data }: AppProps) {
  if (!data) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#8b949e',
        fontSize: '16px',
      }}>
        No review data found.
      </div>
    );
  }

  return (
    <CommentProvider>
      <AppContent data={data} />
    </CommentProvider>
  );
}

function AppContent({ data }: { data: ReviewData }) {
  const { comments } = useComments();
  const [exportFormat, setExportFormat] = useState<'json' | 'text' | null>(null);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <ReviewSidebar data={data} />
      <main style={{ marginLeft: 300, flex: 1, minWidth: 0 }}>
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(22, 27, 34, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #30363d',
          padding: '10px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 13, color: '#8b949e' }}>
            <strong style={{ color: '#388bfd' }}>{comments.length}</strong> comment{comments.length !== 1 ? 's' : ''}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => comments.length > 0 ? setExportFormat('text') : alert('No comments to export.')}
            style={{
              padding: '5px 14px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #30363d',
              background: '#21262d',
              color: '#e6edf3',
              cursor: 'pointer',
            }}
          >
            Export as Text
          </button>
          <button
            onClick={() => comments.length > 0 ? setExportFormat('json') : alert('No comments to export.')}
            style={{
              padding: '5px 14px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #2ea043',
              background: '#238636',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Export as JSON
          </button>
        </div>

        <div style={{ padding: '32px 40px' }}>
          {data.sections.map((section, i) => (
            <SectionView key={i} section={section} index={i} />
          ))}
        </div>
      </main>

      {exportFormat && (
        <ExportModal format={exportFormat} onClose={() => setExportFormat(null)} />
      )}
    </div>
  );
}
