import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 25 * 1024 * 1024 // 25MB

interface FileWithOptions {
  file: File
  copies: number
  printType: 'Black & White' | 'Color'
  doubleSided: boolean
}

export default function CustomerUpload() {
  const [files, setFiles] = useState<FileWithOptions[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [shopId, setShopId] = useState<string | null>(null)
  const [shopName, setShopName] = useState('QuickPrint Cyber')
  const [shopCode, setShopCode] = useState('...')
  const [copies, setCopies] = useState(1)
  const [printType, setPrintType] = useState<'Black & White' | 'Color'>('Black & White')
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4')
  const [doubleSided, setDoubleSided] = useState(false)
  const [binding, setBinding] = useState<'No binding' | 'Stapled' | 'Spiral'>('No binding')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash')
  const [showSpecialInstructions, setShowSpecialInstructions] = useState(false)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [shopPricing, setShopPricing] = useState({
    price_bw: 10,
    price_color: 20,
    price_a3: 15,
    discount_doublesided: 50, // percentage
    price_staples: 5,
    price_spiral: 20,
    price_lamination: 10
  })

  useEffect(() => {
    const storedShopId = localStorage.getItem('shopId')
    const storedShopName = localStorage.getItem('shopName')
    const storedShopCode = localStorage.getItem('shopCode')
    if (storedShopId) {
      setShopId(storedShopId)
      setShopName(storedShopName || 'QuickPrint Cyber')
      setShopCode(storedShopCode || '...')

      // Fetch shop pricing
      const fetchShopPricing = async () => {
        try {
          const { data, error } = await supabase
            .from('shops')
            .select('price_bw, price_color, price_a3, discount_doublesided, price_staples, price_spiral, price_lamination')
            .eq('id', storedShopId)
            .single()

          if (data && !error) {
            setShopPricing({
              price_bw: data.price_bw || 10,
              price_color: data.price_color || 20,
              price_a3: data.price_a3 || 15,
              discount_doublesided: data.discount_doublesided || 50,
              price_staples: data.price_staples || 5,
              price_spiral: data.price_spiral || 20,
              price_lamination: data.price_lamination || 10
            })
          }
        } catch (error) {
          console.error('Error fetching shop pricing:', error)
        }
      }

      fetchShopPricing()
    }
  }, [])

  useEffect(() => {
    if (message && !isError && !uploading) {
      // Auto-hide success messages after 8 seconds
      const timer = setTimeout(() => {
        setMessage('')
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [message, isError, uploading])

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return `File size must be less than 25MB.`
    if (!ALLOWED_TYPES.includes(file.type)) return `Only PDF, DOCX, PPT, XLSX, JPG, PNG files are allowed.`
    return null
  }

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    let validationError: string | null = null
    const newFiles: FileWithOptions[] = Array.from(selectedFiles).reduce((acc: FileWithOptions[], file) => {
      const error = validateFile(file)
      if (error) {
        validationError = `${error} ${file.name} will not be added.`
        return acc
      }
      acc.push({ file, copies: 1, printType: 'Black & White', doubleSided: false })
      return acc
    }, [])
    setFiles(prev => [...prev, ...newFiles])
    if (validationError) {
      setMessage(validationError)
      setIsError(true)
    } else if (newFiles.length > 0) {
      setMessage(`${newFiles.length} file(s) selected successfully.`)
      setIsError(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files) handleFileChange(e.dataTransfer.files)
  }

  const handleDragActivity = (e: React.DragEvent<HTMLDivElement>, isActive: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(isActive)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const calculateTotalCost = () => {
    if (files.length === 0) return 'KES 0.00'

    const cost = files.reduce((acc, item) => {
      // Base price per page based on print type
      let basePrice = item.printType === 'Color' ? shopPricing.price_color : shopPricing.price_bw

      // Adjust for paper size (A3 costs more)
      if (paperSize === 'A3') {
        basePrice = shopPricing.price_a3
      }

      // Adjust for double-sided (apply discount)
      if (doubleSided) {
        basePrice = basePrice * (1 - shopPricing.discount_doublesided / 100)
      }

      // Calculate cost for this file
      let itemCost = basePrice * copies

      // Add binding costs
      if (binding === 'Stapled') {
        itemCost += shopPricing.price_staples
      } else if (binding === 'Spiral') {
        itemCost += shopPricing.price_spiral
      }

      return acc + itemCost
    }, 0)

    return `KES ${cost.toFixed(2)}`
  }

  const handleSubmit = async () => {
    // Client-side validation
    if (files.length === 0) {
      setMessage('Please select at least one document to print.')
      setIsError(true)
      return
    }

    if (!shopId) {
      setMessage('Unable to connect to the print shop. Please scan the QR code again or contact support.')
      setIsError(true)
      return
    }

    if (phone && phone.length < 9) {
      setMessage('Please enter a valid phone number (at least 9 digits).')
      setIsError(true)
      return
    }

    if (name && name.trim().length < 2) {
      setMessage('Please enter a valid name (at least 2 characters).')
      setIsError(true)
      return
    }

    setUploading(true)
    setMessage('')
    setIsError(false)

    try {
      // Update progress message
      setMessage('Preparing your files for upload...')

      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i]
        const file = fileItem.file

        setMessage(`Uploading ${file.name} (${i + 1}/${files.length})...`)

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const timestamp = Date.now()
        const randomId = Math.random().toString(36).substring(2, 15)
        const newFileName = `${timestamp}_${randomId}.${fileExt}`
        const filePath = `uploads/${newFileName}`

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          if (uploadError.message.includes('Duplicate')) {
            // Retry with new filename
            const retryFileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExt}`
            const retryPath = `uploads/${retryFileName}`
            const { error: retryError } = await supabase.storage
              .from('documents')
              .upload(retryPath, file)
            if (retryError) {
              throw new Error(`Failed to upload ${file.name}. Please try again or contact support if the problem persists.`)
            }
          } else if (uploadError.message.includes('size')) {
            throw new Error(`File ${file.name} is too large. Maximum size is 25MB per file.`)
          } else {
            throw new Error(`Upload failed for ${file.name}. Please check your connection and try again.`)
          }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath)

        if (!urlData?.publicUrl) {
          throw new Error(`Failed to get file URL for ${file.name}. Please contact support.`)
        }

        setMessage(`Saving order details for ${file.name}...`)

        // Save to database
        const { error: dbError } = await supabase.from('uploads').insert({
          shop_id: shopId,
          customer_name: name.trim() || null,
          customer_phone: phone || null,
          filename: file.name,
          file_url: urlData.publicUrl,
          status: 'new',
          copies: copies,
          print_type: printType,
          double_sided: doubleSided,
          paper_size: paperSize,
          binding: binding,
          payment_method: paymentMethod,
          special_instructions: specialInstructions.trim() || null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })

        if (dbError) {
          console.error('Database error:', dbError)
          // Try to clean up uploaded file
          await supabase.storage.from('documents').remove([filePath])

          if (dbError.message.includes('duplicate key')) {
            throw new Error('This order appears to have been submitted already. Please try again.')
          } else if (dbError.message.includes('foreign key')) {
            throw new Error('Print shop connection lost. Please scan the QR code again.')
          } else {
            throw new Error('Failed to save order details. Please contact support with error code: DB_SAVE_FAILED')
          }
        }
      }

      // Success
      setMessage(`🎉 Order submitted successfully! Your documents have been sent to ${shopName}. The cyber operator will start printing shortly. Please proceed to the counter to complete payment and collect your prints.`)
      setIsError(false)

      // Reset form
      setFiles([])
      setName('')
      setPhone('')
      setSpecialInstructions('')
      setShowSpecialInstructions(false)
      setCopies(1)
      setPrintType('Black & White')
      setPaperSize('A4')
      setDoubleSided(false)
      setBinding('No binding')
      setPaymentMethod('Cash')

    } catch (error: unknown) {
      console.error('Submission error:', error)

      let userFriendlyMessage = 'An unexpected error occurred. Please try again or contact support.'

      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()

        // Network/connection errors
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          userFriendlyMessage = 'Connection lost. Please check your internet connection and try again.'
        }
        // Timeout errors
        else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
          userFriendlyMessage = 'Upload timed out. Please try again with fewer or smaller files.'
        }
        // Storage quota errors
        else if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
          userFriendlyMessage = 'Storage limit reached. Please contact support or try again later.'
        }
        // Permission errors
        else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
          userFriendlyMessage = 'Access denied. Please refresh the page and scan the QR code again.'
        }
        // Server errors
        else if (errorMessage.includes('500') || errorMessage.includes('server error')) {
          userFriendlyMessage = 'Server temporarily unavailable. Please try again in a few minutes or contact support.'
        }
        // Use the custom error message if it's already user-friendly
        else if (!errorMessage.includes('error:') && !errorMessage.includes('code:')) {
          userFriendlyMessage = error.message
        }
      }

      setMessage(userFriendlyMessage)
      setIsError(true)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <img src="https://adwwxfuqvtddprlzbplo.supabase.co/storage/v1/object/sign/test%20images/images/Quickprint_icon.png" alt="QuickPrint Icon" className="inline-block mr-2 h-6" />
              <h1 className="text-lg font-bold">QuickPrint</h1>
              <p className="text-xs text-blue-100">Print Shop Management</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Connected to {shopName}</div>
            <div className="text-xs text-blue-100">Shop Code: {shopCode}</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-800">
            Upload Your Documents
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Your files go directly to the cyber operator. No confusion.
          </p>
        </div>

        {/* Upload Card */}
        <div
          className={`bg-white border-2 border-dashed rounded-lg p-8 text-center shadow-sm mb-6 cursor-pointer transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-blue-300 hover:border-blue-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => handleDragActivity(e, true)}
          onDragLeave={(e) => handleDragActivity(e, false)}
          onDragOver={(e) => handleDragActivity(e, true)}
          onDrop={handleDrop}
        >
          <div className="flex justify-center mb-4 text-blue-600 text-3xl">
            ☁️
          </div>
          <p className="font-medium text-slate-700">
            Tap to upload or drag your files here
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Maximum file size: 25MB per file
          </p>
          <p className="text-xs text-slate-400 mt-1">
            PDF, DOCX, PPT, XLSX, JPG, PNG
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
            accept=".pdf,.docx,.ppt,.pptx,.xlsx,.xls,.jpg,.jpeg,.png"
          />
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-slate-800 mb-4">Selected Files</h2>
            <div className="space-y-3">
              {files.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-600">📄</span>
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                      {item.file.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({(item.file.size / 1024 / 1024).toFixed(1)}MB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Options */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            Print Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Copies */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Number of Copies
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                  className="w-8 h-8 border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-10 text-center font-medium">{copies}</span>
                <button
                  onClick={() => setCopies(copies + 1)}
                  className="w-8 h-8 border border-slate-300 rounded hover:bg-slate-100 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Print Type */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Print Type
              </label>
              <select
                value={printType}
                onChange={(e) => setPrintType(e.target.value as 'Black & White' | 'Color')}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Black & White</option>
                <option>Color</option>
              </select>
            </div>

            {/* Paper Size */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Paper Size
              </label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as 'A4' | 'A3')}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>A4</option>
                <option>A3</option>
              </select>
            </div>

            {/* Double Sided */}
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={doubleSided}
                onChange={(e) => setDoubleSided(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                Print on both sides
              </span>
            </div>

            {/* Binding */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Binding (Optional)
              </label>
              <select
                value={binding}
                onChange={(e) => setBinding(e.target.value as 'No binding' | 'Stapled' | 'Spiral')}
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>No binding</option>
                <option>Stapled</option>
                <option>Spiral</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowSpecialInstructions(!showSpecialInstructions)}
            className="text-blue-600 text-sm mt-4 hover:text-blue-700"
          >
            {showSpecialInstructions ? '− Hide special instructions' : '+ Special instructions (optional)'}
          </button>

          {showSpecialInstructions && (
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Enter any special instructions..."
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm mt-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          )}
        </div>

        {/* Customer Details */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-slate-800 mb-4">
            Customer Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your Name (Optional)"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone Number (Optional)"
            />
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Your information is used only for this print job and is automatically deleted after completion.
          </p>
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-4">
            Preferred Payment Method
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Select your preferred payment method for this order
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`py-3 px-4 rounded-lg font-semibold text-center transition-all border-2 ${
                paymentMethod === 'Cash'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-blue-600 border-blue-300 hover:border-blue-500'
              }`}
            >
              💵 Cash
            </button>
            <button
              onClick={() => setPaymentMethod('M-Pesa')}
              className={`py-3 px-4 rounded-lg font-semibold text-center transition-all border-2 ${
                paymentMethod === 'M-Pesa'
                  ? 'bg-green-600 text-white border-green-600 shadow-md'
                  : 'bg-white text-green-600 border-green-300 hover:border-green-500'
              }`}
            >
              📱 M-Pesa
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Payment method selection helps us improve our services. Actual payment will be handled at the counter.
          </p>
        </div>

        {/* Cost Summary */}
        {files.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Estimated Cost:</span>
              <span className="text-lg font-bold text-blue-600">{calculateTotalCost()}</span>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={uploading || files.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending to Cyber...
            </>
          ) : (
            'Send to Cyber for Printing'
          )}
        </button>

        <p className="text-xs text-slate-500 text-center mt-3">
          Your files are securely sent and auto-deleted after printing
        </p>

        {/* Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg border ${
            isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : uploading
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isError && <span className="text-red-600 text-lg">⚠️</span>}
                {uploading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
                {!isError && !uploading && <span className="text-green-600 text-lg">✅</span>}
                <p className="font-medium">{message}</p>
              </div>
              {isError && (
                <button
                  onClick={() => setMessage('')}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
