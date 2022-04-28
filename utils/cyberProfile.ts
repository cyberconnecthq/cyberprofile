import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { Ed25519Provider } from "key-did-provider-ed25519";
import * as KeyDidResolver from "key-did-resolver";
import { DID } from "dids";
import { EthereumAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";
import { getCapability, setCapability, getSeed } from "./store";
import { Config, Profile } from "./types";
import { CERAMIC_API_URL, model } from "./const";
import { getAddressByProvider } from "./wallet";

export class CyberProfile {
  address: string = "";
  ceramicClient: CeramicClient;
  idxTableDocument: TileDocument<any> | undefined;
  basicProfileDocument: TileDocument<any> | undefined;
  provider: any = null;

  constructor(config: Config) {
    const { provider } = config;
    this.provider = provider;
    this.ceramicClient = new CeramicClient(CERAMIC_API_URL);
  }

  async getAddress() {
    if (this.address) {
      return this.address;
    }
    return (this.address = await getAddressByProvider(this.provider));
  }

  async getCapability() {
    const address = await this.getAddress();
    const cap = await getCapability(address);
    if (!cap) {
      const cap = await this.requestCapability();
      return cap;
    }
    return cap;
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

  async createIDXTable(did: string) {
    if (this.idxTableDocument) {
      return this.idxTableDocument;
    }
    const doc = await this.createDocument(did, model.schemas.idxTable);
    this.idxTableDocument = doc;
    return doc;
  }

  async createBasicProfile(did: string) {
    console.log('did', did)
    if (this.basicProfileDocument) {
      console.log('should not')
      return this.basicProfileDocument;
    }
    const doc = await this.createDocument(did, model.schemas.basicProfile);
    console.log('a', doc?.content)
    this.basicProfileDocument = doc;
    return doc;
  }

  async initDocument() {
    const address = await this.getAddress();
    if (!address) {
      throw Error("Address is empty");
    }

    const pkh = `did:pkh:eip155:1:${address}`;
    const promises = [this.createIDXTable(pkh), this.createBasicProfile(pkh)];

    await Promise.all(promises).then(() => {});
  }

  async getEthereumAuthProvider() {
    const address = await this.getAddress();
    return new EthereumAuthProvider(this.provider, address);
  }

  async getDidKey(address: string) {
    const seed = await getSeed(address);

    const didProvider = new Ed25519Provider(seed);
    const did = new DID({
      provider: didProvider,
      resolver: KeyDidResolver.getResolver(),
    });

    await did.authenticate();
    return did;
  }

  async requestCapability() {
    try {
      const address = await this.getAddress();
      if (!this.idxTableDocument || !this.basicProfileDocument) {
        window.alert("documents hasn't yet been created...");
        return;
      }
      const eap = await this.getEthereumAuthProvider();
      const didKey = await this.getDidKey(address);

      const cap = await eap.requestCapability(didKey.id, [
        `${this.idxTableDocument.id.toUrl()}`,
        `${this.basicProfileDocument.id.toUrl()}`,
      ]);

      await setCapability(address, cap);

      if (!this.idxTableDocument.content[model.definitions.basicProfile]) {
        await this.updateDocument(this.idxTableDocument, {
          [model.definitions.basicProfile]:
            this.basicProfileDocument.id.toUrl(),
        });
      }

      return cap;
    } catch (error) {
      console.error(error);
    }
  }

  async updateDocument(
    document: TileDocument<any> | undefined,
    content: object
  ) {
    try {
      const address = await this.getAddress();
      const capability = await this.getCapability();
      if (document && capability) {
        const dappKey = await this.getDidKey(address);
        const dappKeyWithCap = dappKey.withCapability(capability);
        await dappKeyWithCap.authenticate();

        await document.update(
          content,
          {},
          {
            asDID: dappKeyWithCap,
            anchor: false,
            publish: false,
          }
        );
      } else {
        throw Error("document is empty");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async updateBasicProfile(profile: Profile) {
    const content = this.basicProfileDocument?.content || {};

    let pro;

    if (profile.image) {
      pro = {
        ...profile,
        image: {
          original: {
            src: profile.image,
            size: 80,
            width: 200,
            height: 200,
            mimeType: "image/png",
          },
        },
      };
    } else {
      pro = { ...profile };
    }

    // content.name = name || content.name;
    // content.description = description || content.description;
    // content.url = url || content.url;
    // content.image = image || content.image;

    //  await this.updateDocument(this.basicProfileDocument, content);

    await this.updateDocument(this.basicProfileDocument, {
      ...content,
      ...pro,
    });
  }

  async updateProfile(profile: Profile) {
    await this.initDocument();
    await this.updateBasicProfile(profile);
  }

  async getProfile() {
    await this.initDocument();
    console.log('here')
    return this.basicProfileDocument?.content || {};
  }
}
