import { NextRequest, NextResponse } from 'next/server';
import { revalidateCatalog } from '@/lib/data';
import { db } from '@/lib/models';
import { withTransaction } from '@/lib/db';
import { badRequest, requireAdmin, serverError, unauthorized } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

/** Visitors get the videos that are switched on; the admin gets all of them (including hidden ones). */
export async function GET(request: NextRequest) {
  try {
    const admin = requireAdmin(request);
    const { CreatorVideo } = await db();
    return NextResponse.json(await CreatorVideo.find(admin ? {} : { isActive: true }).sort({ priority: 1 }));
  } catch (err) {
    return serverError(err);
  }
}

const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/** A video or picture address: a full web link, or a path on this site such as /videos/a.mp4. */
const isLink = (v: string) => /^https?:\/\/\S+$/i.test(v) || /^\/[^\s/][^\s]*$/.test(v);

/** Replaces the whole list in one step (the admin edits the list as a whole: add, hide, reorder, delete). */
export async function PUT(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return unauthorized();

  try {
    const body = await request.json();
    if (!Array.isArray(body)) return badRequest('Body must be a list of videos');
    if (body.length > 24) return badRequest('Please keep it to 24 videos or fewer.');

    const videos = body.map((v: Record<string, unknown>, i: number) => ({
      title: text(v.title, 120),
      creator: text(v.creator, 80),
      videoUrl: text(v.videoUrl, 1000),
      posterUrl: text(v.posterUrl, 1000),
      productId: v.productId ? text(v.productId, 60) : null,
      priority: i + 1,
      isActive: v.isActive !== false,
    }));

    if (videos.some((v) => !v.title || !v.videoUrl)) return badRequest('Every video needs a title and a video link.');
    if (videos.some((v) => !isLink(v.videoUrl) || (v.posterUrl && !isLink(v.posterUrl)))) {
      return badRequest('Video and cover picture must be full web links (https://…).');
    }

    const { CreatorVideo, ActivityLog } = await db();
    await withTransaction(async (session) => {
      await CreatorVideo.deleteMany({}, { session });
      if (videos.length > 0) await CreatorVideo.insertMany(videos, { session });
    });

    await ActivityLog.create({ adminName: admin.name, action: 'Updated Creator Videos', details: `${videos.length} videos, ${videos.filter((v) => v.isActive).length} visible` });

    revalidateCatalog();
    return NextResponse.json(await CreatorVideo.find().sort({ priority: 1 }));
  } catch (err) {
    return serverError(err);
  }
}
