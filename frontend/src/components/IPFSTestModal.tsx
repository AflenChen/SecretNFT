import React, { useState } from 'react';
import { X, Upload, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { uploadToIPFS } from '../utils/ipfs';

interface IPFSTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IPFSTestModal({ isOpen, onClose }: IPFSTestModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      console.log('Testing IPFS upload with file:', selectedFile.name);
      const result = await uploadToIPFS(selectedFile);
      setUploadResult(result);
      console.log('IPFS upload test successful:', result);
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
      setError(errorMessage);
      console.error('IPFS upload test failed:', uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">IPFS Upload Test</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select File to Upload
            </label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-gray-400">
                  {selectedFile ? selectedFile.name : 'Click to select file'}
                </span>
                {selectedFile && (
                  <span className="text-sm text-gray-500">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Upload to IPFS</span>
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Upload Failed</span>
              </div>
              <p className="text-red-300 mt-2 text-sm">{error}</p>
            </div>
          )}

          {/* Success Display */}
          {uploadResult && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-400 mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Upload Successful!</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">IPFS Hash:</span>
                  <span className="text-green-300 font-mono">{uploadResult.hash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">IPFS URL:</span>
                  <span className="text-green-300 font-mono">{uploadResult.url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Gateway URL:</span>
                  <span className="text-green-300 font-mono">{uploadResult.gateway}</span>
                </div>
              </div>

              {/* Preview Link */}
              <div className="mt-4">
                <a
                  href={uploadResult.gateway}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View on IPFS Gateway</span>
                </a>
              </div>
            </div>
          )}

          {/* Environment Info */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Environment Information</h3>
            <div className="space-y-1 text-xs text-gray-400">
              <div>Pinata JWT: {import.meta.env.VITE_PINATA_JWT ? '✅ Configured' : '❌ Not configured'}</div>
              <div>Gateway: {import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
