import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label, className = '' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate size (e.g., 5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy pesada. Máximo 5MB.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        onChange(data.url);
      } else {
        setError(data.error || 'Error al subir la imagen');
      }
    } catch (err) {
      setError('Error de conexión al subir la imagen');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-bold text-slate-700">{label}</label>}
      
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {value ? (
        <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 group">
          <img src={value} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isUploading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50'}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center space-y-2">
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            )}
            <div className="text-sm">
              {isUploading ? (
                <span className="font-bold text-indigo-600">Subiendo...</span>
              ) : (
                <>
                  <span className="font-bold text-indigo-600">Haz clic para subir</span>
                  <span className="text-slate-500"> o arrastra una imagen</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400">PNG, JPG, WEBP hasta 5MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
