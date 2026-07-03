// Which profiles.role values count as "a member" for stats/counts across
// the app. Centralized here so Overview and Members & Demographics (and
// anything else that needs this) can't drift out of sync with each other.
export var MEMBER_ROLES = ['independent_member', 'chapter_member', 'chapter_lead'];