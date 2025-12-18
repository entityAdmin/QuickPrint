import { useState } from 'react'
import { supabase } from '../supabaseClient'

function Customer() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [customFilename, setCustomFilename] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
      setCustomFilename(e.target.files[0].name) // Pre-fill with original name
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setMessage('')

    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (error) {
      setMessage('Error uploading file: ' + error.message)
    } else {
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      const fileUrl = data.publicUrl

      // Insert into DB
      const { error: dbError } = await supabase
        .from('uploads')
        .insert([{ filename: customFilename || file.name, file_url: fileUrl }])

      if (dbError) {
        setMessage('File uploaded, but DB error: ' + dbError.message)
      } else {
        setMessage('File uploaded successfully!')
      }
    }

    setUploading(false)
  }

  return (
    <div>
      <h1>Quick Print - Document Upload</h1>
      <input type="file" onChange={handleFileChange} />
      <input 
        type="text" 
        value={customFilename} 
        onChange={(e) => setCustomFilename(e.target.value)} 
        placeholder="Enter file name" 
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      <p>{message}</p>
    </div>
  )
}

export default Customer