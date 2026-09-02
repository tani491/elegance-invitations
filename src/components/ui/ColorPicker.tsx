import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-10 p-1" />
    </div>
  );
}
