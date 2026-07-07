import { useState } from 'react';
import { Topbar } from '../../components/Topbar';
import { Card } from '../../components/Card';
import { StatCard } from '../../components/StatCard';
import { SearchBar } from '../../components/SearchBar';
import { useMemberAggregates } from './useMemberAggregates';
import { useMemberDirectory, MEMBER_PAGE_SIZE } from './useMemberDirectory';
import { computeGenderEntries, computeEducationEntries, computeAgeEntries } from './demographics';
import { DemographicsBars } from './DemographicsBars';
import { MemberDirectory } from './MemberDirectory';

export function MembersPage() {
  const { members: allMembers, chapterCount } = useMemberAggregates();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { members: pageMembers, total } = useMemberDirectory(search, page);

  const genderEntries = computeGenderEntries(allMembers);
  const educationEntries = computeEducationEntries(allMembers);
  const { entries: ageEntries, withDobCount } = computeAgeEntries(allMembers);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <>
      <Topbar title="Members & Demographics" />

      <div className="grid grid-cols-4 max-portal:grid-cols-2 gap-[14px]">
        <StatCard label="Total Members" value={allMembers.length} />
        <StatCard label="Total Chapters" value={chapterCount ?? '—'} />
        <StatCard label="Total Countries" value="Not tracked" valueClassName="text-muted text-[16px]" />
        <StatCard label="Total States" value="Not tracked" valueClassName="text-muted text-[16px]" />
      </div>

      <div className="grid grid-cols-2 max-portal:grid-cols-1 gap-[18px]">
        <Card>
          <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
            <i className="ti ti-world text-muted text-[17px]" /> Members by Country
          </div>
          <div className="text-center py-6 text-muted text-[13px] leading-[1.6]">
            Location isn't collected yet -- every member profile currently has an empty location field. This will populate once location data starts being gathered.
          </div>
        </Card>
        <Card>
          <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
            <i className="ti ti-map-pin text-muted text-[17px]" /> Members by U.S. State
          </div>
          <div className="text-center py-6 text-muted text-[13px] leading-[1.6]">
            Location isn't collected yet -- every member profile currently has an empty location field. This will populate once location data starts being gathered.
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
          <i className="ti ti-cake text-muted text-[17px]" /> Age Distribution
        </div>
        <div className="text-[11.5px] text-muted mb-[10px]">Based on date of birth, where provided.</div>
        <DemographicsBars entries={ageEntries} />
        <div className="text-[11px] text-muted mt-2">
          Based on {withDobCount} of {allMembers.length} members with a birthdate on file.
        </div>
      </Card>

      <div className="grid grid-cols-2 max-portal:grid-cols-1 gap-[18px]">
        <Card>
          <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
            <i className="ti ti-gender-bigender text-muted text-[17px]" /> Gender Distribution
          </div>
          <DemographicsBars entries={genderEntries} />
        </Card>
        <Card>
          <div className="text-[14px] font-bold text-text mb-4 flex items-center gap-2">
            <i className="ti ti-school text-muted text-[17px]" /> Education Level
          </div>
          <DemographicsBars entries={educationEntries} />
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[14px] font-bold text-text flex items-center gap-2">
            <i className="ti ti-list text-muted text-[17px]" /> All Members
          </div>
          <SearchBar value={search} onChange={handleSearchChange} placeholder="Search members..." className="w-[220px]" />
        </div>
        <MemberDirectory members={pageMembers} page={page} pageSize={MEMBER_PAGE_SIZE} total={total} onPageChange={setPage} />
      </Card>
    </>
  );
}
