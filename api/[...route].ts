import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from './_lib/auth';
import { sendError, sendJson } from './_lib/http';
import { chapters } from './_handlers/chapters';
import { profiles } from './_handlers/profiles';
import { serviceLogs } from './_handlers/serviceLogs';
import { chapterCheckins } from './_handlers/chapterCheckins';
import { checkinDeadlines } from './_handlers/checkinDeadlines';
import { mentors } from './_handlers/mentors';
import { mentorshipSessions } from './_handlers/mentorshipSessions';
import { overview } from './_handlers/overview';
import { leaderboard } from './_handlers/leaderboard';
import { impact } from './_handlers/impact';
import { approvals } from './_handlers/approvals';

// Single catch-all entry point for the entire API. Every file directly
// under /api (one per resource/verb) counts as its own Vercel Serverless
// Function, and the Hobby plan caps a deployment at 12 -- this app has
// more resources than that once you split list/create from get/patch/
// delete. Routing everything through one function (with the actual logic
// living in api/_handlers/*, which Vercel ignores for routing purposes
// because of the leading underscore) keeps this at exactly 1 Function no
// matter how many resources get added later.
//
// URL shape is unchanged for the frontend: /api/chapters/enriched still
// works the same as before, just dispatched here instead of by a
// same-named file.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.route;
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const [resource, sub] = segments;

  try {
    const ctx = await requireUser(req);

    switch (resource) {
      case 'chapters': return await chapters(req, res, ctx, sub);
      case 'profiles': return await profiles(req, res, ctx, sub);
      case 'service-logs': return await serviceLogs(req, res, ctx, sub);
      case 'chapter-checkins': return await chapterCheckins(req, res, ctx);
      case 'checkin-deadlines': return await checkinDeadlines(req, res, ctx);
      case 'mentors': return await mentors(req, res, ctx, sub);
      case 'mentorship-sessions': return await mentorshipSessions(req, res, ctx);
      case 'overview': return await overview(req, res, ctx, sub);
      case 'leaderboard': return await leaderboard(req, res, ctx, sub);
      case 'impact': return await impact(req, res, ctx, sub);
      case 'approvals': return await approvals(req, res, ctx, sub);
      default:
        sendJson(res, 404, { error: `Unknown route: /${segments.join('/')}` });
    }
  } catch (err) {
    sendError(res, err);
  }
}
