import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import type { ReviewData } from './types';

const root = createRoot(document.getElementById('root')!);

fetch('./sections.json')
  .then((res) => {
    if (!res.ok) throw new Error(`Failed to load sections.json: ${res.status}`);
    return res.json() as Promise<ReviewData>;
  })
  .then((data) => {
    root.render(
      <StrictMode>
        <App data={data} />
      </StrictMode>
    );
  })
  .catch(() => {
    root.render(
      <StrictMode>
        <App data={null} />
      </StrictMode>
    );
  });
