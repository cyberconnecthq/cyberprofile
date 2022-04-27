import { useWeb3 } from "../context/web3Context";
import { useEffect, useState } from "react";
import { CyberProfile } from "@/utils/cyberProfile";

function useForceUpdate() {
  const [value, setValue] = useState(0); // integer state
  return () => setValue((value) => value + 1); // update the state to force render
}

export default function Ceramic() {
  const { connectWallet, address, provider } = useWeb3();
  const [cyberProfile, setCyberProfile] = useState<CyberProfile>();
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  // Profile Fields
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>();
  const [url, setUrl] = useState<string>();
  const [image, setImage] = useState<string>();

  const forceUpdate = useForceUpdate();

  useEffect(() => {
    if (provider?.provider && !cyberProfile) {
      const cyberProfile = new CyberProfile(provider);
      cyberProfile.getProfile().then((profile) => {
        setName(profile?.name);
        setDescription(profile?.description);
        setUrl(profile?.url);
        setImage(profile?.image.original.src);

        setDataLoading(false);
      });
      setCyberProfile(cyberProfile);
    }
  }, [provider, cyberProfile]);

  const updateProfile = async () => {
    if (cyberProfile) {
      setUpdateLoading(true);
      try {
        await cyberProfile.updateProfile({
          name,
          description,
          url,
          image,
        });
        console.log("Upload successfully");
      } catch (e) {
        console.log("Upload Error: ", e);
      } finally {
        setUpdateLoading(false);
      }
    } else {
      console.log("cyberProfile is empty");
    }

    forceUpdate();
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 bg-gray-100">
      <h1 className="text-3xl mb-4 font-bold">Cyber Profile</h1>
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
                  <span>Name: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={name ?? ""}
                    onChange={(e) => setName(e.target.value)}
                    className="p-2 rounded-lg w-full"
                  />
                </div>
                <div>
                  <span>Description: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={description ?? ""}
                    onChange={(e) => setDescription(e.target.value)}
                    className="p-2 rounded-lg w-full"
                  />
                </div>
                <div>
                  <span>Url: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={url ?? ""}
                    onChange={(e) => setUrl(e.target.value)}
                    className="p-2 rounded-lg w-full"
                  />
                </div>
                <div>
                  <span>Image URL: </span>
                  <input
                    type="text"
                    placeholder="bar"
                    value={image ?? ""}
                    onChange={(e) => setImage(e.target.value)}
                    className="p-2 rounded-lg w-full"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    className="mt-4 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-600 text-white"
                    onClick={updateProfile}
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
                        Check your profile:{" "}
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
