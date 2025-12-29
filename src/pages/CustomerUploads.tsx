import { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle, AlertTriangle, ArrowRight, UploadCloud, File as FileIcon, X } from 'lucide-react';

function CustomerUploads() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) {
      setFile(selectedFile);
      if (!customFilename) {
        setCustomFilename(selectedFile.name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage('');
    setIsError(false);

    const fileExt = file.name.split('.').pop();
    const randomName = `${Math.random().toString(36).substring(2, 12)}.${fileExt}`;
    const filePath = `uploads/${randomName}`;
    const fileNameForDb = customFilename || file.name;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`);
      setIsError(true);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('uploads')
      .insert([{ 
        filename: fileNameForDb, 
        file_url: publicUrl, 
        shop_id: localStorage.getItem('shopId') 
      }]);

    if (dbError) {
      setMessage(`DB error: ${dbError.message}`);
      setIsError(true);
    } else {
      setMessage('File uploaded successfully!');
      setIsError(false);
      // Reset state
      setFile(null);
      setCustomFilename('');
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F9FF] p-4 font-sans">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#0F1A2B]">
            Upload to {localStorage.getItem('shopName') || 'Quick Print'}
          </h1>
          <p className="text-sm text-[#5B6B82] mt-2">
            Upload your documents for printing.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)] p-6 space-y-4">
          {/* File Name Input */}
          <div>
              <label className="text-sm font-medium text-[#5B6B82] mb-2 block">File Name (Optional)</label>
              <div className="relative">
                  <FileIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={20}/>
                  <input
                      className="w-full rounded-[12px] border border-gray-200 pl-11 pr-4 py-3 text-base text-[#0F1A2B] placeholder:text-[#8A9BB8] focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]/50 focus:border-[#0A5CFF]"
                      type="text"
                      placeholder="e.g., '''MyDocument.pdf'''"
                      value={customFilename}
                      onChange={e => setCustomFilename(e.target.value)}
                  />
              </div>
          </div>

          {/* File Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-[12px] p-6 text-center cursor-pointer hover:border-[#0A5CFF] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={40} className="mx-auto text-[#8A9BB8]"/>
            <p className="mt-2 text-sm font-semibold text-[#0F1A2B]">Click to browse or drag & drop</p>
            <p className="text-xs text-[#5B6B82]">PDF, DOCX, PNG, JPG accepted</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Selected File Display */}
          {file && (
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileIcon size={20} className="text-[#5B6B82]" />
                <span className="text-sm font-medium text-[#0F1A2B]">{file.name}</span>
              </div>
              <button onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-[#5B6B82] hover:text-[#EF4444]">
                <X size={18} />
              </button>
            </div>
          )}
          
          {message && (
            <div className={`p-3 rounded-lg flex items-center space-x-3 text-sm ${isError ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#22C55E]/10 text-[#22C55E]'}`}>
              <div className="flex-shrink-0">
                {isError ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
              </div>
              <p className="font-medium leading-tight">{message}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="w-full bg-[#0A5CFF] text-white font-semibold py-3 px-4 rounded-[14px] hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Upload File</span>
                  <ArrowRight className="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CustomerUploads;
