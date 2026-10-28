import type en from "../en/history";
import type { Translation } from "../../types";

const hu: Translation<typeof en> = {
  walk: {
    defaultName: "Séta",
    groupWalk: "Közös séta",
    loading: "Séta betöltése",
    loadFailed: "Nem sikerült betölteni ezt a sétát",
    distance: "Táv",
    time: "Időtartam",
    pace: "Tempó (perc/km)",
    noPath: "Ennél a sétánál nem rögzült útvonal.",
    map: "A séta térképe",
    start: "Indulás",
    finish: "Befejezés",
  },
  list: {
    thisWeek: "Ezen a héten",
    loading: "Séták betöltése",
    loadFailed: "Nem sikerült betölteni a sétáidat",
    recent: "Legutóbbi séták",
    empty: "Még nincs sétád. Sétálj végig egy útvonalat a Kezdőlapról, és a végén mentsd el.",
    loadMore: "Továbbiak betöltése",
  },
  totals: {
    walks_one: "{{count}} séta",
    walks_other: "{{count}} séta",
  },
  routes: {
    title: "Útvonalaim",
    loading: "Útvonalak betöltése",
    loadFailed: "Nem sikerült betölteni az útvonalaidat",
    empty: "Még nincs mentett útvonalad. Minden útvonal, amit a tervezőben generálsz, ide kerül.",
    favourites: "Kedvencek",
    recent: "Legutóbbiak",
    open: "{{name}} megnyitása",
    walked_one: "Egyszer végigsétáltad",
    walked_other: "{{count}} alkalommal sétáltad végig",
    draftNotice:
      "A generált útvonalak 7 nap után törlődnek, hacsak nem jelölöd kedvencnek, nem nevezed át vagy nem sétálod végig.",
    loadingRoute: "Útvonal betöltése",
    routeLoadFailed: "Nem sikerült betölteni az útvonalat.",
    name: "Útvonal neve",
    walk: "Séta ezen az útvonalon",
    planGroupWalk: "Közös séta tervezése",
    addFavourite: "Hozzáadás a kedvencekhez",
    removeFavourite: "Eltávolítás a kedvencekből",
    rename: "Átnevezés",
    delete: "Útvonal törlése",
    deleteTitle: "Törlöd ezt az útvonalat?",
    deleteMessage: "Törlöd ezt: {{name}}? Az ezen mentett sétáid megmaradnak a korábbi sétáid között.",
    keep: "Megtartás",
  },
};

export default hu;
