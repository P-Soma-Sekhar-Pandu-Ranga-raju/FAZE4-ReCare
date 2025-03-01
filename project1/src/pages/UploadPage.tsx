import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { uploadDocument } from '../lib/supabase';
import { extractTextFromFile, analyzeReadmissionRisk } from '../lib/textExtraction';
import { FileUp, X, FileText, ImageIcon, FileType } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractingText, setExtractingText] = useState(false);
  const [analyzingText, setAnalyzingText] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType || '')) {
      return <ImageIcon className="h-4 w-4 text-blue-600" />;
    } else if (['pdf'].includes(fileType || '')) {
      return <FileText className="h-4 w-4 text-red-600" />;
    } else if (['doc', 'docx'].includes(fileType || '')) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    } else {
      return <FileType className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // Upload each file
      for (const file of files) {
        if (user) {
          // Upload file to storage
          const { data: documentData, error: uploadError } = await uploadDocument(user.id, file);
          if (uploadError) throw uploadError;
          
          if (documentData) {
            clearInterval(interval);
            setUploadProgress(100);
            
            // Extract text from document
            setExtractingText(true);
            const extractedText = await extractTextFromFile(file);
            setExtractingText(false);
            
            // Analyze text for readmission risk
            setAnalyzingText(true);
            const analysis = await analyzeReadmissionRisk(extractedText);
            setAnalyzingText(false);
            
            // Store analysis in database
            const { error: analysisError } = await fetch('/api/analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                documentId: documentData.id,
                extractedText,
                analysis,
              }),
            }).then(res => res.json());
            
            if (analysisError) throw analysisError;
            
            // Redirect to results page after successful upload and analysis
            setTimeout(() => {
              navigate(`/results/${documentData.id}`);
            }, 1000);
            
            break; // Only process the first file for now
          }
        }
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'An error occurred during upload. Please try again.');
    } finally {
      setIsUploading(false);
      setExtractingText(false);
      setAnalyzingText(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-600 bg-clip-text text-transparent">
            Upload Patient Records
          </h1>
          <p className="text-slate-600 mt-2">
            Upload patient medical records and documents for readmission risk assessment
          </p>
        </div>

        <div className="bg-white rounded-lg border border-blue-100 shadow-md">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg px-6 py-4">
            <h2 className="text-xl font-semibold text-blue-900">Patient Record Upload</h2>
            <p className="text-blue-700 text-sm">
              Upload medical records, discharge summaries, or lab results for AI analysis
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid w-full gap-6">
                <div className="flex flex-col gap-2">
                  <div
                    className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-4 transition-colors hover:bg-blue-50 ${
                      isUploading || extractingText || analyzingText ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={() => !isUploading && !extractingText && !analyzingText && document.getElementById('file-upload')?.click()}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="rounded-full bg-blue-100 p-3">
                        <FileUp className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-blue-900">Drag and drop or click to upload</p>
                      <p className="text-xs text-blue-600">Supports PDF, DOCX, JPG, PNG (up to 10MB)</p>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        multiple
                        accept=".pdf,.docx,.jpg,.jpeg,.png"
                        disabled={isUploading || extractingText || analyzingText}
                      />
                    </div>
                  </div>
                  {error && (
                    <p className="text-sm text-rose-500 bg-rose-50 p-2 rounded-md border border-rose-200">{error}</p>
                  )}
                  
                  {(isUploading || extractingText || analyzingText) && (
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-blue-600 text-center">
                        {isUploading ? `Uploading... ${uploadProgress}%` : 
                         extractingText ? "Extracting text from document..." :
                         analyzingText ? "Analyzing readmission risk..." : ""}
                      </p>
                    </div>
                  )}
                  
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-blue-900">Selected Files</label>
                      <div className="max-h-40 overflow-auto rounded-md border border-blue-100 p-2">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md p-2 hover:bg-blue-50"
                          >
                            <div className="flex items-center gap-2">
                              {getFileIcon(file)}
                              <span className="text-sm truncate max-w-[200px] text-slate-700">{file.name}</span>
                              <span className="text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <button
                              type="button"
                              className="rounded-full p-1 text-slate-500 hover:text-rose-500 hover:bg-rose-50"
                              onClick={() => removeFile(index)}
                              disabled={isUploading || extractingText || analyzingText}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200/50"
                  disabled={isUploading || extractingText || analyzingText || files.length === 0}
                >
                  {isUploading ? "Uploading..." : 
                   extractingText ? "Extracting Text..." :
                   analyzingText ? "Analyzing..." : "Upload and Analyze"}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg border border-blue-100 shadow-md p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How Readmission Risk Assessment Works</h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                <span className="text-blue-700 font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Document Upload</h4>
                <p className="text-slate-600 text-sm">Upload patient medical records, discharge summaries, or lab results.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                <span className="text-blue-700 font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Text Extraction</h4>
                <p className="text-slate-600 text-sm">Our system extracts text from various document formats using advanced OCR technology.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                <span className="text-blue-700 font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">AI Analysis</h4>
                <p className="text-slate-600 text-sm">Our AI analyzes the text to identify risk factors for hospital readmission.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                <span className="text-blue-700 font-semibold">4</span>
              </div>
              <div>
                <h4 className="font-medium text-slate-900">Risk Assessment</h4>
                <p className="text-slate-600 text-sm">Receive a comprehensive risk assessment with personalized care recommendations.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}