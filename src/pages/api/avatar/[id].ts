// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NotFoundError } from "@/utils/const";
import { parseId } from "@/utils/parser";
import { resolveEns } from "@/utils/provider";
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import sharp from "sharp";

const maxSize = 4 * 1024 * 1024; // 4mb is max response size for vercel serverless

/**
 * @swagger
 * /api/avatar/{id}:
 *   get:
 *     tags: [Avatar]
 *     summary: Get an avatar for this id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: address or ENS name
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer>
) {
  const queryId = req.query.id;
  let size = 80; // following gravatar default
  if (req.query.s) {
    const requestedSize = parseInt(req.query.s as string); // optional size input
    if (1 < requestedSize && requestedSize < 2048) {
      size = requestedSize
    }
  }
  const id = Array.isArray(queryId) ? queryId[0] : queryId;
  try {
    const { address } = await parseId(id);
    const { avatar } = await resolveEns(address);
    if (avatar?.url) {
      const url = avatar.url;
      const result = (await axios({ url, responseType: "arraybuffer" }))
        .data as Buffer;
      const sharped = await sharp(result)
        .resize(size, size)
        .webp({ lossless: true })
        .toBuffer();
      if (sharped.length > maxSize) {
        console.error(`response size is ${sharped.length}, > 4mb`);
        // TODO: resize
      }
      res
        .status(200)
        .setHeader(
          "Cache-Control",
          `s-maxage=${60 * 60 * 24}, stale-while-revalidate`
        )
        .setHeader("Content-Type", "image/webp")
        .send(sharped);
    } else {
      throw NotFoundError;
    }
  } catch (e) {
    console.error(e);
    if (e === NotFoundError) {
      res.status(404).end();
    }
  }
}
