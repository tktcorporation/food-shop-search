import type React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  className?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, className = '' }) => (
  <div className={`alert-error ${className}`}>
    <AlertCircle className="shrink-0 mt-0.5" size={18} />
    <div className="whitespace-pre-line text-sm">{message}</div>
  </div>
);

export default ErrorAlert;
