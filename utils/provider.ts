import { CyberProvider } from "./resolver";

export const provider = new CyberProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`
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
