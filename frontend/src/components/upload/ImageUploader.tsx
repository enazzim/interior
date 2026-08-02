import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import axios from 'axios';

interface ImageUploaderProps {
  projectId: number;
  onUploadComplete?: () => void;
}

export default function ImageUploader({ projectId, onUploadComplete }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      await axios.post(`/api/projects/${projectId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('사진이 성공적으로 업로드되었습니다.');
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('업로드에 실패했습니다. 서버 설정을 확인하세요.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div 
      style={{
        border: `2px dashed ${isDragging ? '#3b82f6' : 'var(--border-color)'}`,
        borderRadius: '8px',
        padding: '2rem',
        textAlign: 'center',
        background: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface-color)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        accept="image/*"
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      
      {uploading ? (
        <div style={{ color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          사진을 업로드하는 중...
        </div>
      ) : (
        <>
          <Upload size={32} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>사진을 여기로 드래그하거나 클릭하여 업로드</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            여러 장의 사진을 한 번에 선택할 수 있습니다.
          </p>
        </>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
