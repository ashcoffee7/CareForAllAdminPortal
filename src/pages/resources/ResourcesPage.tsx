import { useState } from 'react';
import { Topbar } from '../../components/Topbar';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/ConfirmModal';
import { formatDate } from '../../utils/formatDate';
import { useResources, type ResourceGroups } from './useResources';
import { ResourcePreviewModal } from './ResourcePreviewModal';
import { ResourceEditModal } from './ResourceEditModal';
import { AddResourceModal } from './AddResourceModal';
import type { Resource } from '../../types/database';

// The Mapping Project Directory section below is unrelated to Resources
// (drives the member-facing Mapping page, not the resource library) --
// still static mock, left untouched intentionally.

interface MappingProject {
  title: string;
  desc: string;
  location: string;
  status: 'active' | 'paused' | 'completed';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  stats: string;
  featured: boolean;
}

const MAPPING_PROJECTS: MappingProject[] = [
  { title: 'Arizona Disaster Response', desc: 'Map buildings and roads to support wildfire and flood disaster response across rural Arizona.', location: 'Arizona, USA · Disaster Response', status: 'active', difficulty: 'beginner', stats: '38 contributors · 1,240 mapped · 96 hr', featured: true },
  { title: 'Bulawayo Healthcare Access', desc: 'Map clinics, hospitals, and access roads to improve healthcare routing in Bulawayo.', location: 'Bulawayo, Zimbabwe · Healthcare Access', status: 'active', difficulty: 'intermediate', stats: '22 contributors · 2,310 mapped · 142 hr', featured: true },
  { title: 'Nairobi Building Footprints', desc: 'Trace building footprints in undermapped Nairobi neighborhoods for health-service planning.', location: 'Nairobi, Kenya · Buildings', status: 'active', difficulty: 'beginner', stats: '17 contributors · 880 mapped · 54 hr', featured: false },
  { title: 'Rural Roads - Malawi', desc: 'Map rural road networks so mobile clinics can reach remote communities in Malawi.', location: 'Malawi · Roads', status: 'paused', difficulty: 'advanced', stats: '9 contributors · 430 mapped · 31 hr', featured: false },
  { title: 'Coastal Flood Mapping 2025', desc: 'Completed 2025 effort mapping flood-prone coastal settlements in Bangladesh.', location: 'Bangladesh · Disaster Response', status: 'completed', difficulty: 'intermediate', stats: '54 contributors · 5,120 mapped · 310 hr', featured: false },
];

const STATUS_BADGE: Record<MappingProject['status'], string> = {
  active: 'bg-success-light text-success-dark',
  paused: 'bg-warning-light text-warning-dark',
  completed: 'bg-border text-muted',
};

const DIFF_BADGE: Record<MappingProject['difficulty'], string> = {
  beginner: 'bg-hover-tint text-brand',
  intermediate: 'bg-intermediate-light text-accent',
  advanced: 'bg-sidebar text-white',
};

function metaFor(item: Resource): string[] {
  const meta: string[] = [];
  if (item.source_type) { meta.push(item.source_type); }
  if (item.category === 'Videos' && item.duration) { meta.push(item.duration); }
  if (item.audience) { meta.push(item.audience); }
  meta.push(`Updated ${formatDate(item.updated_at, '—')}`);
  return meta;
}

interface ResourceSectionProps {
  icon: string;
  title: string;
  items: Resource[];
  onPreview: (item: Resource) => void;
  onEdit: (item: Resource) => void;
  onHide: (item: Resource) => void;
  onPublish: (item: Resource) => void;
  onDelete: (item: Resource) => void;
}

