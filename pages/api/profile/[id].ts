// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { parseId } from '@/utils/parser'
import { NotFoundError } from "@/utils/const";
import { resolveEns } from "@/utils/provider";

export type DataEnsAvatar = {
  record: string; // the original avatar text record
  type: "uri:https" | "uri:data" | "uri:ipfs" | "nft:erc721" | "nft:erc1155"; // the type of avatar text record. supports `uri:https`, `uri:data`, `uri:ipfs`, `nft-erc721`, `nft-erc1155`. see https://docs.ens.domains/ens-improvement-proposals/ensip-12-avatar-text-records nftMetadataURL: string | null; // only available if use NFT type record
  nftMetadata: string | null; // the metadata of that NFT
  nftOwner: string | null; // the owner of that NFT (ERC721)
  nftBalance: string | null; // the balance of the address for the NFT (ERC1155)
  nftOwned: boolean | null; // whether he owns that NFT or not
  url: string | null; // final resolution
};

export type Data = {
  address: string;
  name: string | null; 
  primaryName: string | null; // primary name/reverse record on the address. If user input an address, the name and displayName will always match
  ensAvatar: DataEnsAvatar | null;
};


/**
 * @swagger
 * components:
 *  schemas:
 *    Profile:
 *      type: object
 *      properties:
 *        address:
 *          type: string
 *          description: The address.
 *        name:
 *          type: string
 *          nullable: true
 *          description: Should be the same as primaryName unless query was with made with non-primary ENS
 *        primaryName:
 *          type: string
 *          nullable: true
 *          description: The primary name / reverse record for the address
 *        ensAvatar:
 *          type: object
 *          nullable: true
 *          properties:
 *            record:
 *              type: string
 *              description: The original avatar text record set in ENS
 *            type:
 *              type: string
 *              enum: ["uri:https", "uri:data", "uri:ipfs", "nft:erc721", "nft:erc1155"]
 *              description: The type of ENS avatar
 *            nftMedata:
 *              type: string
 *              nullable: true
 *              description: The metadata json of the avatar NFT
 *            nftOwner:
 *              type: string
 *              nullable: true
 *              description: The owner of the avatar NFT (ERC721)
 *            nftBalance:
 *              type: string
 *              nullable: true
 *              description: The balance of the avatar NFT owned by ENS holder (ERC1155) 
 *            nftOwned:
 *              type: boolean
 *              nullable: true
 *              description: Whether the ENS holder owns the avatar NFT
 *            url:
 *              type: string
 *              format: uri
 *              nullable: true
 *              description: The avatar NFT image url
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

