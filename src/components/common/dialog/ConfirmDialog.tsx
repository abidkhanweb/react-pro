// src/components/dialog/ConfirmDialog.tsx

"use client";

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type DialogProps as Props } from "./dialog.types"

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

//# How to use it
//# const [isOpen, setIsOpen] = useState(false);

//# <ConfirmDialog
//#   open={isOpen}
//#   title="Delete Order?"
//#   description="This action cannot be undone."
//#   onConfirm={() => {
//#     deleteOrder(orderId);
//#     setIsOpen(false);
//#   }}
//#   onCancel={() => setIsOpen(false)}
//# />

//# <Button
//#   variant="destructive"
//#   onClick={() => setIsOpen(true)}
//# >
//#   Delete
//# </Button>