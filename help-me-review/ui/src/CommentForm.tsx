import { useState, useRef, useEffect } from 'react';
import { useComments } from './CommentContext';

export function CommentForm() {
  const { commentTarget, addComment, closeCommentForm } = useComments();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (commentTarget) {
      setText('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [commentTarget]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCommentForm();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeCommentForm]);

  if (!commentTarget) return null;

  const sideLabel = commentTarget.side === 'additions' ? 'new' : 'old';

  return (
    <div
      onClick={closeCommentForm}
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
          padding: 20,
          width: 480,
          maxWidth: '90vw',
        }}
      >
        <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 12 }}>
          Comment on <code style={{ color: '#e6edf3' }}>{commentTarget.file}</code> line {commentTarget.line} ({sideLabel})
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              addComment(text);
            }
          }}
          placeholder="Write a review comment..."
          style={{
            width: '100%',
            minHeight: 80,
            background: '#0d1117',
            color: '#e6edf3',
            border: '1px solid #30363d',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={closeCommentForm}
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
            Cancel
          </button>
          <button
            onClick={() => addComment(text)}
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
            Add comment
          </button>
        </div>
      </div>
    </div>
  );
}
