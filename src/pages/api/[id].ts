// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { isAddress } from "@ethersproject/address";

import { CyberProvider } from "../../utils/resolver";
const provider = new CyberProvider(
  "https://mainnet.infura.io/v3/df3ea510dc9b4b16b05e7ddf74b64f19"
);

type DataEnsAvatar = {
  record: string; // the original avatar text record
  type: "uri:https" | "uri:data" | "uri:ipfs" | "nft:erc721" | "nft:erc1155"; // the type of avatar text record. supports `uri:https`, `uri:data`, `uri:ipfs`, `nft-erc721`, `nft-erc1155`. see https://docs.ens.domains/ens-improvement-proposals/ensip-12-avatar-text-records nftMetadataURL: string | null; // only available if use NFT type record
  nftMetadata?: string; // the metadata of that NFT
  nftOwner?: string; // the owner of that NFT (ERC721)
  nftBalance?: string; // the balance of the address for the NFT (ERC1155)
  nftOwned?: boolean; // whether he owns that NFT or not
  url: string; // final resolution
};

type Data = {
  address: string;
  name: string | null;
  primaryName: string | null; // primary name/reverse record on the address. If user input an address, the name and displayName will always match
  ensAvatar: DataEnsAvatar | null;
};

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
        nftMetadata: extra.metadata,
        nftOwner: extra.owner,
        nftBalance: extra.balance,
        nftOwned: extra.owned,
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

export const NotFoundError = new Error("Not Found");

// returns address in lower case and ens
const parseId = async (id: string) => {
  // is ens
  if (id.endsWith(".eth")) {
    const address = await provider.resolveName(id);
    if (address === null) {
      throw NotFoundError;
    }
    return { address, name: id };
  }

  // is address
  if (!isAddress(id)) {
    throw NotFoundError;
  }
  const name = await provider.lookupAddress(id);
  return { address: id.toLowerCase(), name };
};

const resolveEns = async (address: string) => {
  const primaryName = await provider.lookupAddress(address);
  // NOTE: always use primary name to look up avatar since avatar is bind to ens instead of address
  const avatar = primaryName
    ? await provider.getCyberAvatar(primaryName)
    : null;
  return {
    primaryName,
    avatar,
  };
};
