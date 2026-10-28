import type en from "../en/walk";
import type { Translation } from "../../types";

const hu: Translation<typeof en> = {
  map: {
    label: "A sétád térképe: a tervezett útvonal és az eddig megtett út",
    youAreHere: "Itt vagy",
  },
  stats: {
    summaryLabel: "Megtett táv: {{distance}} / {{planned}}, idő: {{time}}, tempó: {{pace}} perc kilométerenként",
    distance: "Táv",
    time: "Idő",
    pace: "Tempó",
    paceUnit: "perc/km",
  },
  share: {
    button: "Megosztás",
    dialogTitle: "Oszd meg a sétádat",
    failed: "Nem sikerült megosztani a sétát. Próbáld újra.",
    unavailable: "Ezen a telefonon nem érhető el a megosztás.",
  },
  summary: {
    title: "Séta teljesítve! 🎉",
    inFavourites: "A kedvenceid között",
    addToFavourites: "Útvonal hozzáadása a kedvencekhez",
    save: "Séta mentése",
    discard: "Elvetés",
  },
  discardDialog: {
    title: "Elveted ezt a sétát?",
    message: "Nem lesz elmentve.",
    keep: "Megtartom",
    discard: "Elvetés",
  },
  endDialog: {
    title: "Befejezed a sétát?",
    message: "A következő képernyőn elmentheted.",
    keepWalking: "Folytatom",
    end: "Befejezés",
  },
  permissionDenied: "A séta követéséhez helymeghatározási engedély kell.",
  trackingFailed: "Nem sikerült elindítani a helyzeted követését.",
  simulatedGps: "🎮 Szimulált GPS (teszt)",
  keepScreenOn: "Hagyd bekapcsolva a képernyőt: zárolva nem követjük a sétát.",
  pause: "Szünet",
  resume: "Folytatás",
  finish: "Séta befejezése",
  notification: {
    title: "Követjük a sétád",
    body: "A WalkIt kikapcsolt képernyőnél is rögzíti az útvonalad.",
  },
  elapsed: {
    minutesSeconds: "{{minutes}} p {{seconds}} mp",
    hoursMinutesSeconds: "{{hours}} ó {{minutes}} p {{seconds}} mp",
  },
};

export default hu;
