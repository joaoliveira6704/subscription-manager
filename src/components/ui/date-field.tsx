import { TextField } from '@/components/ui/text-field';

export type DateFieldProps = {
  label: string;
  /** "YYYY-MM-DD" */
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
};

/**
 * Fallback (web): a plain text field in YYYY-MM-DD. iOS and Android use native pickers from
 * date-field.ios.tsx and date-field.android.tsx.
 */
export function DateField({ label, value, onChange, error }: DateFieldProps) {
  return (
    <TextField
      label={label}
      value={value}
      onChangeText={onChange}
      error={error}
      placeholder="YYYY-MM-DD"
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}
