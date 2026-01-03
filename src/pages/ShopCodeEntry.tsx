import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HelpCircle, ScanLine, AlertTriangle } from 'lucide-react';

function ShopCodeEntry() {
  const [shopCode, setShopCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramShopCode = params.get('shop');
    if (paramShopCode) {
      const upperCaseCode = paramShopCode.toUpperCase();
      setShopCode(upperCaseCode);
      validateAndProceed(upperCaseCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateAndProceed = async (code: string) => {
    if (!code) {
      setError('Please enter a shop code.');
      return;
    }
    setLoading(true);
    setError('');
    
    const { data, error: dbError } = await supabase
      .from('shops')
      .select('id, shop_name, shop_code')
      .eq('shop_code', code)
      .single();

    if (dbError || !data) {
      setError('Invalid shop code. Please check and try again.');
      setLoading(false);
      return;
    }

    localStorage.setItem('shopId', data.id);
    localStorage.setItem('shopName', data.shop_name);
    localStorage.setItem('shopCode', data.shop_code);

    navigate('/upload');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndProceed(shopCode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F9FF] p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <ScanLine size={32} className="mx-auto text-[#5B6B82]" />
          <img src="https://adwwxfuqvtddprlzbplo.supabase.co/storage/v1/object/sign/test%20images/images/QuickPrintLogo.png" alt="QuickPrint Logo" className="mx-auto mb-4 h-16" />
          <h1 className="text-2xl font-semibold text-[#0F1A2B] mt-4">Enter Shop Code</h1>
          <p className="text-sm text-[#5B6B82] mt-2">Please enter the code provided by the shop to continue.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[#5B6B82] mb-2 block sr-only">Shop Code</label>
              <div className="relative">
                <input
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-center tracking-widest font-bold text-2xl text-[#0F1A2B] placeholder:text-[#8A9BB8] focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]/50 focus:border-[#0A5CFF]"
                  type="text"
                  placeholder="ENTER CODE"
                  value={shopCode}
                  onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            {error && (
              <div className={`p-3 rounded-lg flex items-center space-x-3 text-sm bg-[#EF4444]/10 text-[#EF4444]`}>
                <div className="flex-shrink-0">
                    <AlertTriangle size={20}/>
                </div>
                <p className="font-medium leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A5CFF] text-white font-semibold py-3 px-4 rounded-[14px] hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Proceed</span>
                  <ArrowRight className="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1"/>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-2">
          <a href="#" className="text-sm text-[#5B6B82] hover:text-[#0A5CFF] flex items-center justify-center space-x-1 transition-colors">
            <HelpCircle size={16} />
            <span>Where do I find the shop code?</span>
          </a>
          <a href="/operator/login" className="text-sm text-[#5B6B82] hover:text-[#0A5CFF] transition-colors">
            Are you an operator?
          </a>
        </div>
      </div>
    </div>
  );
}

export default ShopCodeEntry;
