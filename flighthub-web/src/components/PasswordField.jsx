import { useState } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useField } from 'formik';
import { cn } from '@/lib/utils';

const PasswordField = ({
  label,
  name,
  placeholder = '',
  disabled = false,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [field, meta] = useField(name);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          className={cn(
            'w-full border-input bg-background/70 pr-10 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-slate-900/70 dark:focus:ring-blue-950',
            meta.touched && meta.error && 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950',
            className
          )}
          disabled={disabled}
          {...field}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-8 w-8 rounded-full"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
        </Button>
      </div>
      {meta.touched && meta.error && (
        <p className="text-xs text-red-500 mt-1 animate-fade-in">
          {meta.error}
        </p>
      )}
    </div>
  );
};

export default PasswordField;
