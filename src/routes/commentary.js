import { Router } from "express";
import { matchIdParamSchema } from '../validation/matches.js';
import { listCommentaryQuerySchema } from '../validation/commentary.js';
import { createCommentarySchema } from '../validation/commentary.js';
import { db } from '../db/db.js';
import { commentary } from '../db/schema.js';
import { desc, eq } from 'drizzle-orm';

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get('/', async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({ error: 'Invalid match id', details: JSON.stringify(paramsParsed.error) });
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({ error: 'Invalid query parameters', details: JSON.stringify(queryParsed.error) });
  }

  const MAX_LIMIT = 100;
  const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, paramsParsed.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list commentary', details: err.message });
  }
});

// create a commentary entry for a specific match
commentaryRouter.post('/', async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ error: 'Invalid match id', details: JSON.stringify(paramsResult.error) });
  }

  const bodyResult = createCommentarySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: JSON.stringify(bodyResult.error) });
  }

  try {
    const [result]=await db.insert(commentary).values({
        matchId: paramsResult.data.id,
        ...bodyResult.data
    }).returning();
    if(res.app.locals.broadcastCommentaryCreated){
        res.app.locals.broadcastCommentaryCreated(result.matchId,result);
    }

    res.status(201).json({ data: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create commentary', details: err.message });
  }
});