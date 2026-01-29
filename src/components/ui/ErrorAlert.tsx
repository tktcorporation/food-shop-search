import type React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, className = '' }) => (
  <div
    className={`p-4 bg-primary-50 border border-primary-200 text-primary-600 rounded-lg text-sm flex items-start ${className}`}
  >
    <AlertCircle className="shrink-0 mt-0.5 mr-2" size={16} />
    <div className="whitespace-pre-line">{message}</div>
  </div>
);

export default ErrorAlert;
