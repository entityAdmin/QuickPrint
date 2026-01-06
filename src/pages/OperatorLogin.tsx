import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Mail, Lock, LogIn, Printer, Eye, EyeOff } from 'lucide-react';

function OperatorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMessage('Please fill all fields.');
      setIsError(true);
      return;
    }
    setLoading(true);
    setMessage('');
    setIsError(false);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setIsError(true);
    } else if (data.user) {
      const { data: shopData, error: shopError } = await supabase.from('shops').select('id').eq('operator_user_id', data.user.id).single();
      if (shopError || !shopData) {
        setMessage('No shop found for this account. Please create a shop first.');
        setIsError(true);
        await supabase.auth.signOut();
      } else {
        navigate('/operator');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F9FF] p-4 font-sans">
      <div className="w-full max-w-md">

        <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#0F1A2B] flex items-center justify-center">
                <Printer size={24} className="mr-2 text-[#5B6B82]"/>
                Operator Login
            </h1>
            <p className="text-sm text-[#5B6B82] mt-2">
                Access your shop dashboard to manage print orders.
            </p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,26,43,0.08)] p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div>
                <label className="text-sm font-medium text-[#5B6B82] mb-2 block">Email Address</label>
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
                <label className="text-sm font-medium text-[#5B6B82] mb-2 block">Password</label>
                <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8]" size={20}/>
                    <input
                        className="w-full rounded-[12px] border border-gray-200 pl-11 pr-12 py-3 text-base text-[#0F1A2B] placeholder:text-[#8A9BB8] focus:outline-none focus:ring-2 focus:ring-[#0A5CFF]/50 focus:border-[#0A5CFF]"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB8] hover:text-[#5B6B82] transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
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

            <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0A5CFF] text-white font-semibold py-3 px-4 rounded-[14px] hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2 transform transition-transform group-hover:-translate-x-1"/>
                      <span>Login</span>
                    </>
                  )}
                </button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-[#5B6B82]">
            Don't have an account?{' '}
            <a href="/operator/create" className="font-semibold text-[#0A5CFF] hover:underline">
              Create a Shop
            </a>
          </p>
          <p className="text-sm text-[#5B6B82] mt-2">
            <a href="/forgot-password" className="font-semibold text-[#0A5CFF] hover:underline">
              Forgot password?
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OperatorLogin;
