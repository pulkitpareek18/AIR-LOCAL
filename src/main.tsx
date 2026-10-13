import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './tailwind.css';
import './airlocal';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
