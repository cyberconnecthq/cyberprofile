/**
 * @swagger
 * components:
 *  schemas:
 *    Profile:
 *      type: object
 *      properties:
 *        address:
 *          type: string
 *        name:
 *          type: string
 *          nullable: true
 *        primaryName:
 *          type: string
 *          nullable: true
 *        ensAvatar:
 *          type: object
 *          nullable: true
 *          properties:
 *            record:
 *              type: string
 *            type:
 *              type: string
 *              enum: ["uri:https", "uri:data", "uri:ipfs", "nft:erc721", "nft:erc1155"]
 *            nftMedata:
 *              type: string
 *              nullable: true
 *            nftOwner:
 *              type: string
 *              nullable: true
 *            nftBalance:
 *              type: string
 *              nullable: true
 *            nftOwned:
 *              type: boolean
 *              nullable: true
 *            url:
 *              type: string
 *              format: uri
 *              nullable: true
 *
 */

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