function ResourceSection({ icon, title, items, onPreview, onEdit, onHide, onPublish, onDelete }: ResourceSectionProps) {
  return (
    <>
      <div className="font-heading text-[16px] text-text tracking-[0.01em] mb-3 flex items-center gap-[9px]">
        <i className={`ti ti-${icon}`} /> {title}
      </div>
      <div className="flex flex-col gap-[10px] mb-[26px] last:mb-0">
        {items.length === 0 ? (
          <div className="text-[12.5px] text-muted">No resources yet.</div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-[11px] px-[18px] py-[15px] flex items-center justify-between gap-[14px] flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <div className="text-[14px] font-bold text-text mb-[3px]">{item.title}</div>
                <div className="text-[12.5px] text-muted mb-[7px] leading-[1.4]">{item.description}</div>
                <div className="text-[11.5px] text-muted flex items-center gap-[6px] flex-wrap">
                  {metaFor(item).map((m, i) => (
                    <span key={i} className="flex items-center gap-[6px]">
                      {i > 0 && <span className="w-[3px] h-[3px] rounded-full bg-border shrink-0" />}
                      {m}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-[14px] shrink-0">
                <span className={`text-[11px] font-bold px-[11px] py-1 rounded-full ${item.status === 'published' ? 'bg-success-light text-success-dark' : 'bg-bg text-muted border border-border'}`}>
                  {item.status === 'published' ? 'Published' : 'Hidden'}
                </span>
                <div className="flex items-center gap-[13px]">
                  <button onClick={() => onPreview(item)} className="text-[12.5px] font-bold text-brand bg-none border-none cursor-pointer font-sans hover:underline">Preview</button>
                  <button onClick={() => onEdit(item)} className="text-[12.5px] font-bold text-brand bg-none border-none cursor-pointer font-sans hover:underline">Edit</button>
                  {item.status === 'published' ? (
                    <button onClick={() => onHide(item)} className="text-[12.5px] font-bold text-accent bg-none border-none cursor-pointer font-sans hover:underline">Hide</button>
                  ) : (
                    <button onClick={() => onPublish(item)} className="text-[12.5px] font-bold text-brand bg-none border-none cursor-pointer font-sans hover:underline">Unhide</button>
                  )}
                  <button onClick={() => onDelete(item)} className="text-[12.5px] font-bold text-accent bg-none border-none cursor-pointer font-sans hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export function ResourcesPage() {
  const { groups, createResource, updateResource, deleteResource } = useResources();
  const [previewItem, setPreviewItem] = useState<Resource | null>(null);
  const [editItem, setEditItem] = useState<Resource | null>(null);
  const [deleteItem, setDeleteItem] = useState<Resource | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  function handleHide(item: Resource) {
    updateResource(item.id, { status: 'coming-soon' });
  }

  function handlePublish(item: Resource) {
    updateResource(item.id, { status: 'published' });
  }

  async function handleConfirmDelete() {
    if (!deleteItem) { return; }
    await deleteResource(deleteItem.id);
    setDeleteItem(null);
  }

  const sections: { key: keyof ResourceGroups; icon: string; title: string }[] = [
    { key: 'Handbooks', icon: 'book', title: 'Handbooks' },
    { key: 'Toolkits', icon: 'briefcase', title: 'Project Toolkits' },
    { key: 'Videos', icon: 'video', title: 'Video Tutorials' },
    { key: 'Other', icon: 'dots', title: 'Other' },
  ];

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Topbar title="Resources Manager" />
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          <i className="ti ti-plus text-[13px] mr-1" />Add Resource
        </Button>
      </div>
      <div className="text-[12.5px] text-muted -mt-[10px]">
        Manage the handbooks, toolkits, and videos members see in their portal.
      </div>

      <Card>
        {sections.map((s) => (
          <ResourceSection
            key={s.key}
            icon={s.icon}
            title={s.title}
            items={groups[s.key]}
            onPreview={setPreviewItem}
            onEdit={setEditItem}
            onHide={handleHide}
            onPublish={handlePublish}
            onDelete={setDeleteItem}
          />
        ))}
      </Card>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-[10px] mb-[6px]">
          <div className="font-heading text-[16px] text-text tracking-[0.01em] flex items-center gap-[9px]">
            <i className="ti ti-map" /> Mapping Project Directory
          </div>
          <Button variant="primary" className="!text-[12px] !px-4 !py-2">
            <i className="ti ti-plus text-[12px] mr-1" />New Mapping Task
          </Button>
        </div>
        <div className="text-[12.5px] text-muted mb-[18px]">These cards drive the member-facing Mapping page.</div>

        {MAPPING_PROJECTS.map((project) => (
          <div key={project.title} className="bg-card border border-border rounded-xl px-5 py-[18px] mb-3 last:mb-0">
            <div className="flex items-start justify-between gap-[14px] mb-[9px]">
              <div>
                <div className="text-[15px] font-bold text-text mb-1">{project.title}</div>
                <div className="text-[12.5px] text-muted leading-[1.5] mb-[9px]">{project.desc}</div>
                <div className="text-[12px] text-muted mb-[11px]">{project.location}</div>
              </div>
              <div className="flex gap-[7px] shrink-0 flex-wrap justify-end">
                <span className={`text-[10.5px] font-bold px-[10px] py-1 rounded-full uppercase tracking-[0.03em] ${STATUS_BADGE[project.status]}`}>
                  {project.status}
                </span>
                <span className={`text-[10.5px] font-bold px-[10px] py-1 rounded-full uppercase tracking-[0.03em] ${DIFF_BADGE[project.difficulty]}`}>
                  {project.difficulty}
                </span>
              </div>
            </div>
            <div className="text-[12.5px] text-text font-semibold mb-[13px]">{project.stats}</div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-[14px]">
                <button className="text-[12.5px] font-bold text-brand bg-none border-none cursor-pointer font-sans hover:underline">Task</button>
                <button className="text-[12.5px] font-bold text-brand bg-none border-none cursor-pointer font-sans hover:underline">Edit</button>
                <button className={`text-[12.5px] font-bold bg-none border-none cursor-pointer font-sans hover:underline ${project.featured ? 'text-accent' : 'text-brand'}`}>
                  {project.featured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </Card>

      <ResourcePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      <ResourceEditModal item={editItem} onClose={() => setEditItem(null)} onSave={updateResource} />
      <AddResourceModal open={addOpen} onClose={() => setAddOpen(false)} onCreate={createResource} />
      <ConfirmModal
        open={deleteItem !== null}
        title="Delete resource?"
        text={`Are you sure you want to permanently delete "${deleteItem?.title ?? ''}"? This can't be undone.`}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
