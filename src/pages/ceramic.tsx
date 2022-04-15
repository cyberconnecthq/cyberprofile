import { useWeb3 } from "../context/web3Context";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { useEffect, useMemo, useState } from "react";
import type { Cacao } from "ceramic-cacao";
import { Ed25519Provider } from "key-did-provider-ed25519";
import * as KeyDidResolver from "key-did-resolver";
import { DID } from "dids";
import { EthereumAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";
import { getCapability, setCapability, getSeed } from "@/utils/store";

const CERAMIC_API_URL = "https://ceramic-clay.3boxlabs.com";
const ceramic = new CeramicClient(CERAMIC_API_URL);
const idxTableSchema =
  "ceramic://k3y52l7qbv1fryjn62sggjh1lpn11c56qfofzmty190d62hwk1cal1c7qc5he54ow";
const basicProfileSchema =
  "ceramic://k3y52l7qbv1frxt706gqfzmq6cbqdkptzk8uudaryhlkf6ly9vx21hqu4r6k1jqio";
const basicProfileDefinition = `kjzl6cwe1jw145cjbeko9kil8g9bxszjhyde21ob8epxuxkaon1izyqsu8wgcic`;

function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}

export default function Ceramic() {
  const { connectWallet, address, provider } = useWeb3();
  const [loading, setLoading] = useState<boolean>(true);
  const [name, setName] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [idxTableDocument, setIdxTableDocument] = useState<TileDocument<any>>();
  const [basicProfileDocument, setBasicProfileDocument] =
    useState<TileDocument<any>>();
  const [cap, setCap] = useState<Cacao>();

  const forceUpdate = useForceUpdate();

  const pkh = useMemo(() => {
    if (!address) return null;

    return `did:pkh:eip155:1:${address}`;
  }, [address]);

  const createDocument = async (did: string, schema: string) => {
    if (!pkh) {
      throw Error("Need pkh");
    }
    try {
      console.log("Creating determinstic TileDocument...");
      const deterministicDocument = await TileDocument.deterministic(ceramic, {
        deterministic: true,
        family: "IDX",
        controllers: [did],
        schema,
      });

      console.log("TileDocument created", deterministicDocument);
      return deterministicDocument;
    } catch (error) {}
  };

  const createIDXTable = async (did: string) => {
    const doc = await createDocument(did, idxTableSchema);
    setIdxTableDocument(doc);
    return doc;
  };

  const createBasicProfile = async (did: string) => {
    const doc = await createDocument(did, basicProfileSchema);
    setBasicProfileDocument(doc);
    return doc;
  };

  const getEthereumAuthProvider = async () => {
    return new EthereumAuthProvider(provider?.provider, address);
  };

  const getDidKey = async (address: string) => {
    const seed = await getSeed(address);

    const didProvider = new Ed25519Provider(seed);
    const did = new DID({
      provider: didProvider,
      resolver: KeyDidResolver.getResolver(),
    });

    await did.authenticate();
    return did;
  };

  const requestCapability = async () => {
    try {
      if (!idxTableDocument || !basicProfileDocument) {
        window.alert("documents hasn't yet been created...");
        return;
      }
      const eap = await getEthereumAuthProvider();
      const didKey = await getDidKey(address);

      const cap = await eap.requestCapability(didKey.id, [
        `${idxTableDocument.id.toUrl()}`,
        `${basicProfileDocument.id.toUrl()}`,
      ]);

      setCapability(address, cap);

      forceUpdate();

      if (!idxTableDocument.content[basicProfileDefinition]) {
        console.log("Link idx table and basic profile");
        await updateDocument(
          idxTableDocument,
          {
            [basicProfileDefinition]: basicProfileDocument.id.toUrl(),
          },
          cap
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateDocument = async (
    document: TileDocument<any>,
    content: object,
    capability: Cacao
  ) => {
    try {
      if (document && capability) {
        console.log("Updating document...");
        const dappKey = await getDidKey(address);
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

        console.log(`Updated document: ${document.id.toUrl()} ...`);
        forceUpdate();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateProfile = async () => {
    if (!basicProfileDocument) {
      throw Error("basicProfileDocument is empty");
    }

    if (!cap) {
      throw Error("capability is empty");
    }

    console.log(cap);

    await updateDocument(
      basicProfileDocument,
      {
        name: name || basicProfileDocument?.content.name,
        // image: {
        //   original: {
        //     src: image || basicProfileDocument?.content.image,
        //     mimeType: "image/png",
        //     width: 500,
        //     height: 200,
        //   },
        // },
      },
      cap
    );
  };

  useEffect(() => {
    getCapability(address).then((data) => {
      setCap(data);
    });
  }, [address]);

  useEffect(() => {
    if (!pkh) return;

    const promises = [createIDXTable(pkh), createBasicProfile(pkh)];

    Promise.all(promises).then((data) => {
      setLoading(false);
    });
  }, [pkh]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <h1>Ceramic Demo</h1>
      {!address ? (
        <div>
          <button onClick={connectWallet}>Connect Wallet</button>
        </div>
      ) : (
        <div>
          <div>Address: {address}</div>
          {loading ? (
            <div>Loading</div>
          ) : (
            <div>
              <div className="flex flex-col space-y-4">
                <div> documents has been created.</div>
                <div>
                  Stream is controlled by <strong>{pkh}</strong>
                </div>
                <div>IDX Table Stream: {idxTableDocument?.id.toUrl()}</div>
                <div className="bg-gray-700 rounded-lg p-4 text-white">
                  IDX Table Content:{" "}
                  {JSON.stringify(idxTableDocument?.content, null, 2)}
                </div>
                <div>
                  Basic Profile Stream: {basicProfileDocument?.id.toUrl()}
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-white">
                  Basic Profile Content:{" "}
                  {JSON.stringify(basicProfileDocument?.content, null, 2)}
                </div>
              </div>
              {!cap ? (
                <div>
                  {!loading && (
                    <button
                      className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white"
                      onClick={requestCapability}
                    >
                      Authorize dApp
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col space-y-4 mt-4">
                  <div>
                    <span>Name: </span>
                    <input
                      type="text"
                      placeholder="bar"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="p-2 rounded-lg"
                    />
                  </div>
                  {/* <div>
                    <span>Avatar: </span>
                    <input
                      type="text"
                      placeholder="bar"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="p-2 rounded-lg"
                    />
                  </div> */}
                  <div className="flex justify-between">
                    <button
                      className="mt-4 px-4 py-2 rounded-lg bg-green-300 hover:bg-green-500"
                      onClick={updateProfile}
                    >
                      Update profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
