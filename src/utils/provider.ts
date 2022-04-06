import { CyberProvider } from "./resolver";

export const provider = new CyberProvider(
  "https://mainnet.infura.io/v3/df3ea510dc9b4b16b05e7ddf74b64f19"
);


export const resolveEns = async (address: string) => {
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
