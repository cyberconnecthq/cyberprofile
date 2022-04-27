// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { parseId } from '@/utils/parser'
import { NotFoundError } from "@/utils/const";
import { resolveEns } from "@/utils/provider";
import { Data, DataEnsAvatar } from "../../../models/profile";

/**
 * @swagger
 * /api/profile/{id}:
 *   get:
 *     tags: [Profile]
 *     summary: Get the user profile for this id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: address or ENS name
 *     responses:
 *       200:
 *         description: Success
 *         headers:
 *           x-vercel-cache: 
 *             type: "string"
 *             description: "vercel serverless cache state. see https://vercel.com/docs/concepts/edge-network/caching#x-vercel-cache"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: An avatar is not set for this id
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const queryId = req.query.id;
  const id = Array.isArray(queryId) ? queryId[0] : queryId;

  try {
    const { address, name } = await parseId(id);

    const { primaryName, avatar } = await resolveEns(address);

    let ensAvatar: DataEnsAvatar | null = null;
    if (avatar) {
      const extra = avatar.extra;
      ensAvatar = {
        record: extra.record,
        type: extra.type,
        nftMetadata: extra.metadata ?? null,
        nftOwner: extra.owner ?? null,
        nftBalance: extra.balance ?? null,
        nftOwned: extra.owned ?? null,
        url: avatar.url,
      };
    }

    res
      .status(200)
      .setHeader(
        "Cache-Control",
        `s-maxage=${60 * 60 * 24}, stale-while-revalidate`
      )
      .json({ address, name, primaryName, ensAvatar });
  } catch (e) {
    if (e === NotFoundError) {
      res.status(404).end();
    }
  }
}

