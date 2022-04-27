import { isAddress } from "@ethersproject/address";
import { NotFoundError } from "./const";
import { provider } from "./provider";

// returns address in lower case and ens

export const parseId = async (id: string) => {
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
