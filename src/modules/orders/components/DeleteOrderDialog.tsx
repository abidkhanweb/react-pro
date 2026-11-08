import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteOrderDialog({ open, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this order?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ## How to use
// const [open, setOpen] = useState(false);

// <>
//   <Button onClick={() => setOpen(true)}>Delete</Button>

//   <DeleteOrderDialog
//     open={open}
//     onClose={() => setOpen(false)}
//     onConfirm={() => {
//       // delete API
//       setOpen(false);
//     }}
//   />
// </>;


{/* <ConfirmDialog
  open={open}
  title="Delete Order"
  description="Are you sure you want to delete this order?"
  confirmText="Delete"
  cancelText="Cancel"
  confirmVariant="destructive"
  onCancel={onClose}
  onConfirm={onConfirm}
/>; */}