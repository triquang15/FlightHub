import { Input } from './ui/input';
import { Label } from './ui/label';
import { useField } from 'formik';
import { cn } from '@/lib/utils';

const InputField = ({
  label,
  name,
  placeholder = '',
  type = 'text',
  disabled = false,
  className,
}) => {
  const [field, meta] = useField(name);

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        className={cn(
          'w-full border-input bg-background/70 text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-slate-900/70 dark:focus:ring-blue-950',
          meta.touched && meta.error && 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950',
          className
        )}
        disabled={disabled}
        {...field}
      />
      {meta.touched && meta.error && (
        <p className="text-xs text-red-500 mt-1 animate-fade-in">
          {meta.error}
        </p>
      )}
    </div>
  );
};

export default InputField;
