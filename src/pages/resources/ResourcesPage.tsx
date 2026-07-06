import { Topbar } from '../../components/Topbar';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

// This whole page is a direct JSX transcription of the old static markup --
// there is no `resources` table in the schema and no click handlers were
// ever wired to these buttons in the vanilla app (confirmed: main.js has a
// TODO explicitly noting Resources Manager has no Supabase wiring). Do not
// add data-fetching or onClick behavior here; that would be new scope.

interface ResourceItem {
  title: string;
  desc: string;
  meta: string[];
  status: 'published' | 'coming-soon';
}

const HANDBOOKS: ResourceItem[] = [
  { title: 'Program Handbook', desc: 'Everything a new member needs to get started with CareForAll.', meta: ['Google Doc', 'All Members', 'Updated May 1, 2026'], status: 'published' },
  { title: 'Chapter Handbook', desc: 'Guide for running and growing a CareForAll chapter.', meta: ['Google Doc', 'Chapter Leads', 'Updated Apr 12, 2026'], status: 'published' },
  { title: 'Education Handbook', desc: 'How to design and lead peer education sessions.', meta: ['Google Slides', 'All Members', 'Updated Mar 20, 2026'], status: 'published' },
  { title: 'Fundraising Handbook', desc: 'Fundraising playbooks and templates — in progress.', meta: ['Google Doc', 'All Members', 'Updated —'], status: 'coming-soon' },
  { title: 'Mapping for Beginners', desc: 'LearnOSM intro to humanitarian mapping.', meta: ['External Link', 'All Members', 'Updated May 9, 2026'], status: 'published' },
];

const TOOLKITS: ResourceItem[] = [
  { title: 'Advocacy Toolkit', desc: 'Letter templates, infographics, and petition guides.', meta: ['Google Doc', 'All Members', 'Updated Feb 8, 2026'], status: 'published' },
  { title: 'Health Essentials Toolkit', desc: 'Run health drives, screenings, and hygiene-kit collections.', meta: ['Google Doc', 'All Members', 'Updated Mar 2, 2026'], status: 'published' },
  { title: 'Education Toolkit', desc: 'Workshop plans and credible health-topic sources.', meta: ['Google Doc', 'All Members', 'Updated Mar 15, 2026'], status: 'published' },
  { title: 'Create Your Own Toolkit', desc: 'Blank template to build a custom project toolkit.', meta: ['Template', 'Chapter Leads', 'Updated Apr 1, 2026'], status: 'published' },
];

const VIDEOS: ResourceItem[] = [
  { title: 'Getting Started with Mapping', desc: 'A quick intro for brand-new mappers.', meta: ['Video', '1 min', 'All Members', 'Updated May 5, 2026'], status: 'published' },
  { title: 'Using the HOTOSM Tasking Manager', desc: 'Claim a task and start mapping in the Tasking Manager.', meta: ['Video', '3 min', 'All Members', 'Updated May 5, 2026'], status: 'published' },
  { title: 'Tagging Health Facilities', desc: 'How to correctly tag clinics and hospitals.', meta: ['Video', '2 min', 'All Members', 'Updated May 5, 2026'], status: 'published' },
  { title: 'Reviewing & Validating Data', desc: 'Validate contributions before they are submitted.', meta: ['Video', '2 min', 'Chapter Leads', 'Updated May 5, 2026'], status: 'published' },
];

const OTHER: ResourceItem[] = [
  { title: 'CareForAll Creator Kit', desc: 'Social-media templates, logos, and brand assets.', meta: ['External Link', 'All Members', 'Updated Apr 22, 2026'], status: 'published' },
  { title: 'Onboarding Videos', desc: 'Full onboarding video series — coming soon.', meta: ['Video', 'All Members', 'Updated —'], status: 'coming-soon' },
];

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

function ResourceSection({ icon, title, items }: { icon: string; title: string; items: ResourceItem[] }) {
  return (
    <>
      <div className="font-heading text-[16px] text-text tracking-[0.01em] mb-3 flex items-center gap-[9px]">
        <i className={`ti ti-${icon}`} /> {title}
      </div>
      <div className="flex flex-col gap-[10px] mb-[26px] last:mb-0">
        {items.map((item) => (
          <div key={item.title} className="bg-card border border-border rounded-[11px] px-[18px] py-[15px] flex items-center justify-between gap-[14px] flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <div className="text-[14px] font-bold text-text mb-[3px]">{item.title}</div>
              <div className="text-[12.5px] text-muted mb-[7px] leading-[1.4]">{item.desc}</div>
              <div className="text-[11.5px] text-muted flex items-center gap-[6px] flex-wrap">
                {item.meta.map((m, i) => (
                  <span key={i} className="flex items-center gap-[6px]">
                    {i > 0 && <span className="w-[3px] h-[3px] rounded-full bg-border shrink-0" />}
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-[14px] shrink-0">
              <span className={`text-[11px] font-bold px-[11px] py-1 rounded-full ${item.status === 'published' ? 'bg-success-light text-success-dark' : 'bg-bg text-muted border border-border'}`}>
                {item.status === 'published' ? 'Published' : 'Coming Soon'}
              </span>
              <div className="flex items-center gap-[13px]">
                {item.status === 'published' ? (
                  <>
                    <button className="text-[12.5px] font-bold text-brand bg-none border-none cursor-pointer font-sans hover:underline">Preview</button>
                    <button className="text-[12.5px] font-bold text-brand bg-none border-none cursor-pointer font-sans hover:underline">Edit</button>
                    <button className="text-[12.5px] font-bold text-accent bg-none border-none cursor-pointer font-sans hover:underline">Hide</button>
                  </>
                ) : (
                  <span className="text-[12.5px] font-bold text-muted cursor-default">Coming soon</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function ResourcesPage() {
  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Topbar title="Resources Manager" />
        <Button variant="primary">
          <i className="ti ti-plus text-[13px] mr-1" />Add Resource
        </Button>
      </div>
      <div className="text-[12.5px] text-muted -mt-[10px]">
        Manage the handbooks, toolkits, and videos members see in their portal.
      </div>

      <Card>
        <ResourceSection icon="book" title="Handbooks" items={HANDBOOKS} />
        <ResourceSection icon="briefcase" title="Project Toolkits" items={TOOLKITS} />
        <ResourceSection icon="video" title="Video Tutorials" items={VIDEOS} />
        <ResourceSection icon="dots" title="Other" items={OTHER} />
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
    </>
  );
}
