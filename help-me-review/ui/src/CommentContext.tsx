import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserComment } from './types';

interface CommentTarget {
  file: string;
  line: number;
  side: 'additions' | 'deletions';
}

interface CommentContextValue {
  comments: UserComment[];
  commentTarget: CommentTarget | null;
  openCommentForm: (target: CommentTarget) => void;
  closeCommentForm: () => void;
  addComment: (text: string) => void;
  deleteComment: (id: string) => void;
}

const CommentContext = createContext<CommentContextValue>(null!);

export function useComments() {
  return useContext(CommentContext);
}

export function CommentProvider({ children }: { children: ReactNode }) {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [commentTarget, setCommentTarget] = useState<CommentTarget | null>(null);

  const openCommentForm = useCallback((target: CommentTarget) => {
    setCommentTarget(target);
  }, []);

  const closeCommentForm = useCallback(() => {
    setCommentTarget(null);
  }, []);

  const addComment = useCallback((text: string) => {
    if (!commentTarget || !text.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      file: commentTarget.file,
      line: commentTarget.line,
      side: commentTarget.side,
      text: text.trim(),
    }]);
    setCommentTarget(null);
  }, [commentTarget]);

  const deleteComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
  }, []);

  return (
    <CommentContext.Provider value={{
      comments,
      commentTarget,
      openCommentForm,
      closeCommentForm,
      addComment,
      deleteComment,
    }}>
      {children}
    </CommentContext.Provider>
  );
}
