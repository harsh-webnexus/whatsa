import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import App from './App';
import './style.css';

type PageData = {
  title?: string;
  imageUrl?: string;
  description?: string;
};

function ContentPage() {
  const [searchParams] = useSearchParams();

  const data = React.useMemo((): PageData | null => {
    const title = searchParams.get('title')?.trim() ?? '';
    const description = searchParams.get('description')?.trim() ?? '';
    const image = searchParams.get('image')?.trim() ?? '';
    if (!title && !description && !image) {
      return null;
    }
    return {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(image ? { imageUrl: image } : {}),
    };
  }, [searchParams]);

  return <App data={data} />;
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<ContentPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
