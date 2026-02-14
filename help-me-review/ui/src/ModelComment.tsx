import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ModelCommentProps {
  body: string;
}

export function ModelComment({ body }: ModelCommentProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    setPos({ x: rect.right, y: rect.top });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  return (
    <div style={{ height: 0, position: 'relative', overflow: 'visible' }}>
      <div
        ref={iconRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          position: 'absolute',
          bottom: 2,
          right: 8,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#8250df',
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          lineHeight: 1,
        }}
      >
        AI
      </div>
      {pos && createPortal(
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          style={{
            position: 'fixed',
            right: Math.max(8, window.innerWidth - pos.x),
            top: pos.y,
            transform: 'translateY(-100%)',
            marginTop: -4,
            padding: '10px 14px',
            background: '#2d333b',
            border: '1px solid #444c56',
            borderLeft: '3px solid #8250df',
            borderRadius: 6,
            fontSize: 13,
            lineHeight: 1.5,
            color: '#e6edf3',
            whiteSpace: 'pre-wrap',
            maxWidth: 420,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 9999,
          }}
        >
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#8250df',
            marginBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            AI Review
          </div>
          {body}
        </div>,
        document.body,
      )}
    </div>
  );
}
