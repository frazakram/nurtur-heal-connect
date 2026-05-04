import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmLabel?: string;
}

export const ConfirmDialog = ({ open, title = "Are you sure?", description = "This action cannot be undone.", onConfirm, onClose, confirmLabel = "Delete" }: Props) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={() => { onConfirm(); onClose(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);