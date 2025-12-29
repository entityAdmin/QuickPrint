import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle, AlertTriangle, ArrowRight, Store, Mail, Lock, Printer } from 'lucide-react';

function CreateShop() {
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateShopCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !email.trim() || !password.trim()) {
      setMessage('Please fill all fields.');
      setIsError(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setIsError(false);

    const { data: { user }, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setMessage(authError.message);
      setIsError(true);
      setLoading(false);
      return;
    }

    if (!user) {
        setMessage('Account created but user ID missing. Please contact support.');
        setIsError(true);
        setLoading(false);
        return;
    }

    let shopCode = generateShopCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data } = await supabase.from('shops').select('id').eq('shop_code', shopCode).single();
      if (!data) break;
      shopCode = generateShopCode();
      attempts++;
    }

    const { error: insertError } = await supabase
      .from('shops')
      .insert([{ shop_name: shopName, shop_code: shopCode, operator_user_id: user.id }]);

    if (insertError) {
      setMessage(insertError.message);
      setIsError(true);
    } else {
      setMessage(`Shop '''${shopName}''' created! Your Shop Code is ${shopCode}. You can now log in.`);
      setIsError(false);
      setShopName('');
      setEmail('');
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F9FF] p-4 font-sans">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#0F1A2B] flex items-center justify-center">
                <Printer size={24} className="mr-2 text-[#5B6B82]"/>
                Create Your Print Shop
            </h1>
            <p className="text-sm text-[#5B6B82] mt-2">
                Set up your shop in seconds and start receiving print orders digitally.
            </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)] p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            
            <div>
                <label className="text-sm font-medium text-[#5B6B82] mb-1 block">Shop Name</label>
                <div className="relative">
                    <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={20}/>
                    <input
                        className="w-full rounded-[12px] border border-gray-200 pl-11 pr-4 py-3 text-base text-[#0F1A2B] placeholder:text-[#8A9BB8] focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]/50 focus:border-[#0A5CFF]"
                        type="text"
                        placeholder="e.g., Speedy Prints"
                        value={shopName}
                        onChange={e => setShopName(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-[#5B6B82] mb-1 block">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={20}/>
                    <input
                        className="w-full rounded-[12px] border border-gray-200 pl-11 pr-4 py-3 text-base text-[#0F1A2B] placeholder:text-[#8A9BB8] focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]/50 focus:border-[#0A5CFF]"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>
            </div>
            
            <div>
                <label className="text-sm font-medium text-[#5B6B82] mb-1 block">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={20}/>
                    <input
                        className="w-full rounded-[12px] border border-gray-200 pl-11 pr-4 py-3 text-base text-[#0F1A2B] placeholder:text-[#8A9BB8] focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]/50 focus:border-[#0A5CFF]"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-center space-x-3 text-sm ${isError ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#22C55E]/10 text-[#22C55E]'}`}>
                <div className="flex-shrink-0">
                    {isError ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
                </div>
                <p className="font-medium leading-tight">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A5CFF] text-white font-semibold py-3 px-4 rounded-[14px] hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group mt-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Create Shop</span>
                  <ArrowRight className="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1"/>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-[#5B6B82]">
            Already have an account?{' '}
            <a href="/operator/login" className="font-semibold text-[#0A5CFF] hover:underline">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CreateShop;
