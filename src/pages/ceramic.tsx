import { useWeb3 } from "../context/web3Context";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { useEffect, useMemo, useState } from "react";
import type { Cacao } from "ceramic-cacao";
import { Ed25519Provider } from "key-did-provider-ed25519";
import * as KeyDidResolver from "key-did-resolver";
import { DID } from "dids";
import { EthereumAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";

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
  const [capability, setCapability] = useState<Cacao>();
  const [idxTableDocument, setIdxTableDocument] = useState<TileDocument<any>>();
  const [basicProfileDocument, setBasicProfileDocument] =
    useState<TileDocument<any>>();

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

  const getDappDidKey = async () => {
    // use hard coded seed for example
    const seed = new Uint8Array([
      69, 90, 79, 13, 19, 168, 234, 177, 16, 163, 37, 8, 233, 244, 36, 102, 130,
      190, 102, 10, 239, 51, 191, 199, 40, 13, 2, 63, 94, 119, 183, 225,
    ]);

    const didProvider = new Ed25519Provider(seed);
    const didKey = new DID({
      provider: didProvider,
      resolver: KeyDidResolver.getResolver(),
    });
    await didKey.authenticate();
    // setDappDidKey(didKey.id);
    return didKey;
  };

  const getEthereumAuthProvider = async () => {
    return new EthereumAuthProvider(provider?.provider, address);
  };

  const requestCapability = async () => {
    try {
      if (!idxTableDocument || !basicProfileDocument) {
        window.alert("documents hasn't yet been created...");
        return;
      }
      const eap = await getEthereumAuthProvider();
      const didKey = await getDappDidKey();

      const cap = await eap.requestCapability(didKey.id, [
        `${idxTableDocument.id.toUrl()}`,
        `${basicProfileDocument.id.toUrl()}`,
      ]);

      setCapability(cap);

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
        const dappKey = await getDappDidKey();
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

  const updateName = async () => {
    if (!basicProfileDocument) {
      throw Error("basicProfileDocument is empty");
    }
    if (!capability) {
      throw Error("capability is empty");
    }
    await updateDocument(
      basicProfileDocument,
      {
        name: name,
      },
      capability
    );
  };

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
              {typeof capability === "undefined" ? (
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
                  <input
                    type="text"
                    placeholder="bar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="p-2 rounded-lg"
                  />
                  <div className="flex justify-between">
                    <button
                      className="mt-4 px-4 py-2 rounded-lg bg-green-300 hover:bg-green-500"
                      onClick={updateName}
                    >
                      Update Avatar link in the Document
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
