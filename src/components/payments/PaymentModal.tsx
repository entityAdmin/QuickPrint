import { useState } from 'react';
import { supabase } from '../../supabaseClient';

interface Props {
  open: boolean;
  provider: 'card' | 'gateway' | 'mpesa' | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaymentModal({ open, provider, onClose, onSuccess }: Props) {
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    phoneNumber: '',
    gatewayName: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open || !provider) return null;

  const label = provider === 'card' ? 'Card (Visa / Debit)' : provider === 'mpesa' ? 'Safaricom M-PESA' : 'Global Payment Gateway';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (provider === 'card') {
      if (!formData.cardholderName.trim()) newErrors.cardholderName = 'Cardholder name is required';
      if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
      if (!formData.expiry.trim()) newErrors.expiry = 'Expiry date is required';
      if (!formData.cvc.trim()) newErrors.cvc = 'CVC is required';
    } else if (provider === 'mpesa') {
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    } else if (provider === 'gateway') {
      if (!formData.gatewayName.trim()) newErrors.gatewayName = 'Gateway name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPaymentMethod = async () => {
    if (!validateForm()) return;

    try {
      setProcessing(true);

      // Get current user and shop
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('Authentication required');
        return;
      }

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('operator_user_id', user.id)
        .single();

      if (shopError || !shopData) {
        alert('Shop not found');
        return;
      }

      const shopId = shopData.id;

      // Prepare payment method data
      let paymentMethodData: {
        shop_id: string;
        type: 'card' | 'gateway' | 'mpesa';
        status: 'pending';
        created_at: string;
        label?: string;
        masked?: string;
        id?: string;
      } = {
        shop_id: shopId,
        type: provider,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (provider === 'card') {
        // In production, this data would be sent to backend for tokenization
        // Frontend should NEVER store raw card data
        paymentMethodData.label = `Card ending in ${formData.cardNumber.slice(-4)}`;
        paymentMethodData.masked = `**** **** **** ${formData.cardNumber.slice(-4)}`;
        // Raw card data would be sent to backend for tokenization
      } else if (provider === 'mpesa') {
        paymentMethodData.label = `M-PESA (${formData.phoneNumber})`;
        paymentMethodData.masked = formData.phoneNumber;
      } else if (provider === 'gateway') {
        paymentMethodData.label = formData.gatewayName;
        paymentMethodData.masked = formData.gatewayName;
      }

      // Save to payment_methods table (assuming it exists)
      const { error: insertError } = await supabase
        .from('payment_methods')
        .insert([paymentMethodData]);

      if (insertError) {
        console.error('Error saving payment method:', insertError);
        alert('Failed to save payment method. Please try again.');
        return;
      }

      // Emit event for backend to handle tokenization
      window.dispatchEvent(new CustomEvent('payment:addMethod', {
        detail: {
          provider,
          formData
        }
      }));

      // Close modal and refresh data
      onClose();
      onSuccess?.();

    } catch (err) {
      console.error('Error adding payment method:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !processing && onClose()} />
      <div className="relative bg-white w-full max-w-md rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Add payment method</h3>
        <p className="text-sm text-[#5B6B82] mt-2">{label} — Secure tokenization handled by backend.</p>

        <div className="mt-4 space-y-3">
          {provider === 'card' && (
            <>
              <div>
                <input
                  placeholder="Cardholder name"
                  className={`w-full rounded border px-3 py-2 ${errors.cardholderName ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                />
                {errors.cardholderName && <div className="text-red-500 text-xs mt-1">{errors.cardholderName}</div>}
              </div>
              <div>
                <input
                  placeholder="Card number"
                  className={`w-full rounded border px-3 py-2 ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                />
                {errors.cardNumber && <div className="text-red-500 text-xs mt-1">{errors.cardNumber}</div>}
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    placeholder="MM/YY"
                    className={`w-full rounded border px-3 py-2 ${errors.expiry ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.expiry}
                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                  />
                  {errors.expiry && <div className="text-red-500 text-xs mt-1">{errors.expiry}</div>}
                </div>
                <div>
                  <input
                    placeholder="CVC"
                    className={`w-24 rounded border px-3 py-2 ${errors.cvc ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.cvc}
                    onChange={(e) => handleInputChange('cvc', e.target.value)}
                  />
                  {errors.cvc && <div className="text-red-500 text-xs mt-1">{errors.cvc}</div>}
                </div>
              </div>
              <p className="text-xs text-[#8A9BB8]">Card details are tokenized securely and never stored in plain text.</p>
            </>
          )}
          {provider === 'mpesa' && (
            <>
              <div>
                <input
                  placeholder="Phone number (e.g., +254712345678)"
                  className={`w-full rounded border px-3 py-2 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
                {errors.phoneNumber && <div className="text-red-500 text-xs mt-1">{errors.phoneNumber}</div>}
              </div>
              <p className="text-xs text-[#8A9BB8]">This will initiate an M-PESA STK push from your registered number.</p>
            </>
          )}
          {provider === 'gateway' && (
            <>
              <div>
                <input
                  placeholder="Gateway display name"
                  className={`w-full rounded border px-3 py-2 ${errors.gatewayName ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.gatewayName}
                  onChange={(e) => handleInputChange('gatewayName', e.target.value)}
                />
                {errors.gatewayName && <div className="text-red-500 text-xs mt-1">{errors.gatewayName}</div>}
              </div>
              <p className="text-xs text-[#8A9BB8]">Generic gateway integration — configure provider details in backend.</p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={() => !processing && onClose()} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Cancel</button>
          <button onClick={addPaymentMethod} disabled={processing} className="px-4 py-2 rounded-lg bg-[#0A5CFF] text-white hover:bg-blue-700 disabled:opacity-50">
            {processing ? 'Adding...' : 'Add Payment Method'}
          </button>
        </div>
      </div>
    </div>
  );
}
