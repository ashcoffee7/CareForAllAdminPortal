// Shared by the Members demographics age-bucket chart and the member
// profile modal, which both need to turn a date_of_birth into a whole
// number of years.
export function ageFromDob(dobStr: string): number {
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) { age--; }
  return age;
}
