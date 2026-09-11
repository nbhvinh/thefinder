import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import HomePostCard from '../../src/components/post/HomePostCard';
import '../../src/index.css';

const imageUrls = ['#237596', '#c24954', '#398853'].map((color, index) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${color}"/><text x="400" y="320" text-anchor="middle" font-size="100" fill="white">${index + 1}</text></svg>`)}`
);

createRoot(document.getElementById('root')).render(
  <React.StrictMode><MemoryRouter>
    <main style={{ padding: 16, maxWidth: 780, margin: 'auto' }}>
      <HomePostCard post={{ id: 1, title: 'Kiểm tra vuốt ảnh', type: 'LOST', status: 'OPEN', imageUrls }} isOwner />
      <div style={{ height: 1400 }} />
    </main>
  </MemoryRouter></React.StrictMode>
);
