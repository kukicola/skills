import { useState } from 'react';
import { useComments } from './CommentContext';

interface ExportModalProps {
  format: 'json' | 'text';
  onClose: () => void;
}

export function ExportModal({ format, onClose }: ExportModalProps) {
  const { comments } = useComments();
  const [copied, setCopied] = useState(false);

  let output: string;
  if (format === 'json') {
    const data = comments.map(c => ({
      file: c.file,
      line: c.line,
      type: c.side === 'additions' ? 'add' : 'delete',
      comment: c.text,
    }));
    output = JSON.stringify(data, null, 2);
  } else {
    const grouped: Record<string, typeof comments> = {};
    for (const c of comments) {
      if (!grouped[c.file]) grouped[c.file] = [];
      grouped[c.file].push(c);
    }
    let text = 'Review Comments:\n===============\n\n';
    for (const [file, fileComments] of Object.entries(grouped)) {
      text += `## ${file}\n`;
      for (const c of fileComments) {
        const type = c.side === 'additions' ? 'add' : 'delete';
        text += `- [line ${c.line}] (${type}): ${c.text}\n`;
      }
      text += '\n';
    }
    output = text;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 8,
          padding: 24,
          width: 640,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>
          Export as {format === 'json' ? 'JSON' : 'Text'} (paste back to Claude)
        </h3>
        <pre style={{
          flex: 1,
          overflow: 'auto',
          background: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: 6,
          padding: 12,
          fontSize: 12,
          color: '#e6edf3',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {output}
        </pre>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #30363d',
              background: '#21262d',
              color: '#e6edf3',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #2ea043',
              background: '#238636',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
