import { Resolver, StaticJsonRpcProvider } from "@ethersproject/providers";
import {
  hexConcat,
  hexDataSlice,
  hexZeroPad,
  isHexString,
} from "@ethersproject/bytes";
import { BigNumber } from "@ethersproject/bignumber";
import { toUtf8String } from "@ethersproject/strings";
import { fetchJson } from "@ethersproject/web";
import { namehash } from "@ethersproject/hash";
import { Logger } from "@ethersproject/logger";
// Forked on 4/5/2022
const version = "providers/5.6.2";
const logger = new Logger(version);

const matcherIpfs = new RegExp("^(ipfs)://(.*)$", "i");
const matchers = [
  new RegExp("^(https)://(.*)$", "i"),
  new RegExp("^(data):(.*)$", "i"),
  matcherIpfs,
  new RegExp("^eip155:[0-9]+/(erc[0-9]+):(.*)$", "i"),
];

// Trim off the ipfs:// prefix and return the default gateway URL
function getIpfsLink(link: string): string {
  if (link.match(/^ipfs:\/\/ipfs\//i)) {
    link = link.substring(12);
  } else if (link.match(/^ipfs:\/\//i)) {
    link = link.substring(7);
  } else {
    logger.throwArgumentError("unsupported IPFS format", "link", link);
  }

  return `https:/\/gateway.ipfs.io/ipfs/${link}`;
}

function _parseBytes(result: string, start: number): null | string {
  if (result === "0x") {
    return null;
  }

  const offset = BigNumber.from(
    hexDataSlice(result, start, start + 32)
  ).toNumber();
  const length = BigNumber.from(
    hexDataSlice(result, offset, offset + 32)
  ).toNumber();

  return hexDataSlice(result, offset + 32, offset + 32 + length);
}

function _parseString(result: string, start: number): null | string {
  try {
    // @ts-ignore
    return toUtf8String(_parseBytes(result, start));
  } catch (error) {}
  return null;
}

type CyberAvatarExtra = {
  name: string;
  type: "uri:https" | "uri:data" | "uri:ipfs" | "nft:erc721" | "nft:erc1155";
  record: string;
  owner?: string;
  balance?: string;
  owned?: boolean;
  metadataUrlBase?: string;
  metadataUrlExpanded?: string;
  metadataUrl?: string;
  metadata?: string;
  metadataImageUrlIPFS?: string;
  metadataImageUrl?: string;
};
type CyberAvatar = {
  extra: CyberAvatarExtra;
  url: string;
};

export class CyberResolver extends Resolver {
  async getCyberAvatar(): Promise<null | CyberAvatar> {
    try {
      // test data for ricmoo.eth
      //const avatar = "eip155:1/erc721:0x265385c7f4132228A0d54EB1A9e7460b91c0cC68/29233";
      const avatar = await this.getText("avatar");
      if (avatar == null) {
        return null;
      }

      for (let i = 0; i < matchers.length; i++) {
        const match = avatar.match(matchers[i]);
        if (match == null) {
          continue;
        }

        const scheme = match[1].toLowerCase();

        switch (scheme) {
          case "https":
            return {
              extra: {
                name: this.name,
                type: "uri:https",
                record: avatar,
              },
              url: avatar,
            };

          case "data":
            return {
              extra: {
                name: this.name,
                type: "uri:data",
                record: avatar,
              },
              url: avatar,
            };

          case "ipfs":
            return {
              extra: {
                name: this.name,
                type: "uri:ipfs",
                record: avatar,
              },
              url: avatar,
            };

          case "erc721":
          case "erc1155": {
            // Depending on the ERC type, use tokenURI(uint256) or url(uint256)
            const selector = scheme === "erc721" ? "0xc87b56dd" : "0x0e89341c";
            const extra: CyberAvatarExtra = {
              name: this.name,
              type: `nft:${scheme}`,
              record: avatar,
            };

            // The owner of this name
            const owner = this._resolvedAddress || (await this.getAddress());

            const comps = (match[2] || "").split("/");
            if (comps.length !== 2) {
              return null;
            }

            const addr = await this.provider.formatter.address(comps[0]);
            const tokenId = hexZeroPad(
              BigNumber.from(comps[1]).toHexString(),
              32
            );

            // Check that this account owns the token
            if (scheme === "erc721") {
              // ownerOf(uint256 tokenId)
              const tokenOwner = this.provider.formatter.callAddress(
                await this.provider.call({
                  to: addr,
                  data: hexConcat(["0x6352211e", tokenId]),
                })
              );
              extra.owner = tokenOwner;
              extra.owned = owner === tokenOwner;
            } else if (scheme === "erc1155") {
              // balanceOf(address owner, uint256 tokenId)
              const balance = BigNumber.from(
                await this.provider.call({
                  to: addr,
                  data: hexConcat([
                    "0x00fdd58e",
                    hexZeroPad(owner, 32),
                    tokenId,
                  ]),
                })
              );
              extra.balance = balance.toString();
              extra.owned = !balance.isZero();
            }

            // Call the token contract for the metadata URL
            const tx = {
              to: this.provider.formatter.address(comps[0]),
              data: hexConcat([selector, tokenId]),
            };

            let metadataUrl = _parseString(await this.provider.call(tx), 0);
            if (metadataUrl == null) {
              return null;
            }
            extra.metadataUrlBase = metadataUrl;

            // ERC-1155 allows a generic {id} in the URL
            if (scheme === "erc1155") {
              metadataUrl = metadataUrl.replace("{id}", tokenId.substring(2));
              extra.metadataUrlExpanded = metadataUrl;
            }

            // Transform IPFS metadata links
            if (metadataUrl.match(/^ipfs:/i)) {
              metadataUrl = getIpfsLink(metadataUrl);
            }

            extra.metadataUrl = metadataUrl;

            // Get the token metadata
            const metadata = await fetchJson(metadataUrl);
            if (!metadata) {
              return null;
            }
            extra.metadata = JSON.stringify(metadata);

            // Pull the image URL out
            let imageUrl = metadata.image;
            if (typeof imageUrl !== "string") {
              return null;
            }

            if (imageUrl.match(/^(https:\/\/|data:)/i)) {
              // Allow
            } else {
              // Transform IPFS link to gateway
              const ipfs = imageUrl.match(matcherIpfs);
              if (ipfs == null) {
                return null;
              }

              extra.metadataImageUrlIPFS = imageUrl;
              imageUrl = getIpfsLink(imageUrl);
            }

            extra.metadataImageUrl = imageUrl;

            return { extra, url: imageUrl };
          }
        }
      }
    } catch (error) {}

    return null;
  }
}

export class CyberProvider extends StaticJsonRpcProvider {
  async getResolver(name: string): Promise<null | Resolver> {
    let currentName = name;
    while (true) {
      if (currentName === "" || currentName === ".") {
        return null;
      }

      // Optimization since the eth node cannot change and does
      // not have a wildcar resolver
      if (name !== "eth" && currentName === "eth") {
        return null;
      }

      // Check the current node for a resolver
      const addr = await this._getResolver(currentName, "getResolver");

      // Found a resolver!
      if (addr != null) {
        const resolver = new CyberResolver(this, addr, name);

        // Legacy resolver found, using EIP-2544 so it isn't safe to use
        if (currentName !== name && !(await resolver.supportsWildcard())) {
          return null;
        }

        return resolver;
      }

      // Get the parent node
      currentName = currentName.split(".").slice(1).join(".");
    }
  }
  async getCyberAvatar(nameOrAddress: string): Promise<null | CyberAvatar> {
    // @ts-ignore
    let resolver: CyberResolver = null;
    if (isHexString(nameOrAddress)) {
      // Address; reverse lookup
      const address = this.formatter.address(nameOrAddress);

      const node = address.substring(2).toLowerCase() + ".addr.reverse";

      const resolverAddress = await this._getResolver(node, "getAvatar");
      if (!resolverAddress) {
        return null;
      }

      // Try resolving the avatar against the addr.reverse resolver
      resolver = new CyberResolver(this, resolverAddress, node);
      try {
        const avatar = await resolver.getCyberAvatar();

        if (avatar) {
          return avatar;
        }
      } catch (error) {
        // @ts-ignore
        if (error.code !== Logger.errors.CALL_EXCEPTION) {
          throw error;
        }
      }

      // XXX(@ryanli): Not sure what this part does
      // Try getting the name and performing forward lookup; allowing wildcards
      try {
        // keccak("name(bytes32)")
        const name = _parseString(
          await this.call({
            to: resolverAddress,
            data: "0x691f3431" + namehash(node).substring(2),
          }),
          0
        );
        // @ts-ignore
        resolver = await this.getResolver(name);
      } catch (error) {
        // @ts-ignore
        if (error.code !== Logger.errors.CALL_EXCEPTION) {
          throw error;
        }
        return null;
      }
    } else {
      // ENS name; forward lookup with wildcard
      // @ts-ignore
      resolver = await this.getResolver(nameOrAddress);
      if (!resolver) {
        return null;
      }
    }

    const avatar = await resolver.getCyberAvatar();

    return avatar;
  }
}
