import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import PaymentMethodCard from './PaymentMethodCard';
import PaymentModal from './PaymentModal';
import PaymentTimer from './PaymentTimer';

interface PaymentMethod {
  id: string;
  type: 'card' | 'gateway' | 'mpesa';
  label: string;
  masked?: string;
  status: 'active' | 'expired' | 'pending';
}

interface Subscription {
  plan_type: string;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  next_billing_date?: string | null;
  current_period_start?: string;
  current_period_end?: string;
}

export default function PaymentBilling() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [provider, setProvider] = useState<'card' | 'gateway' | 'mpesa' | null>(null);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user and shop
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Authentication required');
        return;
      }

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('operator_user_id', user.id)
        .single();

      if (shopError || !shopData) {
        setError('Shop not found');
        return;
      }

      const shopId = shopData.id;

      // Fetch payment methods (assuming payment_methods table exists)
      const { data: methodsData, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (methodsError) {
        // If table doesn't exist yet, show empty state
        console.warn('Payment methods table not found:', methodsError.message);
      } else {
        setMethods(methodsData || []);
      }

      // Fetch subscription (assuming subscriptions table exists)
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .single();

      if (subscriptionError) {
        // If table doesn't exist yet, show default state
        console.warn('Subscriptions table not found:', subscriptionError.message);
        setSubscription({
          plan_type: 'Free',
          status: 'active',
          next_billing_date: null
        });
      } else {
        setSubscription(subscriptionData);
      }

    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const addMethod = (type: 'card' | 'gateway' | 'mpesa') => {
    setProvider(type);
    setModalOpen(true);
  };

  const removeMethod = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error removing payment method:', error);
        alert('Failed to remove payment method');
        return;
      }

      // Refresh data
      await fetchPaymentData();
    } catch (err) {
      console.error('Error removing payment method:', err);
      alert('Failed to remove payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A5CFF]"></div>
        <span className="ml-3 text-[#5B6B82]">Loading payment information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700 font-medium">Error loading payment data</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={fetchPaymentData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'expired':
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold">Payment Methods</h3>
          <p className="text-sm text-[#5B6B82] mt-1">Add and manage your payment methods. Tokenization is handled by the backend.</p>

          <div className="mt-4 space-y-3">
            {methods.length === 0 ? (
              <div className="text-center py-8 text-[#8A9BB8]">
                <div className="text-sm">No payment methods added yet</div>
                <div className="text-xs mt-1">Add a payment method to enable subscriptions</div>
              </div>
            ) : (
              methods.map(m => (
                <PaymentMethodCard
                  key={m.id}
                  id={m.id}
                  type={m.type}
                  label={m.label}
                  masked={m.masked}
                  status={m.status}
                  onRemove={removeMethod}
                />
              ))
            )}
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={() => addMethod('card')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Add Card (Visa / Debit)</button>
            <button onClick={() => addMethod('gateway')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Add Global Gateway</button>
            <button onClick={() => addMethod('mpesa')} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Add M-PESA</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold">Subscription Status</h3>
          <div className="mt-3 text-sm text-[#5B6B82]">
            Current plan: <span className="font-medium text-[#0F1A2B]">{subscription?.plan_type || 'Free'}</span>
          </div>
          <div className="mt-2 text-sm">
            Status: <span className={`font-medium ${getStatusColor(subscription?.status || 'active')}`}>
              {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Active'}
            </span>
          </div>
          {subscription?.next_billing_date && (
            <div className="mt-2 text-sm">
              Next billing date: <span className="font-medium">{formatDate(subscription.next_billing_date)}</span>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('payment:openCheckout'))}
              className="w-full bg-[#0A5CFF] text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={methods.length === 0}
            >
              {subscription?.status === 'active' ? 'Make a Payment' : 'Subscribe Now'}
            </button>
            {methods.length === 0 && (
              <p className="text-xs text-red-600 mt-2">Add a payment method first</p>
            )}
            <p className="text-xs text-[#8A9BB8] mt-2">Opens a provider flow. Backend handles verification and webhooks.</p>
          </div>

          <PaymentTimer />

          <div className="mt-4 text-xs text-[#8A9BB8]">
            <div>
              Developer notes: Backend must emit{' '}
              <code>{`window.dispatchEvent(new CustomEvent('payment:success', { detail: { timestamp: Date.now() } }))`}</code>
              {' '}after confirming payment for the UI timer to start. In development you may trigger the event to test the timer.
            </div>
          </div>
        </div>
      </div>

      <PaymentModal open={modalOpen} provider={provider} onClose={() => setModalOpen(false)} onSuccess={fetchPaymentData} />

      <div className="mt-6 text-sm text-[#8A9BB8]">Payments are placeholders: do not wire secrets here. Backend tokenization & webhooks required.</div>
    </div>
  );
}
