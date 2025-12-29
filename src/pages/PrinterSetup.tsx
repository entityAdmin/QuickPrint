import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Printer, Settings, TestTube } from 'lucide-react'

interface PrinterSettings {
  connectionMethod: 'browser' | 'network' | 'usb'
  paperSize: 'A4' | 'A3' | 'Letter'
  color: 'B&W' | 'Color'
  duplex: boolean
}

function PrinterSetup() {
  const [settings, setSettings] = useState<PrinterSettings>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('printerSettings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error loading printer settings:', e)
      }
    }
    return {
      connectionMethod: 'browser',
      paperSize: 'A4',
      color: 'B&W',
      duplex: false
    }
  })

  const saveSettings = () => {
    localStorage.setItem('printerSettings', JSON.stringify(settings))
    alert('Printer settings saved successfully!')
  }

  const testPrint = () => {
    // Create a test print content
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Test Print - QuickPrint</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .test-content { border: 1px solid #ccc; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>QuickPrint Test Page</h1>
              <p>Printer Settings Test</p>
            </div>
            <div class="test-content">
              <p><strong>Connection Method:</strong> ${settings.connectionMethod}</p>
              <p><strong>Paper Size:</strong> ${settings.paperSize}</p>
              <p><strong>Print Type:</strong> ${settings.color}</p>
              <p><strong>Duplex:</strong> ${settings.duplex ? 'Yes' : 'No'}</p>
              <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              <p>This is a test print to verify your printer configuration.</p>
              <p>If you can see this page, your browser print settings are working correctly.</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const updateSetting = (key: keyof PrinterSettings, value: PrinterSettings[keyof PrinterSettings]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      <header style={{ background: 'linear-gradient(135deg, #0A5CFF 0%, #4DA3FF 100%)' }} className="text-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto p-4 flex items-center">
          <Link to="/operator" className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Printer className="w-8 h-8 text-[#0A5CFF]" />
            <h1 className="text-2xl font-bold text-[#0F1A2B]">Printer Setup</h1>
          </div>
          <p className="text-gray-500 mb-8">Configure your printing preferences and test your setup.</p>

          <div className="space-y-8">
            {/* Connection Method */}
            <section>
              <h2 className="text-lg font-semibold text-[#0F1A2B] mb-4">Printer Connection</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => updateSetting('connectionMethod', 'browser')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.connectionMethod === 'browser'
                      ? 'border-[#0A5CFF] bg-blue-50 text-[#0A5CFF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Printer className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Browser Print</div>
                  <div className="text-xs text-gray-500">Use browser's print dialog</div>
                </button>
                <button
                  onClick={() => updateSetting('connectionMethod', 'network')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.connectionMethod === 'network'
                      ? 'border-[#0A5CFF] bg-blue-50 text-[#0A5CFF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Settings className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Network Printer</div>
                  <div className="text-xs text-gray-500">IP-based network printer</div>
                </button>
                <button
                  onClick={() => updateSetting('connectionMethod', 'usb')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.connectionMethod === 'usb'
                      ? 'border-[#0A5CFF] bg-blue-50 text-[#0A5CFF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Printer className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">USB Printer</div>
                  <div className="text-xs text-gray-500">Direct USB connection</div>
                </button>
              </div>
            </section>

            {/* Default Print Settings */}
            <section>
              <h2 className="text-lg font-semibold text-[#0F1A2B] mb-4">Default Print Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Paper Size</label>
                  <select
                    value={settings.paperSize}
                    onChange={(e) => updateSetting('paperSize', e.target.value as PrinterSettings['paperSize'])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="Letter">Letter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Print Type</label>
                  <select
                    value={settings.color}
                    onChange={(e) => updateSetting('color', e.target.value as PrinterSettings['color'])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="B&W">Black & White</option>
                    <option value="Color">Color</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.duplex}
                    onChange={(e) => updateSetting('duplex', e.target.checked)}
                    className="h-4 w-4 rounded text-[#0A5CFF] focus:ring-[#4DA3FF]"
                  />
                  <span className="text-sm font-medium text-gray-600">Double-sided printing</span>
                </label>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <button
                onClick={saveSettings}
                className="flex-1 bg-gradient-to-r from-[#0A5CFF] to-[#4DA3FF] text-white font-semibold py-3 px-6 rounded-xl hover:from-[#0948CC] hover:to-[#3B8CFF] transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Save Settings
              </button>
              <button
                onClick={testPrint}
                className="flex-1 bg-white border-2 border-[#0A5CFF] text-[#0A5CFF] font-semibold py-3 px-6 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <TestTube className="w-5 h-5" />
                <span>Test Print</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PrinterSetup