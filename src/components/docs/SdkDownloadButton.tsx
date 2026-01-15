import React, { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../lib/apiConfig';

type SdkType = 'nodejs' | 'python' | 'php' | 'java' | 'go' | 'perl';

interface SdkDownloadButtonProps {
  sdkType: SdkType;
  label?: string;
  variant?: 'default' | 'small' | 'icon-only';
  className?: string;
}

const sdkTypeMap: Record<string, SdkType> = {
  typescript: 'nodejs',
  javascript: 'nodejs',
  go: 'go',
  php: 'php',
  python: 'python',
  java: 'java',
  perl: 'perl',
};

export const SdkDownloadButton: React.FC<SdkDownloadButtonProps> = ({ 
  sdkType, 
  label,
  variant = 'default',
  className = ''
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const backendSdkType = sdkTypeMap[sdkType] || sdkType;
      
      const response = await fetch(
        `${API_BASE_URL}/docs/sdk/${backendSdkType}/download`,
        { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download SDK');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backendSdkType}-sdk.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`${sdkType.toUpperCase()} SDK downloaded successfully!`);
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download SDK');
    } finally {
      setDownloading(false);
    }
  };

  const defaultLabel = label || `Download ${sdkType.toUpperCase()} SDK`;

  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem',
          background: downloading ? '#9ca3af' : '#1e293b',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: downloading ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          transition: 'background-color 0.2s',
        }}
        title={defaultLabel}
        aria-label={defaultLabel}
      >
        <Download size={16} />
      </button>
    );
  }

  if (variant === 'small') {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.375rem 0.75rem',
          background: downloading ? '#9ca3af' : '#1e293b',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: downloading ? 'not-allowed' : 'pointer',
          fontSize: '0.75rem',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!downloading) {
            e.currentTarget.style.background = '#334155';
          }
        }}
        onMouseLeave={(e) => {
          if (!downloading) {
            e.currentTarget.style.background = '#1e293b';
          }
        }}
      >
        <Download size={14} />
        {downloading ? 'Downloading...' : defaultLabel}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: downloading ? '#9ca3af' : '#1e293b',
        color: 'white',
        border: 'none',
        borderRadius: '0.25rem',
        cursor: downloading ? 'not-allowed' : 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!downloading) {
          e.currentTarget.style.background = '#334155';
        }
      }}
      onMouseLeave={(e) => {
        if (!downloading) {
          e.currentTarget.style.background = '#1e293b';
        }
      }}
    >
      <Download size={16} />
      {downloading ? 'Downloading...' : defaultLabel}
    </button>
  );
};

