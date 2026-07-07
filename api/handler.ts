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

// Single entry point for the entire API. Every file directly under /api
// (one per resource/verb) counts as its own Vercel Serverless Function,
// and the Hobby plan caps a deployment at 12 -- this app has more
// resources than that once you split list/create from get/patch/delete.
//
// This used to be a bracket catch-all (api/[...route].ts), which turned
// out not to reliably match multi-segment paths in Vercel's plain (non-
// Next.js) function routing -- single-segment routes like
// /api/service-logs worked, but two-segment ones like
// /api/overview/stats 404'd. Instead, vercel.json explicitly rewrites
// every /api/:path* request to /api/handler?path=:path*, so the sub-path
// arrives as a plain, guaranteed-reliable query string rather than
// depending on bracket-route matching. URL shape is unchanged for the
// frontend -- /api/chapters/enriched still resolves the same way.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = req.query.path;
  const pathString = Array.isArray(rawPath) ? rawPath.join('/') : rawPath ?? '';
  const segments = pathString.split('/').filter(Boolean);
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
