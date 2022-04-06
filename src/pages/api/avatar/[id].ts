// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { NotFoundError } from "@/utils/const";
import { parseId } from "@/utils/parser";
import { resolveEns } from "@/utils/provider";
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import sharp from "sharp";

const maxSize = 4 * 1024 * 1024; // 4mb is max response size for vercel serverless

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Buffer>
) {
  const queryId = req.query.id;
  const id = Array.isArray(queryId) ? queryId[0] : queryId;
  try {
    const { address, name } = await parseId(id);
    const { primaryName, avatar } = await resolveEns(address);
    if (avatar?.url) {
      const url = avatar.url;
      const result = (await axios({ url, responseType: "arraybuffer" }))
        .data as Buffer;
      const sharped = await sharp(result).webp({ lossless: true }).toBuffer();
      if (result.length > maxSize) {
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
    if (e === NotFoundError) {
      res.status(404).end();
    }
  }
}
