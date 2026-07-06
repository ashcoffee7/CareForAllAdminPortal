import { useState } from 'react';
import { Topbar } from '../../components/Topbar';
import { Card } from '../../components/Card';
import { StatCard } from '../../components/StatCard';
import { SearchBar } from '../../components/SearchBar';
import { useMentors } from './useMentors';
import { MentorAvailabilityList } from './MentorAvailabilityList';

export function MentorshipPage() {
  const { mentors, sessionCount, setMentorAvailability } = useMentors();
  const [search, setSearch] = useState('');

  const availableCount = mentors.filter((m) => m.available).length;

  return (
    <>
      <Topbar title="Mentorship" />

      <div className="grid grid-cols-4 max-portal:grid-cols-2 gap-[14px]">
        <StatCard label="Total Mentors" value={mentors.length} />
        <StatCard label="Available for Booking" value={availableCount} valueClassName="text-success" />
        <StatCard label="Unavailable" value={mentors.length - availableCount} valueClassName="text-muted" />
        <StatCard label="Total Sessions" value={sessionCount ?? '—'} />
      </div>

      <Card>
        <div className="text-[14px] font-bold text-text mb-[6px] flex items-center gap-2">
          <i className="ti ti-toggle-right text-muted text-[17px]" /> Mentor Booking Availability
        </div>
        <div className="text-[12.5px] text-muted mb-[18px] leading-[1.5]">
          Toggle a mentor ON to let members click "Book Session" and reach their Calendly link. Turning a mentor OFF requires confirmation.
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search mentors by name..." className="mb-[14px]" />

        <MentorAvailabilityList mentors={mentors} searchQuery={search} onSetAvailability={setMentorAvailability} />
      </Card>
    </>
  );
}
