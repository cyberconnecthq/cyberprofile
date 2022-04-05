// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { isAddress } from "@ethersproject/address";

import { CyberProvider } from "../../utils/resolver";
const provider = new CyberProvider(
  "https://mainnet.infura.io/v3/df3ea510dc9b4b16b05e7ddf74b64f19"
);

type Data = {
  address: string;
  name: string | null;
  displayName: string | null; // this is reverse look up name on the address. If user input an address, the name and displayName will always match
  avatar: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const queryId = req.query.id;
  const id = Array.isArray(queryId) ? queryId[0] : queryId;

  try {
    const { address, name } = await parseId(id);

    const { displayName, avatar } = await resolveEns(address);

    res.status(200).json({ address, name, displayName, avatar });
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
  const displayName = await provider.lookupAddress(address);
  const avatar = displayName ? await provider.getAvatar(displayName) : null;
  return {
    displayName,
    avatar,
  };
};
