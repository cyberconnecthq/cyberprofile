import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { CERAMIC_API_URL, model } from "./const";

export class CeramicResolver {
  address: string = "";
  ceramicClient: CeramicClient;
  basicProfileDocument: TileDocument<any> | undefined;

  constructor(address: string) {
    this.address = address;
    this.ceramicClient = new CeramicClient(CERAMIC_API_URL);
  }

  async initDocument() {
    const pkh = `did:pkh:eip155:1:${this.address}`;
    const promises = [this.createBasicProfile(pkh)];

    await Promise.all(promises).then(() => {});
  }
  async createBasicProfile(did: string) {
    if (this.basicProfileDocument) {
      return this.basicProfileDocument;
    }
    const doc = await this.createDocument(did, model.schemas.basicProfile);
    console.log("b", doc?.content);
    this.basicProfileDocument = doc;
    return doc;
  }

  async createDocument(did: string, schema: string) {
    console.log('+++', did, schema, this.ceramicClient);
    try {
      const deterministicDocument = await TileDocument.deterministic(
        this.ceramicClient,
        {
          deterministic: true,
          family: "IDX",
          controllers: [did],
          schema,
        }
      );

      console.log('deter', deterministicDocument.content, deterministicDocument.id.toString())
      return deterministicDocument;
    } catch (error) {
      console.log(error);
    }
  }

  async getProfile() {
    await this.initDocument();
    return this.basicProfileDocument?.content || {};
  }
}
