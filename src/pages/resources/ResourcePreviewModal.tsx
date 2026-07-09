import { Modal } from '../../components/Modal';
import type { Resource } from '../../types/database';

interface ResourcePreviewModalProps {
  item: Resource | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[3px] py-[11px] border-b border-border last:border-b-0">
      <div className="text-[10.5px] font-bold text-muted uppercase tracking-[0.06em]">{label}</div>
      <div className="text-[14px] text-text font-semibold">{children}</div>
    </div>
  );
}

// Data's already loaded client-side in the resources list, so this is a
// pure display component -- no fetch-by-id needed.
export function ResourcePreviewModal({ item, onClose }: ResourcePreviewModalProps) {
  return (
    <Modal open={item !== null} onClose={onClose} title={item?.title ?? ''}>
      {item ? (
        <>
          <Field label="Description">{item.description || 'No description'}</Field>
          <Field label="Link">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                {item.link}
              </a>
            ) : (
              'No link'
            )}
          </Field>
        </>
      ) : null}
    </Modal>
  );
}
