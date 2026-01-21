interface Props {
  id: string;
  type: 'card' | 'gateway' | 'mpesa';
  label: string;
  masked?: string;
  status?: 'active' | 'expired' | 'pending';
  onRemove?: (id: string) => void;
}

export default function PaymentMethodCard({ id, type, label, masked, status = 'active', onRemove }: Props) {
  const statusColor = status === 'active' ? 'text-green-600' : status === 'pending' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white flex items-center justify-between">
      <div>
        <div className="text-sm text-[#5B6B82]">{label}</div>
        <div className="text-base font-medium text-[#0F1A2B]">{masked || (type === 'mpesa' ? 'Safaricom M-PESA' : type === 'card' ? 'Visa / Debit' : 'Global Gateway')}</div>
        <div className={`text-xs mt-1 ${statusColor}`}>{status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Expired'}</div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="text-sm text-[#0A5CFF] bg-[#EFF6FF] px-3 py-2 rounded-lg">Set Default</button>
        <button onClick={() => onRemove?.(id)} className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">Remove</button>
      </div>
    </div>
  );
}
