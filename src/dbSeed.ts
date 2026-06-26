import { doc, setDoc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Product, Sample, SystemSettings } from "./types";

const defaultSettings: SystemSettings = {
  whatsapp: "+55 85 9773-5167",
  email: "contato@apex.com",
  instagram: "https://instagram.com/apex",
  linkAction: "whatsapp"
};

const defaultProducts: Partial<Product>[] = [];

const defaultSamples: Partial<Sample>[] = [];

export async function seedDatabaseIfNeeded() {
  try {
    // 1. Seed Settings
    const settingsDocRef = doc(db, "settings", "global");
    const settingsDoc = await getDoc(settingsDocRef);
    if (!settingsDoc.exists()) {
      await setDoc(settingsDocRef, defaultSettings);
      console.log("Seeded default settings.");
    } else {
      const currentData = settingsDoc.data() as SystemSettings;
      if (
        !currentData.whatsapp ||
        currentData.whatsapp === "+5511999999999" ||
        currentData.whatsapp.includes("11) 99999") ||
        currentData.whatsapp.includes("99999-9999")
      ) {
        await setDoc(settingsDocRef, { ...currentData, whatsapp: "+55 85 9773-5167" });
        console.log("Updated placeholder whatsapp to default: +55 85 9773-5167");
      }
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
