import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import DesignProvider from './components/DesignProvider.tsx';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignProvider><App /></DesignProvider>
  </StrictMode>,
);
