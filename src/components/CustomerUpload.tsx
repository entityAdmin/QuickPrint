import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Upload, X, Printer, CheckCircle, AlertTriangle } from 'lucide-react'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

interface FileWithOptions {
  file: File
  copies: number
  printType: 'B&W' | 'Color'
  doubleSided: boolean
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
  const [color, setColor] = useState<'B&W' | 'Color'>('B&W');

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
  }, [])

  useEffect(() => {
    if (message && !isError) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, isError]);

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

  const updateFileOption = (index: number, key: keyof FileWithOptions, value: any) => {
    setFiles(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  }

  const calculateTotalCost = () => {
    const cost = files.reduce((acc, item) => {
        const pageCount = 1; // Placeholder for actual page count logic
        let itemCost = (color === 'Color' ? 20 : 10) * pageCount;
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
      for (const { file, copies, doubleSided } of files) {
        const fileExt = file.name.split('.').pop();
        const newFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${newFileName}`;

        const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
        if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
        if (!urlData) throw new Error(`Could not get public URL for ${file.name}.`);

        const { error: dbError } = await supabase.from('uploads').insert({
            shop_id: shopId, customer_name: name, customer_phone: phone, filename: file.name, file_url: urlData.publicUrl,
            status: 'new', copies, print_type: color, double_sided: doubleSided, paper_size: paperSize, binding,
            special_instructions: specialInstructions, payment_method: paymentMethod, agree_sms: agreeSms,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        if (dbError) throw new Error(`Failed to save order for ${file.name}: ${dbError.message}`);
      }
      setMessage('🎉 Order Submitted Successfully! Your documents are on their way to the print shop.');
      setIsError(false);
      setFiles([]); setName(''); setPhone(''); setSpecialInstructions('');
    } catch (error: any) {
      setMessage(error.message || 'An unexpected error occurred.');
      setIsError(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <header style={{ background: 'linear-gradient(135deg, #0A5CFF 0%, #4DA3FF 100%)' }} className="text-white shadow-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Printer size={28} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">{shopName}</h1>
              <p className="text-sm text-white/80">Shop Code: {shopCode}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <section className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-medium text-[#0F1A2B] mb-4">Your Information</h2>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-[#5B6B82]">Name</label><input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="text-sm font-medium text-[#5B6B82]">Phone Number</label><input type="tel" placeholder="0712345678" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} /></div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-medium text-[#0F1A2B] mb-4">Upload Files</h2>
          <div className={`border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-colors ${dragActive ? 'border-[#0A5CFF] bg-blue-50' : 'border-gray-300 hover:border-[#4DA3FF]'}`} onClick={() => fileInputRef.current?.click()} onDragEnter={e => handleDragActivity(e, true)} onDragLeave={e => handleDragActivity(e, false)} onDragOver={e => handleDragActivity(e, true)} onDrop={handleDrop}>
            <Upload className="mx-auto h-10 w-10 text-[#8A9BB8]" />
            <p className="mt-2 font-medium text-[#5B6B82]">Click to upload files</p>
            <p className="text-sm text-[#8A9BB8]">PDF, JPG, PNG, DOC (Max 50MB)</p>
            <input ref={fileInputRef} type="file" multiple onChange={e => handleFileChange(e.target.files)} className="hidden" accept={ALLOWED_TYPES.join(',')} />
          </div>
          {files.length > 0 && <div className="mt-6 space-y-4 pt-4 border-t border-gray-100">
            {files.map((item, index) => (
              <div key={index} className="space-y-4">
                <div className="flex justify-between items-start"><p className="font-medium text-[#0F1A2B] truncate pr-4">{item.file.name}</p><button onClick={() => removeFile(index)} className="text-[#8A9BB8] hover:text-[#EF4444] p-1"><X size={18}/></button></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div><label className="text-sm font-medium text-[#5B6B82]">Copies</label><select value={item.copies} onChange={e => updateFileOption(index, 'copies', parseInt(e.target.value))}>{[...Array(10).keys()].map(i => <option key={i+1} value={i+1}>{i+1}</option>)}</select></div>
                  <div><label className="text-sm font-medium text-[#5B6B82]">Type</label><select value={item.printType} onChange={e => updateFileOption(index, 'printType', e.target.value)}><option value="B&W">B&W</option><option value="Color">Color</option></select></div>
                  <div className="flex items-end pb-2"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={item.doubleSided} onChange={e => updateFileOption(index, 'doubleSided', e.target.checked)} className="h-4 w-4 rounded text-[#0A5CFF] focus:ring-[#4DA3FF]" /><span className="text-sm font-medium text-[#5B6B82]">Double-sided</span></label></div>
                </div>
              </div>
            ))}
          </div>}
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-lg font-medium text-[#0F1A2B] mb-4">Print Options</h2>
            <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-[#5B6B82]">Paper Size</label><select value={paperSize} onChange={e => setPaperSize(e.target.value)}><option>A4</option><option>A3</option><option>Letter</option></select></div>
                <div><label className="text-sm font-medium text-[#5B6B82]">Binding</label><select value={binding} onChange={e => setBinding(e.target.value)}><option>None</option><option>Spiral</option><option>Stapled</option></select></div>
                <div>
                  <label className="text-sm font-medium text-[#5B6B82]">Color</label>
                  <select value={color} onChange={e => setColor(e.target.value as 'B&W' | 'Color')}>
                    <option value="B&W">Black and White</option>
                    <option value="Color">Color</option>
                  </select>
                </div>
            </div>
            <div className="mt-4"><label className="text-sm font-medium text-[#5B6B82]">Special Instructions (Optional)</label><textarea placeholder="e.g., print pages 3-5 only, use glossy paper" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={3}></textarea></div>
        </section>

        <section className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-lg font-medium text-[#0F1A2B] mb-4">Payment Method</h2>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPaymentMethod('MPesa')} className={`p-4 rounded-[14px] font-semibold text-center transition-all border-2 ${paymentMethod === 'MPesa' ? 'bg-[#22C55E] text-white border-transparent shadow-md' : 'bg-white text-[#5B6B82] border-gray-200 hover:border-gray-300'}`}>MPesa</button>
                <button onClick={() => setPaymentMethod('Cash')} className={`p-4 rounded-[14px] font-semibold text-center transition-all border-2 ${paymentMethod === 'Cash' ? 'bg-[#0A5CFF] text-white border-transparent shadow-md' : 'bg-white text-[#5B6B82] border-gray-200 hover:border-gray-300'}`}>Cash</button>
            </div>
            <div className="mt-4"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={agreeSms} onChange={e => setAgreeSms(e.target.checked)} className="h-4 w-4 rounded text-[#0A5CFF] focus:ring-[#4DA3FF]" /><span className="text-xs text-[#8A9BB8]">I agree to receive SMS notifications about my order status</span></label></div>
        </section>

        <div className="bg-blue-50 border border-[#4DA3FF]/50 rounded-2xl shadow-xl p-8">
            <h2 className="text-lg font-medium text-[#0F1A2B] mb-3">Total Cost</h2>
            <div className="space-y-2 text-sm">
                {files.length === 0 && <p className="text-[#5B6B82]">Your printing costs will appear here.</p>}
                {files.map((item, index) => (
                     <div key={index} className="flex justify-between items-center">
                        <p className="text-[#5B6B82] truncate max-w-xs">{item.copies} x {item.file.name}</p>
                        <p className="font-medium text-[#0F1A2B]">KES {(item.copies * (color === 'Color' ? 20:10) * (item.doubleSided ? 1.5:1)).toFixed(2)}</p>
                     </div>
                ))}
            </div>
            <div className="border-t border-[#4DA3FF]/30 my-3"></div>
            <div className="flex justify-between items-center">
                <p className="font-semibold text-[#0F1A2B]">Total Cost:</p>
                <p className="font-bold text-xl text-[#0A5CFF]">{calculateTotalCost()}</p>
            </div>
        </div>

        <div className="pt-4">
            <button onClick={handleSubmit} disabled={uploading || files.length === 0 || !name || !phone} className="w-full text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
                {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <span>Submit Order</span>}
            </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg flex items-start space-x-3 ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600 animate-pulse'}`}>
              {isError ? <AlertTriangle className="h-5 w-5"/> : <CheckCircle className="h-5 w-5 animate-bounce"/>}
              <p className="text-sm font-medium">{message}</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default CustomerUpload
