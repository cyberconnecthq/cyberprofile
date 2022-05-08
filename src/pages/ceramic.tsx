import { useWeb3 } from "../context/web3Context";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { useEffect, useMemo, useState } from "react";
import { Ed25519Provider } from "key-did-provider-ed25519";
import * as KeyDidResolver from "key-did-resolver";
import { DID } from "dids";
import { getSeed } from "@/utils/store";
import { ModelManager } from "@glazed/devtools";
// import { CyberProfile, ProfileType } from "../";
import { cyberProfileSchema } from "../utils/const";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";

const CERAMIC_API_URL = "https://ceramic.cyberconnect.dev";
const ceramic = new CeramicClient(CERAMIC_API_URL);
// @ts-ignore
const manager = new ModelManager({ ceramic });

function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}

export default function Ceramic() {
  const { connectWallet, address, provider } = useWeb3();
  const [cyberProfile, setCyberProfile] = useState<any>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [streamID, setStreamID] = useState<string>("");

  // Profile Fields
  const [displayName, setDisplayName] = useState<string>("");
  const [bio, setBio] = useState<string>("");
  // const [type, setType] = useState<ProfileType>("ORGANIZATION");
  const [handle, setHandle] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [backgroundPicture, setBackgroundPicture] = useState<string>("");
  const [sector, setSector] = useState<string>("");
  // const [network, setNetwork] = useState<string[]>([]);
  // const [displayName, setDisplayName] = useState<string>();

  const forceUpdate = useForceUpdate();

  // useEffect(() => {
  //   if (provider?.provider && !cyberProfile) {
  //     const cyberProfile = new CyberProfile(provider);
  //     cyberProfile.initDocument().finally(() => {
  //       const basic = cyberProfile.basicProfileDocument;
  //       const cyber = cyberProfile.cyberProfileDocument;
  //       setDisplayName(basic?.content.displayName || "");
  //       setBio(basic?.content.bio || "");
  //       setType(cyber?.content.type || "ORGANIZATION");
  //       setHandle(cyber?.content.handle || "");
  //       setProfilePicture(cyber?.content.profilePicture || "");
  //       setBackgroundPicture(cyber?.content.backgroundPicture || "");
  //       setSector(cyber?.content.sector || "");

  //       setDataLoading(false);
  //     });
  //     setCyberProfile(cyberProfile);
  //   }
  // }, [provider, cyberProfile]);

  const pkh = useMemo(() => {
    if (!address) return null;

    return `did:pkh:eip155:1:${address}`;
  }, [address]);

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

  const auth = async () => {
    const threeID = new ThreeIdConnect();
    const authProvider = new EthereumAuthProvider(provider?.provider, address);
    await threeID.connect(authProvider);
    const did = new DID({
      // Get the DID provider from the 3ID Connect instance
      provider: threeID.getDidProvider(),
      resolver: {
        ...get3IDResolver(ceramic),
        ...getKeyResolver(),
      },
    });
    await did.authenticate();
    ceramic.did = did;
  };

  const createSchema = async () => {
    const did = await getDidKey(address);
    did.authenticate();
    console.log(did);
    ceramic.setDID(did);
    // await auth();
    const streamID = await manager.createSchema(
      "CyberProfileSchema",
      // @ts-ignore
      cyberProfileSchema
    );

    setStreamID(streamID);
    console.log("create schema: ", streamID);
  };

  const createDefinition = async () => {
    const commitID = manager.model.schemas[streamID].version;
    const did = await getDidKey(address);
    did.authenticate();
    ceramic.setDID(did);
    // await auth();

    const cyberProfileDefinition = {
      name: "Cyber Profile",
      schema: `ceramic://${commitID}`,
      description: "Cyber profile information",
    };

    const res = await manager.createDefinition(
      "CyberProfileDefinition",
      cyberProfileDefinition
    );

    console.log("create definition: ", res);
  };

  const publishSchema = async () => {
    const publishedModel = await manager.deploy();
    console.log("publish: ", publishedModel);
    console.log("publish: ", publishedModel.schemas.toString());
  };

  const testUpdateCyberProfile = async () => {
    if (cyberProfile) {
      setUpdateLoading(true);
      try {
        await cyberProfile.updateProfile({
          displayName,
          bio,
          // type,
          handle,
          profilePicture,
          backgroundPicture,
          sector,
        });
      } catch (e) {
        console.log("Upload Error: ", e);
      } finally {
        setUpdateLoading(false);
      }
    } else {
      console.log("cyberProfile is empty");
    }

    console.log(cyberProfile?.basicProfileDocument?.id.toString());
    console.log(cyberProfile?.cyberProfileDocument?.id.toString());

    forceUpdate();
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 bg-gray-100">
      <h1>Ceramic Demo</h1>
      <div>
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white"
          onClick={createSchema}
        >
          Create Schema
        </button>
      </div>
      <div>
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white"
          onClick={createDefinition}
        >
          Create Definition
        </button>
      </div>
      <div>
        <button
          className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white"
          onClick={publishSchema}
        >
          deploy Schema
        </button>
      </div>
      <div>----------------------------------------------------------</div>
      {!address ? (
        <div>
          <button
            className="mt-4 px-4 py-2 rounded-lg bg-green-300 hover:bg-green-500"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div>
          <div>Address: {address}</div>
          <div>
            {dataLoading ? (
              <div className="flex justify-center items-center">
                <img src="/loading.svg" className="animate-spin w-16" />
              </div>
            ) : (
              <div className="flex flex-col space-y-4 mt-4">
                <div>
                  <span>displayName: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="p-2 rounded-lg"
                  />
                </div>
                <div>
                  <span>bio: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="p-2 rounded-lg"
                  />
                </div>
                {/* <div>
                  <span>type: </span>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProfileType)}
                  >
                    <option value="ORGANIZATION">ORGANIZATION</option>
                    <option value="PERSONAL">PERSONAL</option>
                  </select>
                </div> */}
                <div>
                  <span>handle: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="p-2 rounded-lg"
                  />
                </div>
                <div>
                  <span>profilePicture: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={profilePicture}
                    onChange={(e) => setProfilePicture(e.target.value)}
                    className="p-2 rounded-lg"
                  />
                </div>
                <div>
                  <span>backgroundPicture: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={backgroundPicture}
                    onChange={(e) => setBackgroundPicture(e.target.value)}
                    className="p-2 rounded-lg"
                  />
                </div>
                <div>
                  <span>sector: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="p-2 rounded-lg"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    className="mt-4 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-600 text-white"
                    onClick={testUpdateCyberProfile}
                  >
                    {updateLoading ? (
                      <svg
                        role="status"
                        className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                          fill="currentFill"
                        ></path>
                      </svg>
                    ) : (
                      "Update profile"
                    )}
                  </button>
                </div>
                {
                  <div className="flex flex-col">
                    {cyberProfile?.basicProfileDocument && (
                      <div>
                        Check your basic profile:{" "}
                        <a
                          href={`https://documint.net/${cyberProfile.basicProfileDocument.id.toString()}`}
                          className="underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {cyberProfile.basicProfileDocument.id.toString()}
                        </a>
                      </div>
                    )}
                    {cyberProfile?.cyberProfileDocument && (
                      <div>
                        Check your cyber profile:{" "}
                        <a
                          href={`https://documint.net/${cyberProfile.cyberProfileDocument.id.toString()}`}
                          className="underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {" "}
                          {cyberProfile.cyberProfileDocument.id.toString()}
                        </a>
                      </div>
                    )}
                  </div>
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
