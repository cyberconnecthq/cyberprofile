import { openDB } from "idb";
import type { Cacao } from "ceramic-cacao";

interface CyberProfile {
  seed: Uint8Array;
  capability: Cacao;
}

let dbPromise: any = null;

if (typeof window !== "undefined" && typeof window.indexedDB !== "undefined") {
  dbPromise = openDB("CyberProfile", 1, {
    upgrade(db) {
      db.createObjectStore("store");
    },
  });
}

export async function get(key: string) {
  if (dbPromise) {
    return (await dbPromise).get("store", key);
  }

  return;
}

export async function set(key: string, val: CyberProfile) {
  if (dbPromise) {
    return (await dbPromise).put("store", val, key);
  }

  return;
}

export async function clear() {
  return (await dbPromise).clear("store");
}

export async function clearCyberProfile() {
  await clear();
}

export async function clearByAddress(address: string) {
  return (await dbPromise).delete("store", address);
}

// export async function rotateSigningKey(address: string) {
//   await clear();
//   return generateSigningKey(address);
// }

export async function setCapability(address: string, capability: Cacao) {
  const store = (await get(address)) || {};
  await set(address, { ...store, capability });
}

export async function getCapability(address: string) {
  const store = await get(address);
  return store?.capability;
}

export async function setSeed(address: string, seed: Uint8Array) {
  const store = (await get(address)) || {};
  await set(address, { ...store, seed });
}

export async function getSeed(address: string) {
  if (!address) {
    throw Error("Get Seed: Address is empty");
  }

  const store = await get(address);
  if (!store || !store.seed) {
    const seed = generateSeed();
    setSeed(address, seed);
    return seed;
  }
  return store?.seed;
}

export function generateSeed() {
  var array = new Uint8Array(32);
  return window.crypto.getRandomValues(array);
}
