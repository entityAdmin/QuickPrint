import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Upload, X, Printer, CheckCircle, AlertTriangle, FileText, Copy, Palette, Layers } from 'lucide-react'
import Notification from './Notification'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

interface Upload {
  id: number;
  filename: string;
  file_url: string;
  customer_name?: string;
  customer_phone?: string;
  status?: string;
  created_at: string;
  expires_at: string;
  copies: number;
  print_type: 'B&W' | 'Color';
  double_sided: boolean;
  paper_size: string;
  binding: string;
  special_instructions: string;
  payment_method?: string;
}

interface FileWithOptions {
  file: File
  copies: number
  printType: 'B&W' | 'Color'
  doubleSided: boolean
}

interface CompletedUpload {
  id: number;
  filename: string;
}

function CustomerUpload() {
  const [files, setFiles] = useState<FileWithOptions[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [shopId, setShopId] = useState<string | null>(null)
  const [shopName, setShopName] = useState('QuickPrint Cyber')
  const [shopCode, setShopCode] = useState('...')
  const [paperSize, setPaperSize] = useState('A4')
  const [binding, setBinding] = useState('None')
  const [paymentMethod, setPaymentMethod] = useState('MPesa')
  const [agreeSms, setAgreeSms] = useState(true)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [completedUpload, setCompletedUpload] = useState<CompletedUpload | null>(null);

  useEffect(() => {
    const storedShopId = localStorage.getItem('shopId')
    const storedShopName = localStorage.getItem('shopName')
    const storedShopCode = localStorage.getItem('shopCode')
    if (storedShopId) {
      setShopId(storedShopId)
      setShopName(storedShopName || 'QuickPrint Cyber')
      setShopCode(storedShopCode || '...')
    } else {
      console.warn('Shop details not found in localStorage.')
    }

    const subscription = supabase.channel('public:uploads')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'uploads' }, payload => {
        const updatedUpload = payload.new as Upload;
        if (updatedUpload.status === 'completed' && updatedUpload.customer_phone === phone) {
          setCompletedUpload({ id: updatedUpload.id, filename: updatedUpload.filename });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };

  }, [phone])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return `File size must be less than 50MB.`
    if (!ALLOWED_TYPES.includes(file.type)) return `Only PDF, JPG, PNG, DOC files are allowed.`
    return null
  }

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    let validationError: string | null = null;
    const newFiles: FileWithOptions[] = Array.from(selectedFiles).reduce((acc: FileWithOptions[], file) => {
      const error = validateFile(file);
      if (error) {
        validationError = `${error} ${file.name} will not be added.`;
        return acc;
      }
      acc.push({ file, copies: 1, printType: 'B&W', doubleSided: false });
      return acc;
    }, []);
    setFiles(prev => [...prev, ...newFiles]);
    if (validationError) {
        setMessage(validationError);
        setIsError(true);
    } else {
        setMessage('Files selected successfully.');
        setIsError(false);
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files) handleFileChange(e.dataTransfer.files);
  }

  const handleDragActivity = (e: React.DragEvent<HTMLDivElement>, isActive: boolean) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(isActive);
  }

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const updateFileOption = (index: number, key: keyof FileWithOptions, value: string | number | boolean) => {
    setFiles(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  const calculateTotalCost = () => {
    const cost = files.reduce((acc, item) => {
        const pageCount = 1; // Placeholder for actual page count logic
        let itemCost = (item.printType === 'Color' ? 20 : 10) * pageCount;
        if (item.doubleSided) itemCost *= 1.5;
        return acc + (itemCost * item.copies);
    }, 0);
    return `KES ${cost.toFixed(2)}`;
  }
  
  const handleSubmit = async () => {
    if (!name.trim()) { setMessage('Please enter your name.'); setIsError(true); return; }
    if (!phone.trim()) { setMessage('Please enter your phone number.'); setIsError(true); return; }
    if (files.length === 0) { setMessage('Please upload at least one document.'); setIsError(true); return; }
    if (!shopId) { setMessage('Shop could not be identified. Please use the QR code again.'); setIsError(true); return; }

    setUploading(true); setMessage(''); setIsError(false);

    try {
      for (const { file, copies, printType, doubleSided } of files) {
        const fileExt = file.name.split('.').pop();
        const newFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${newFileName}`;

        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
        if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        if (!urlData) throw new Error(`Could not get public URL for ${file.name}.`);

        const { error: dbError } = await supabase.from('uploads').insert({
            shop_id: shopId, customer_name: name, customer_phone: phone, filename: file.name, file_url: urlData.publicUrl,
            status: 'new', copies, print_type: printType, double_sided: doubleSided, paper_size: paperSize, binding,
            special_instructions: specialInstructions, payment_method: paymentMethod, agree_sms: agreeSms,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        if (dbError) throw new Error(`Failed to save order for ${file.name}: ${dbError.message}`);
      }
      setMessage('🎉 Order Submitted Successfully! Your documents are on their way to the print shop.');
      setIsError(false);
      setFiles([]); setName(''); setPhone(''); setSpecialInstructions('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setMessage(message);
      setIsError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCompleted = async () => {
    if (completedUpload) {
      const { error } = await supabase.from('uploads').update({ deleted_at: new Date().toISOString() }).eq('id', completedUpload.id);
      if (error) {
        setMessage('Error deleting document.');
        setIsError(true);
      } else {
        setMessage('Document deleted successfully.');
        setIsError(false);
      }
      setCompletedUpload(null);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
       <header className="bg-surface shadow-card sticky top-0 z-20">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-blue p-2 rounded-button">
              <Printer size={24} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-text-primary tracking-tight leading-section">{shopName}</h1>
              <p className="text-sm text-text-muted">Shop Code: {shopCode}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Customer Info */}
            <section className="bg-surface rounded-card shadow-card p-6">
              <h2 className="text-lg font-medium text-text-primary mb-4 leading-section">Your Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input className="w-full px-4 py-3 border border-primary-200 rounded-input focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
                <input className="w-full px-4 py-3 border border-primary-200 rounded-input focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" type="tel" placeholder="0712 345 678" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
              </div>
            </section>

            {/* File Upload */}
            <section className="bg-surface rounded-card shadow-card p-6">
              <h2 className="text-lg font-medium text-text-primary mb-4 leading-section">Upload Files</h2>
              <div 
                className={`border-2 border-dashed rounded-card p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-primary-200 hover:border-primary-400'}`} 
                onClick={() => fileInputRef.current?.click()} 
                onDragEnter={e => handleDragActivity(e, true)} 
                onDragLeave={e => handleDragActivity(e, false)} 
                onDragOver={e => handleDragActivity(e, true)} 
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-10 w-10 text-secondary" />
                <p className="mt-2 font-medium text-text-secondary">Click to upload or drag & drop</p>
                <p className="text-sm text-text-muted">PDF, JPG, PNG, DOC (Max 50MB)</p>
                <input ref={fileInputRef} type="file" multiple onChange={e => handleFileChange(e.target.files)} className="hidden" accept={ALLOWED_TYPES.join(',')} />
              </div>
            </section>

            {/* File List & Options */}
            {files.length > 0 && (
              <section className="bg-surface rounded-card shadow-card p-6 space-y-6">
                <h2 className="text-lg font-medium text-text-primary leading-section">Your Documents</h2>
                {files.map((item, index) => (
                  <div key={index} className="border-t border-primary-200 pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-primary-400"/>
                        <p className="font-medium text-text-primary truncate pr-4">{item.file.name}</p>
                      </div>
                      <button onClick={() => removeFile(index)} className="text-secondary hover:text-error p-1 rounded-full transition-colors"><X size={18}/></button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center space-x-2">
                        <Copy className="h-5 w-5 text-secondary" />
                        <select className="w-full bg-primary-50 border-transparent rounded-input py-2 px-2 text-sm" value={item.copies} onChange={e => updateFileOption(index, 'copies', parseInt(e.target.value))}>
                          {[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1} Cop{i > 0 ? 'ies' : 'y'}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Palette className="h-5 w-5 text-secondary" />
                        <select className="w-full bg-primary-50 border-transparent rounded-input py-2 px-2 text-sm" value={item.printType} onChange={e => updateFileOption(index, 'printType', e.target.value)}>
                          <option value="B&W">B&W</option>
                          <option value="Color">Color</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                         <Layers className="h-5 w-5 text-secondary" />
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={item.doubleSided} onChange={e => updateFileOption(index, 'doubleSided', e.target.checked)} className="h-4 w-4 rounded text-primary-500 focus:ring-primary-500" />
                          <span className="text-sm font-medium text-text-secondary">Double-sided</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            <section className="bg-surface rounded-card shadow-card p-6">
                <h2 className="text-lg font-medium text-text-primary mb-4 leading-section">Print Options</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Paper Size</label>
                    <select className="w-full mt-1 px-3 py-2 border border-primary-200 rounded-input" value={paperSize} onChange={e => setPaperSize(e.target.value)}><option>A4</option><option>A3</option><option>Letter</option></select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Binding</label>
                    <select className="w-full mt-1 px-3 py-2 border border-primary-200 rounded-input" value={binding} onChange={e => setBinding(e.target.value)}><option>None</option><option>Spiral</option><option>Stapled</option></select>
                  </div>
                  <textarea className="w-full mt-1 px-3 py-2 border border-primary-200 rounded-input" placeholder="Special Instructions (e.g., print pages 3-5 only)" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={3}></textarea>
                </div>
            </section>
            
            <section className="bg-surface rounded-card shadow-card p-6">
              <h2 className="text-lg font-medium text-text-primary mb-4 leading-section">Payment</h2>
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setPaymentMethod('MPesa')} className={`py-3 px-4 rounded-button font-medium text-center transition-all border-2 ${paymentMethod === 'MPesa' ? 'bg-success text-white border-transparent shadow-card' : 'bg-surface text-text-primary border-primary-200 hover:border-primary-400'}`}>MPesa</button>
                  <button onClick={() => setPaymentMethod('Cash')} className={`py-3 px-4 rounded-button font-medium text-center transition-all border-2 ${paymentMethod === 'Cash' ? 'bg-primary-blue text-white border-transparent shadow-card' : 'bg-surface text-text-primary border-primary-200 hover:border-primary-400'}`}>Cash</button>
              </div>
              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={agreeSms} onChange={e => setAgreeSms(e.target.checked)} className="h-4 w-4 rounded text-primary-500 focus:ring-primary-500" />
                  <span className="text-xs text-text-muted">I agree to receive SMS notifications about my order status</span>
                </label>
              </div>
            </section>

            <div className="bg-surface rounded-card shadow-card p-6 sticky top-28">
                <h3 className="text-lg font-medium text-text-primary mb-3 leading-section">Total Cost</h3>
                <div className="space-y-2 text-sm">
                    {files.length === 0 && <p className="text-text-muted">Your printing costs will appear here.</p>}
                    {files.map((item, index) => (
                         <div key={index} className="flex justify-between items-center">
                            <p className="text-text-secondary truncate max-w-[150px]">{item.copies} x {item.file.name}</p>
                            <p className="font-medium text-text-primary">KES {(item.copies * (item.printType === 'Color' ? 20:10) * (item.doubleSided ? 1.5:1)).toFixed(2)}</p>
                         </div>
                    ))}
                </div>
                <div className="border-t border-primary-200 my-3"></div>
                <div className="flex justify-between items-center">
                    <p className="font-medium text-text-primary">Total:</p>
                    <p className="font-semibold text-xl text-primary-blue">{calculateTotalCost()}</p>
                </div>
                <button onClick={handleSubmit} disabled={uploading || files.length === 0 || !name || !phone} className="w-full mt-4 text-lg bg-primary-blue text-white py-3 px-6 rounded-button font-medium hover:bg-primary-600 transition-all duration-200 transform hover:scale-105 shadow-card disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                    {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <span>Submit Order</span>}
                </button>
            </div>
          </div>
        </div>
        
        {message && (
          <div className={`fixed bottom-5 right-5 p-4 rounded-card shadow-card flex items-start space-x-3 ${isError ? 'bg-red-50 text-error' : 'bg-green-50 text-success'}`}>
              {isError ? <AlertTriangle className="h-5 w-5"/> : <CheckCircle className="h-5 w-5"/>}
              <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        {completedUpload && (
          <Notification 
            message={`Your document "${completedUpload.filename}" has been printed.`} 
            onClose={() => setCompletedUpload(null)} 
            onDelete={handleDeleteCompleted} 
          />
        )}
      </main>
    </div>
  )
}

export default CustomerUpload
