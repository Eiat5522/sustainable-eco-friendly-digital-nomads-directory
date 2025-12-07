import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message?: string;
  className?: string;
}

const icons = {
  error: XCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info
};

const styles = {
  error: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800',
  success: 'bg-green-50 text-green-900 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800'
};

export function Alert({ type, title, message, className }: AlertProps) {
  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border",
        styles[type],
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="ml-3">
          <h3 className="text-sm font-medium">{title}</h3>
          {message && (
            <div className="mt-1 text-sm opacity-90">
              {message}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
