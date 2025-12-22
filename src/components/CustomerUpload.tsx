import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Upload, FileText, X, DollarSign, Printer } from 'lucide-react'

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
  const [toast, setToast] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [shopCode, setShopCode] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopId, setShopId] = useState<string | null>(null)
  const [paperSize, setPaperSize] = useState('A4')
  const [binding, setBinding] = useState('None')
  const [specialInstructions, setSpecialInstructions] = useState('')

  useEffect(() => {
    const storedShopId = localStorage.getItem('shopId')
    const storedShopCode = localStorage.getItem('shopCode')
    const storedShopName = localStorage.getItem('shopName')
    if (storedShopId && storedShopCode) {
      setShopId(storedShopId)
      setShopCode(storedShopCode)
      setShopName(storedShopName || 'Cyber Cafe Downtown')
    } else {
      setShopCode('ABC123')
      setShopName('Cyber Cafe Downtown')
    }
  }, [])

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return 'File size must be less than 50MB.'
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only PDF, DOC, DOCX, JPG, PNG files are allowed.'
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter(file => !validateFile(file))
    const filesWithOptions: FileWithOptions[] = validFiles.map(file => ({
      file,
      copies: 1,
      printType: 'B&W' as const,
      doubleSided: true
    }))
    setFiles(prev => [...prev, ...filesWithOptions])
    if (validFiles.length > 0) {
      setToast('Files added successfully!')
      setTimeout(() => setToast(''), 3000)
    }
    if (selectedFiles.length !== validFiles.length) {
      setMessage('Some files were skipped due to validation errors.')
    } else {
      setMessage('')
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter(file => !validateFile(file))
    const filesWithOptions: FileWithOptions[] = validFiles.map(file => ({
      file,
      copies: 1,
      printType: 'B&W' as const,
      doubleSided: true
    }))
    setFiles(prev => [...prev, ...filesWithOptions])
    if (validFiles.length > 0) {
      setToast('Files added successfully!')
      setTimeout(() => setToast(''), 3000)
    }
    if (droppedFiles.length !== validFiles.length) {
      setMessage('Some files were skipped due to validation errors.')
    } else {
      setMessage('')
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateFileOption = (index: number, key: keyof FileWithOptions, value: string | number | boolean) => {
    setFiles(prev => prev.map((item, i) => i === index ? { ...item, [key]: value } : item))
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    setPhone(value)
  }

  const calculateTotalCost = () => {
    // Placeholder calculation - coming soon
    return 'YES 20'
  }

  const handleContinue = async () => {
    if (!name) {
      setMessage('Please enter your name.')
      return
    }
    if (!phone) {
      setMessage('Please enter your phone number.')
      return
    }
    if (files.length === 0) {
      setMessage('Please upload at least one file.')
      return
    }
    if (!shopId) {
      setMessage('Shop not configured.')
      return
    }

    setUploading(true)
    setMessage('')

    for (const fileWithOptions of files) {
      const { file } = fileWithOptions
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (error) {
        setMessage('Upload failed. Please try again.')
        setUploading(false)
        return
      }

      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const fileUrl = data.publicUrl

      const { error: dbError } = await supabase
        .from('uploads')
        .insert([{ 
          filename: file.name, 
          file_url: fileUrl, 
          shop_id: shopId, 
          customer_name: name,
          customer_phone: phone,
          status: 'new',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() 
        }])

      if (dbError) {
        setMessage('File uploaded, but there was an issue saving details.')
        setUploading(false)
        return
      }
    }

    setMessage('Files uploaded successfully!')
    setFiles([])
    setUploading(false)
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight">{shopName || 'QuickPrint Cyber'}</h1>
              <p className="text-blue-100 text-sm mt-1">Fast & Easy Print Orders</p>
              {shopCode && (
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    Shop Code: {shopCode}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-lg">QP</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-4">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Customer Info & Upload */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information */}
            <section className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-sm border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">👤</span>
                </div>
                Your Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="0772345678"
                    className="w-full px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                  />
                </div>
              </div>
            </section>

            {/* File Upload Section */}
            <section className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  Upload files
                </h2>
                <span className="text-sm text-blue-600 font-medium bg-blue-100 px-3 py-1 rounded-full">Max 50 MB</span>
              </div>

              {/* Upload Box */}
              <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${files.length > 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`} onDrop={handleDrop} onDragOver={handleDragOver}>
                <Upload className={`w-16 h-16 mx-auto mb-4 ${files.length > 0 ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-lg text-gray-600 mb-2">
                  <label htmlFor="fileInput" className="text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer">
                    Click to upload files
                  </label>{' '}
                  or drag and drop
                </p>
                <p className="text-sm text-gray-500">PDF, DOC, DOCX, JPG, PNG</p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="fileInput"
                />
              </div>

              {/* Uploaded Files */}
              {files.map((fileWithOptions, index) => (
                <div key={index} className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{fileWithOptions.file.name}</h3>
                        <p className="text-sm text-gray-600">1 page • {(fileWithOptions.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* File Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Copies
                      </label>
                      <input
                        type="number"
                        value={fileWithOptions.copies}
                        onChange={(e) => updateFileOption(index, 'copies', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <div className="flex space-x-2">
                        <button
                          className={`flex-1 py-2 rounded-lg border ${fileWithOptions.printType === 'B&W' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          onClick={() => updateFileOption(index, 'printType', 'B&W')}
                        >
                          B&W
                        </button>
                        <button
                          className={`flex-1 py-2 rounded-lg border ${fileWithOptions.printType === 'Color' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          onClick={() => updateFileOption(index, 'printType', 'Color')}
                        >
                          Color
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Double-sided
                      </label>
                      <div className="flex space-x-2">
                        <button
                          className={`flex-1 py-2 rounded-lg border ${!fileWithOptions.doubleSided ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}
                          onClick={() => updateFileOption(index, 'doubleSided', false)}
                        >
                          No
                        </button>
                        <button
                          className={`flex-1 py-2 rounded-lg border ${fileWithOptions.doubleSided ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                          onClick={() => updateFileOption(index, 'doubleSided', true)}
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Print Options */}
            <section className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-sm border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <Printer className="w-5 h-5 text-blue-600" />
                </div>
                Print Options
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Paper Size */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Paper Size</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['A4', 'A3', 'Letter', 'Legal'].map(size => (
                      <button
                        key={size}
                        className={`py-3 rounded-xl border font-medium ${paperSize === size ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => setPaperSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Binding */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Binding <span className="text-xs text-orange-600 font-normal">(Coming Soon)</span></h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['None', 'Spiral', 'Stapled', 'Hardcover'].map(bind => (
                      <button
                        key={bind}
                        className={`py-3 rounded-xl border font-medium ${binding === bind ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} disabled:opacity-50`}
                        onClick={() => setBinding(bind)}
                        disabled
                      >
                        {bind}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Special Instructions (Optional)
                </h3>
                <textarea
                  placeholder="My special request"
                  className="w-full h-32 px-4 py-3 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white/50 backdrop-blur-sm"
                  rows={3}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods <span className="text-xs text-orange-600 font-normal">(Coming Soon)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    className="p-4 bg-green-50 rounded-xl border-2 border-green-500 flex items-center justify-center space-x-4 disabled:opacity-50"
                    disabled
                  >
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-green-600">M</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">MPesa</span>
                  </button>

                  <button
                    className="p-4 bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center space-x-4 hover:border-gray-300 disabled:opacity-50"
                    disabled
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold text-gray-900">Cash</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-300 shadow-lg sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5 text-blue-700" />
                </div>
                Total Cost
              </h2>

              {/* Order Summary */}
              <div className="space-y-6">
                <div className="text-sm text-gray-600 bg-white/50 py-2 px-3 rounded-lg">
                  <p>{files.length} file{files.length !== 1 ? 's' : ''} • {files.reduce((sum, f) => sum + f.copies, 0)} print{files.reduce((sum, f) => sum + f.copies, 0) !== 1 ? 's' : ''}</p>
                </div>

                {/* File Details */}
                {files.map((fileWithOptions, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{fileWithOptions.file.name}</h3>
                        <p className="text-sm text-gray-600">{fileWithOptions.copies} cop{fileWithOptions.copies !== 1 ? 'ies' : 'y'} • {fileWithOptions.printType} • {fileWithOptions.doubleSided ? 'Double-sided' : 'Single-sided'}</p>
                      </div>
                      <span className="font-bold text-blue-600">{calculateTotalCost()}</span>
                    </div>
                  </div>
                ))}

                {/* Total Cost Display */}
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-5 border border-blue-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-semibold text-gray-900">Total Cost:</span>
                    <span className="text-2xl font-bold text-blue-700">{calculateTotalCost()}</span>
                  </div>
                  <p className="text-sm text-gray-600">Including all taxes and charges</p>
                </div>

                {/* Submit Button */}
                <button
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={uploading || !name || !phone || files.length === 0}
                  onClick={handleContinue}
                >
                  {uploading ? 'Uploading...' : 'Submit Order'}
                </button>

                {/* Additional Info */}
                <div className="text-xs text-gray-500 text-center space-y-1 pt-4">
                  <p>• Files are automatically deleted after 7 days</p>
                  <p>• Estimated completion: 15-20 minutes</p>
                  <p>• Need help? Call 0700-123-456</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-800 px-4 py-3 rounded-xl shadow-lg" role="alert">
          <span className="block sm:inline">{toast}</span>
        </div>
      )}
    </div>
  )
}

export default CustomerUpload