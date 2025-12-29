import { CheckCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  onClose: () => void;
  onDelete: () => void;
}

function Notification({ message, onClose, onDelete }: NotificationProps) {
  return (
    <div className="fixed bottom-5 right-5 bg-surface-primary rounded-card shadow-card p-24 w-full max-w-sm">
        <div className="flex items-start space-x-4">
            <div className="bg-status-success/10 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-status-success" />
            </div>
            <div className="flex-1">
                <h4 className="font-medium text-text-primary leading-section-title">Order Completed!</h4>
                <p className="text-sm text-text-secondary mt-1 leading-body">{message}</p>
                <div className="mt-4 flex space-x-2">
                    <button onClick={onDelete} className="flex-1 px-16 py-12 bg-status-error text-white rounded-button text-sm font-medium hover:bg-opacity-90 transition-colors">
                        Delete Document
                    </button>
                    <button onClick={onClose} className="flex-1 px-16 py-12 bg-brand-tertiary text-text-primary rounded-button text-sm font-medium hover:bg-opacity-80 transition-colors">
                        Dismiss
                    </button>
                </div>
            </div>
            <button onClick={onClose} className="p-1 text-text-secondary hover:text-text-primary rounded-full">
                <X size={20} />
            </button>
        </div>
    </div>
  );
}

export default Notification;
