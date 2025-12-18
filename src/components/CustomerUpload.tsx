import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
]
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

function CustomerUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [customFilename, setCustomFilename] = useState('')
  const [shopCode, setShopCode] = useState('')
  const [shopId, setShopId] = useState<string | null>(null)

  useEffect(() => {
    const storedShopId = localStorage.getItem('shopId')
    const storedShopCode = localStorage.getItem('shopCode')
    const storedShopName = localStorage.getItem('shopName')
    if (storedShopId && storedShopCode) {
      setShopId(storedShopId)
      setShopCode(storedShopCode)
      setMessage(`Connected to ${storedShopName || 'shop'}. Ready to upload.`)
    } else {
      // Redirect back if no shop
      window.location.href = '/'
    }
  }, [])

  const validateFile = (selectedFile: File): string | null => {
    if (!selectedFile) return 'Please select a file to upload.'

    if (selectedFile.size > MAX_SIZE) return 'File size must be less than 20MB.'

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      return 'Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed.'
    }

    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    setCustomFilename(selectedFile ? selectedFile.name : '')
    setMessage('')
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file to upload.')
      return
    }

    if (!shopId) {
      setMessage('Please enter a valid shop code.')
      return
    }

    const validationError = validateFile(file)
    if (validationError) {
      setMessage(validationError)
      return
    }

    setUploading(true)
    setMessage('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) {
      setMessage('Upload failed. Please try again.')
    } else {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const fileUrl = data.publicUrl

      const { error: dbError } = await supabase
        .from('uploads')
        .insert([{ filename: customFilename || file.name, file_url: fileUrl, shop_id: shopId, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }])

      if (dbError) {
        setMessage('File uploaded, but there was an issue saving details. Please contact support.')
      } else {
        setMessage('File uploaded successfully!')
        setFile(null)
        setCustomFilename('')
      }
    }

    setUploading(false)
  }

  return (
    <div>
      <h1>Quick Print - Document Upload</h1>
      <input
        type="text"
        value={shopCode}
        disabled
        placeholder="Shop code"
      />
      <input type="file" onChange={handleFileChange} />
      <input
        type="text"
        value={customFilename}
        onChange={(e) => setCustomFilename(e.target.value)}
        placeholder="Enter file name"
      />
      <button onClick={handleUpload} disabled={uploading || !file || !shopId}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      <p>{message}</p>
    </div>
  )
}

export default CustomerUpload