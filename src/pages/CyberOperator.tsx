import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import QRCode from 'qrcode'

interface Upload {
  id: number
  filename: string
  file_url: string
  created_at: string
  expires_at: string
}

function Operator() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [shopCode, setShopCode] = useState('')
  const [shopId, setShopId] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        window.location.href = '/operator/login'
        return
      }

      // Get shop for this operator
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id, shop_code, shop_name')
        .eq('operator_user_id', user.id)
        .single()

      if (shopError || !shopData) {
        alert('No shop found for your account.')
        await supabase.auth.signOut()
        window.location.href = '/operator/login'
        return
      }

      setShopId(shopData.id)
      setShopCode(shopData.shop_code)
      fetchUploads(shopData.id)
      generateQR(shopData.shop_code)
    }

    checkAuthAndLoad()
  }, [])

  const fetchUploads = async (id: string) => {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .eq('shop_id', id)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching uploads:', error)
      // In production, silently fail or show user-friendly message
    } else {
      setUploads(data || [])
    }
  }

  const generateQR = async (code: string) => {
    const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173'
    const url = `${baseUrl}/?shop=${code}`
    setQrUrl(url)
    if (qrCanvasRef.current) {
      await QRCode.toCanvas(qrCanvasRef.current, url)
    }
  }

  const downloadQR = () => {
    if (qrCanvasRef.current) {
      const link = document.createElement('a')
      link.download = `shop-${shopCode}-qr.png`
      link.href = qrCanvasRef.current.toDataURL()
      link.click()
    }
  }

  const handleDelete = async (uploadId: number) => {
    if (window.confirm('Are you sure you want to delete this file? It will no longer be accessible.')) {
      const { error } = await supabase
        .from('uploads')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', uploadId)

      if (error) {
        alert('Error deleting file.')
      } else {
        fetchUploads(shopId!) // Refresh
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/operator/login'
  }

  return (
    <div>
      <h1>Operator Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      {shopId && (
        <>
          <h2>Shop Code: {shopCode}</h2>
          <h2>QR Code for Customers</h2>
          <canvas ref={qrCanvasRef}></canvas>
          <br />
          <button onClick={downloadQR}>Download QR Code</button>
          <p>URL: {qrUrl}</p>
        </>
      )}
      <h2>Uploaded Documents</h2>
      {uploads.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          {uploads.map((upload) => (
            <div key={upload.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px', width: '200px' }}>
              <h3>{upload.filename}</h3>
              <a href={upload.file_url} target="_blank" rel="noopener noreferrer">
                View/Download File
              </a>
              <p>Expires: {new Date(upload.expires_at).toLocaleString()}</p>
              <p>This file will be deleted automatically after expiry.</p>
              <button onClick={() => handleDelete(upload.id)}>Delete File</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Operator