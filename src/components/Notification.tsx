import { CheckCircle, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  onClose: () => void;
  onDelete: () => void;
}

function Notification({ message, onClose, onDelete }: NotificationProps) {
  return (
    <div className="fixed bottom-5 right-5 bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
                <h4 className="font-semibold text-gray-800">Order Completed!</h4>
                <p className="text-sm text-gray-600 mt-1">{message}</p>
                <div className="mt-4 flex space-x-2">
                    <button onClick={onDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                        Delete Document
                    </button>
                    <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                        Dismiss
                    </button>
                </div>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X size={20} />
            </button>
        </div>
    </div>
  );
}

export default Notification;
