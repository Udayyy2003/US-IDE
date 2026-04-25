import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDFViewer = ({ path, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Use base path for production assets
  const pdfPath = path.startsWith('./') ? `${import.meta.env.BASE_URL}${path.slice(2)}` : path;

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#0a0a0f',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#13131e',
        borderBottom: '1px solid #1f1f2e',
        color: '#e8e8f0',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 500 }}>{title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0a0a0f', padding: '4px 8px', borderRadius: '4px' }}>
            <button 
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              disabled={pageNumber <= 1}
              style={{ background: 'none', border: 'none', color: pageNumber <= 1 ? '#555' : '#7c6df5', cursor: 'pointer' }}
            >
              ◀
            </button>
            <span>Page {pageNumber} of {numPages}</span>
            <button 
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              disabled={pageNumber >= numPages}
              style={{ background: 'none', border: 'none', color: pageNumber >= numPages ? '#55' : '#7c6df5', cursor: 'pointer' }}
            >
              ▶
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            style={{ background: '#0a0a0f', border: '1px solid #2a2a3d', color: '#aaaacc', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Zoom -
          </button>
          <span style={{ minWidth: '40px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
          <button 
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            style={{ background: '#0a0a0f', border: '1px solid #2a2a3d', color: '#aaaacc', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Zoom +
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <Document
            file={pdfPath}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<div style={{ color: '#aaaacc' }}>Loading PDF...</div>}
            error={<div style={{ color: '#ff4d6d' }}>Failed to load PDF. Please ensure "user-guidence.pdf" exists in the public folder.</div>}
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
