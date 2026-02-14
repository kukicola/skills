import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import type { ReviewData } from './types';

const DATA: ReviewData | null = (window as any).__REVIEW_DATA__ ?? null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App data={DATA} />
  </StrictMode>
);
