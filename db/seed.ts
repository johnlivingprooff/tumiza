import { getDb } from "../api/queries/connection";
import { stations } from "./schema";

// 15 Malawi courier stations with real landmark addressing.
// Landmark field follows how Malawians actually give directions —
// relative to a known anchor (market, hospital, petrol station, bank).
const malawiStations = [
  {
    name: "Lilongwe Station",
    district: "Lilongwe",
    town: "City Centre",
    landmark: "Opposite Old Town Market, near Standard Bank",
    physicalAddress: "Paul Kagame Road, Old Town, Lilongwe",
    phone: "+265111234560",
    whatsapp: "+265111234560",
    operatingHours: "Mon–Fri 07:30–17:00, Sat 08:00–13:00",
  },
  {
    name: "Mzuzu Station",
    district: "Mzimba",
    town: "Mzuzu City",
    landmark: "Next to Shoprite Mzuzu, Orton Chirwa Avenue",
    physicalAddress: "Orton Chirwa Avenue, Mzuzu",
    phone: "+265111234561",
    whatsapp: "+265111234561",
    operatingHours: "Mon–Fri 07:30–17:00, Sat 08:00–13:00",
  },
  {
    name: "Blantyre Station",
    district: "Blantyre",
    town: "Central Business District",
    landmark: "Behind Chichiri Shopping Mall, near NICO House",
    physicalAddress: "Haile Selassie Road, Blantyre CBD",
    phone: "+265111234562",
    whatsapp: "+265111234562",
    operatingHours: "Mon–Fri 07:30–17:00, Sat 08:00–13:00",
  },
  {
    name: "Zomba Station",
    district: "Zomba",
    town: "Zomba Town",
    landmark: "Near Zomba Central Hospital roundabout",
    physicalAddress: "Livingstone Avenue, Zomba",
    phone: "+265111234563",
    whatsapp: "+265111234563",
    operatingHours: "Mon–Fri 08:00–16:30, Sat 08:00–12:00",
  },
  {
    name: "Kasungu Station",
    district: "Kasungu",
    town: "Kasungu Boma",
    landmark: "Opposite Kasungu District Hospital main gate",
    physicalAddress: "Kasungu Boma, Kasungu",
    phone: "+265111234564",
    whatsapp: "+265111234564",
    operatingHours: "Mon–Fri 08:00–16:30, Sat 08:00–12:00",
  },
  {
    name: "Mangochi Station",
    district: "Mangochi",
    town: "Mangochi Town",
    landmark: "Next to Mangochi Boma bus depot, near NBS Bank",
    physicalAddress: "Mangochi Town, Mangochi District",
    phone: "+265111234565",
    whatsapp: "+265111234565",
    operatingHours: "Mon–Fri 08:00–16:30, Sat 08:00–12:00",
  },
  {
    name: "Salima Station",
    district: "Salima",
    town: "Salima Boma",
    landmark: "Near Salima Market, opposite Salima police station",
    physicalAddress: "Salima Boma, Salima District",
    phone: "+265111234566",
    whatsapp: "+265111234566",
    operatingHours: "Mon–Fri 08:00–16:30, Sat 08:00–12:00",
  },
  {
    name: "Dedza Station",
    district: "Dedza",
    town: "Dedza Town",
    landmark: "Along M1 Road near Dedza Pottery and Boma offices",
    physicalAddress: "M1 Road, Dedza Town",
    phone: "+265111234567",
    whatsapp: "+265111234567",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
  {
    name: "Ntcheu Station",
    district: "Ntcheu",
    town: "Ntcheu Boma",
    landmark: "Near Ntcheu Boma market, along M1 Road",
    physicalAddress: "Ntcheu Boma, Ntcheu District",
    phone: "+265111234568",
    whatsapp: "+265111234568",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
  {
    name: "Karonga Station",
    district: "Karonga",
    town: "Karonga Town",
    landmark: "Next to Karonga Cultural Museum on the lakeshore road",
    physicalAddress: "Karonga Town, Karonga District",
    phone: "+265111234569",
    whatsapp: "+265111234569",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
  {
    name: "Nkhotakota Station",
    district: "Nkhotakota",
    town: "Nkhotakota Boma",
    landmark: "Opposite Nkhotakota District Hospital along lakeshore M5",
    physicalAddress: "Nkhotakota Boma, Nkhotakota District",
    phone: "+265111234570",
    whatsapp: "+265111234570",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
  {
    name: "Rumphi Station",
    district: "Rumphi",
    town: "Rumphi Boma",
    landmark: "Near Rumphi Boma offices and main market",
    physicalAddress: "Rumphi Boma, Rumphi District",
    phone: "+265111234571",
    whatsapp: "+265111234571",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
  {
    name: "Thyolo Station",
    district: "Thyolo",
    town: "Thyolo Boma",
    landmark: "Along Thyolo–Blantyre road near Thyolo Boma offices",
    physicalAddress: "Thyolo Boma, Thyolo District",
    phone: "+265111234572",
    whatsapp: "+265111234572",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
  {
    name: "Mulanje Station",
    district: "Mulanje",
    town: "Mulanje Boma",
    landmark: "Near Mulanje Mountain Conservation Trust offices, town centre",
    physicalAddress: "Mulanje Boma, Mulanje District",
    phone: "+265111234573",
    whatsapp: "+265111234573",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
  {
    name: "Mchinji Station",
    district: "Mchinji",
    town: "Mchinji Boma",
    landmark: "Near Mchinji Border Post road, opposite Mchinji market",
    physicalAddress: "Mchinji Boma, Mchinji District",
    phone: "+265111234574",
    whatsapp: "+265111234574",
    operatingHours: "Mon–Fri 08:00–16:30",
  },
];

async function seed() {
  const db = getDb();

  console.log("Seeding Malawi stations with landmark addressing...");

  const existing = await db.select({ id: stations.id }).from(stations).limit(1);
  if (existing.length > 0) {
    console.log("Stations already seeded — skipping");
    return;
  }

  for (const station of malawiStations) {
    await db.insert(stations).values(station);
  }

  console.log(`✓ Seeded ${malawiStations.length} stations with landmark data.`);
}

seed().catch(console.error);
