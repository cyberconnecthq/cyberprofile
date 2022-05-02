# CyberProfile
![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=cyberprofile)

Resolve ENS avatar and profile for web3 addresses on backends with vercel serverless caching (10ms latency if cache hit). Also supports Ceramic!

Inspired by [ens-ideas](https://github.com/holic/ens-ideas), [stamp](stamp.fyi) and [ens-metadata-server](https://metadata.ens.domains/docs).

## Motivation
ENS provides the easiest way for users to own names and set their avatars. Projects that integrates with ENS generally rely on frontend `ether.js` package to resolve users' name and avatar. A couple issues surfaced during my development with `ether.js` resolving ENS.
1. Long loading time. Requires multiple network calls to resolve an avatar ENS: calls ENS resolver, calls NFT contract if avatar set to NFT, calls NFT metadata server.
2. Easily run out of Infura/Alchemy quota if not careful. A social application generally has a lot of places for showing names and avatars, this could lead to resolving the same address multiple times per page load.
3. Inconsistency around library interpretation for `NFT Avatar` that uses `CAIP-22` or `CAIP-29` (https://docs.ens.domains/ens-improvement-proposals/ensip-12-avatar-text-records). `ether.js` won't return an avatar if the NFT is not owned by the ENS name holder. `ens-metadata-server` would return regardless. No where to get that ownership info directly.
4. Complexity around user owning multiple ENS's. Avatar is bind to the ENS and not to the address, so there are cases where developers resolve a non-primary ENS (with avatar A) to an address and resolves that address's primary ENS (with avatar B).

## Opinionated
This is definitely an opinionated aproach which saves some ambiguity.
1. Backend resolving with caching. Fast and saves infura quota.
2. Gives NFT ownership data back to dev and let them decide how to display the avatar.
3. Always returns the avatar bind to the primary ENS.
4. Supports both returning metadata or avatar image itself.
5. Supports Ceramic (self-soverign data stream)
6. Supports avatar resizing for different device size and use case.

## Usage
It's open source so you can host yourself very easily (maybe also using vercel)

Use the hosted API [here](https://cyberprofile.vercel.app/). A SwaggerUI is available.

## Examples
**Profile Metadata**
```
https://cyberprofile.vercel.app/api/profile/pisofa.eth
```
```
{
   "address":"0xeBeD0BF2701e905b4C576B3dC943D797bAc226ed",
   "name":"pisofa.eth",
   "primaryName":"pisofa.eth",
   "ensAvatar":{
      "record":"eip155:1/erc721:0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B/11850",
      "type":"nft:erc721",
      "nftMetadata":"{\"name\":\"CloneX #18924\",\"description\":\"🧬 CLONE X 🧬\\n\\n20,000 next-gen Avatars, by RTFKT and Takashi Murakami 🌸\\n\\nIf you own a clone without any Murakami trait please read the terms regarding RTFKT - Owned Content here: https://rtfkt.com/legal-2A\\n\\nYou are also entitled to a commercial license, please read the terms to that here: https://rtfkt.com/legal-2C\",\"attributes\":[{\"trait_type\":\"DNA\",\"value\":\"Human\"},{\"trait_type\":\"Eye Color\",\"value\":\"BLU\"},{\"trait_type\":\"Hair\",\"value\":\"BLU Curtains\"},{\"trait_type\":\"Clothing\",\"value\":\"BLCK VARSITY JCKT\"},{\"trait_type\":\"Mouth\",\"value\":\"ROBO\"}],\"image\":\"https://clonex-assets.rtfkt.com/images/11850.png\"}",
      "nftOwner":"0xeBeD0BF2701e905b4C576B3dC943D797bAc226ed",
      "nftBalance":null,
      "nftOwned":true,
      "url":"https://clonex-assets.rtfkt.com/images/11850.png"
   }
}
```
**Avatar with resizing**
```
https://cyberprofile.vercel.app/api/avatar/pisofa.eth?s=500
```

## Used by (add your project by PR)
- [CyberConnect](https://cyberconnect.me/)