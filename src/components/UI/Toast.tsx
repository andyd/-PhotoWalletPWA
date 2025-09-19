import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface ToastProps {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

const toastIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const toastColors = {
  info: 'bg-blue-600 border-blue-500',
  success: 'bg-green-600 border-green-500',
  warning: 'bg-yellow-600 border-yellow-500',
  error: 'bg-red-600 border-red-500',
};

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type,
}) => {
  const { removeToast } = useUIStore();
  const IconComponent = toastIcons[type];

  const handleDismiss = () => {
    removeToast(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      layout
      className={`
        ${toastColors[type]}
        border-l-4 rounded-lg p-4 shadow-lg backdrop-blur-sm
        flex items-start space-x-3 max-w-sm w-full
      `}
    >
      <IconComponent className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium leading-5">
          {message}
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Toast container for multiple toasts
export const ToastContainer: React.FC = () => {
  const { toasts } = useUIStore();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 space-y-2 pointer-events-none">
      <div className="flex flex-col items-end space-y-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Hook for easy toast usage
export const useToast = () => {
  const { addToast } = useUIStore();

  return {
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration),
  };
};