import { toast as showToast } from "@/hooks/useToast";

type SimpleToast = {
  (message: string): void;
  success: (message: string, options?: unknown) => void;
  error: (message: string, options?: unknown) => void;
};

const toast = ((message: string) => {
  showToast({ description: message });
}) as SimpleToast;

toast.success = (message: string) => {
  showToast({ title: "Success", description: message, variant: "success" });
};

toast.error = (message: string) => {
  showToast({ title: "Error", description: message, variant: "destructive" });
};

export default toast;
export { toast };
