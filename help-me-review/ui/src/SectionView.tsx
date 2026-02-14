import { useCallback } from 'react';
import { PatchDiff } from '@pierre/diffs/react';
import type { DiffLineAnnotation, AnnotationSide } from '@pierre/diffs/react';
import { ModelComment } from './ModelComment';
import { InlineCommentForm } from './InlineCommentForm';
import { useComments } from './CommentContext';
import type { Section } from './types';

function mergePatches(patches: string[]): string {
  if (patches.length <= 1) return patches[0] || '';

  // Extract meta (everything before first @@) from first patch, hunks from all
  const hunks: { oldStart: number; content: string }[] = [];
  let meta = '';

  for (let i = 0; i < patches.length; i++) {
    const hunkIdx = patches[i].search(/^@@ /m);
    if (hunkIdx === -1) continue;
    if (i === 0) meta = patches[i].slice(0, hunkIdx);
    const hunkContent = patches[i].slice(hunkIdx);
    const startMatch = hunkContent.match(/^@@ -(\d+)/);
    hunks.push({
      oldStart: startMatch ? parseInt(startMatch[1]) : 0,
      content: hunkContent,
    });
  }

  hunks.sort((a, b) => a.oldStart - b.oldStart);
  return meta + hunks.map((h) => h.content).join('\n');
}

interface SectionViewProps {
  section: Section;
  index: number;
}

interface AnnotationMetadata {
  kind: 'model' | 'user' | 'form';
  body: string;
  commentId?: string;
}

export function SectionView({ section, index }: SectionViewProps) {
  const { comments: userComments, commentTarget, openCommentForm, addComment, closeCommentForm, deleteComment } = useComments();

  return (
    <div id={`section-${index}`} style={{ marginBottom: 48, scrollMarginTop: 52 }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <span style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#388bfd',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {index + 1}
        </span>
        <div>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#e6edf3',
            marginBottom: '6px',
          }}>
            {section.title}
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#8b949e',
            lineHeight: '1.5',
          }}>
            {section.description}
          </p>
        </div>
      </div>

      {section.files.map((file) => {
        const merged = mergePatches(file.patches);

        const modelAnnotations: DiffLineAnnotation<AnnotationMetadata>[] = section.comments
          .filter((c) => c.file === file.path)
          .map((c) => ({
            lineNumber: c.line,
            side: (c.side === 'old' ? 'deletions' : 'additions') as AnnotationSide,
            metadata: { kind: 'model' as const, body: c.body },
          }));

        const userAnnotations: DiffLineAnnotation<AnnotationMetadata>[] = userComments
          .filter((c) => c.file === file.path)
          .map((c) => ({
            lineNumber: c.line,
            side: c.side,
            metadata: { kind: 'user' as const, body: c.text, commentId: c.id },
          }));

        const formAnnotation: DiffLineAnnotation<AnnotationMetadata>[] =
          commentTarget && commentTarget.file === file.path
            ? [{
                lineNumber: commentTarget.line,
                side: commentTarget.side,
                metadata: { kind: 'form' as const, body: '' },
              }]
            : [];

        const annotations = [...modelAnnotations, ...userAnnotations, ...formAnnotation];

        return (
          <div key={file.path} style={{ marginBottom: 24 }}>
            <FilePatchDiff
              patch={merged}
              filePath={file.path}
              annotations={annotations}
              onLineClick={openCommentForm}
              onDeleteComment={deleteComment}
              onSubmitComment={addComment}
              onCancelComment={closeCommentForm}
            />
          </div>
        );
      })}
    </div>
  );
}

interface FilePatchDiffProps {
  patch: string;
  filePath: string;
  annotations: DiffLineAnnotation<AnnotationMetadata>[];
  onLineClick: (target: { file: string; line: number; side: 'additions' | 'deletions' }) => void;
  onDeleteComment: (id: string) => void;
  onSubmitComment: (text: string) => void;
  onCancelComment: () => void;
}

function FilePatchDiff({ patch, filePath, annotations, onLineClick, onDeleteComment, onSubmitComment, onCancelComment }: FilePatchDiffProps) {
  const handleLineClick = useCallback((props: { lineNumber: number; annotationSide: AnnotationSide }) => {
    onLineClick({
      file: filePath,
      line: props.lineNumber,
      side: props.annotationSide,
    });
  }, [filePath, onLineClick]);

  const renderAnnotation = useCallback((annotation: DiffLineAnnotation<AnnotationMetadata>) => {
    if (annotation.metadata.kind === 'form') {
      return (
        <InlineCommentForm
          onSubmit={onSubmitComment}
          onCancel={onCancelComment}
        />
      );
    }
    if (annotation.metadata.kind === 'model') {
      return <ModelComment body={annotation.metadata.body} />;
    }
    return (
      <div style={{
        padding: '8px 12px',
        margin: '4px 0',
        background: 'rgba(56, 139, 253, 0.1)',
        borderLeft: '3px solid #388bfd',
        borderRadius: '0 6px 6px 0',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#e6edf3',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{annotation.metadata.body}</div>
        {annotation.metadata.commentId && (
          <button
            onClick={() => onDeleteComment(annotation.metadata.commentId!)}
            style={{
              background: 'none',
              border: 'none',
              color: '#484f58',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 2px',
              flexShrink: 0,
            }}
            title="Delete comment"
          >
            &times;
          </button>
        )}
      </div>
    );
  }, [onDeleteComment, onSubmitComment, onCancelComment]);

  return (
    <PatchDiff<AnnotationMetadata>
      patch={patch}
      options={{
        diffStyle: 'split',
        theme: 'pierre-dark',
        enableHoverUtility: true,
        onLineClick: handleLineClick,
      }}
      lineAnnotations={annotations}
      renderAnnotation={renderAnnotation}
      renderHoverUtility={(getHoveredLine) => {
        const hovered = getHoveredLine();
        if (!hovered) return null;
        return (
          <button
            onClick={() => onLineClick({
              file: filePath,
              line: hovered.lineNumber,
              side: hovered.side,
            })}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#388bfd',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 700,
              lineHeight: '20px',
              textAlign: 'center',
              padding: 0,
            }}
            title="Add comment"
          >
            +
          </button>
        );
      }}
    />
  );
}

