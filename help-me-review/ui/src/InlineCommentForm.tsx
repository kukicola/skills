import { useState, useRef, useEffect } from 'react';

interface InlineCommentFormProps {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function InlineCommentForm({ onSubmit, onCancel }: InlineCommentFormProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  return (
    <div style={{
      padding: '10px 12px',
      margin: '4px 0',
      background: '#1c2333',
      borderLeft: '3px solid #388bfd',
      borderRadius: '0 6px 6px 0',
    }}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (text.trim()) onSubmit(text);
          }
        }}
        placeholder="Write a review comment... (Cmd+Enter to submit)"
        style={{
          width: '100%',
          minHeight: 60,
          background: '#0d1117',
          color: '#e6edf3',
          border: '1px solid #30363d',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          display: 'block',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #30363d',
            background: '#21262d',
            color: '#e6edf3',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => { if (text.trim()) onSubmit(text); }}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid #2ea043',
            background: '#238636',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
