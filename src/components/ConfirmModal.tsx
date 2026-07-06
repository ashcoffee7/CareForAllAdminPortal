import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  text: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ open, title, text, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="text-[14px] text-text leading-[1.6] mb-[18px]">{text}</div>
      <div className="flex gap-[10px] justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Yes</Button>
      </div>
    </Modal>
  );
}
