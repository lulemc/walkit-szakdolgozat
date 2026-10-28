import type en from "../en/common";
import type { Translation } from "../../types";

const hu: Translation<typeof en> = {
  languageName: "Magyar",
  actions: {
    cancel: "Mégse",
    save: "Mentés",
    delete: "Törlés",
    close: "Bezárás",
    retry: "Újra",
    ok: "OK",
    back: "Vissza",
    confirm: "Megerősítés",
    edit: "Szerkesztés",
    done: "Kész",
  },
  loadingApp: "A WalkIt betöltése",
  offline: "Nincs internetkapcsolat. Az útvonaltervezéshez és a közösségi funkciókhoz internet kell.",
  tabs: {
    home: "Kezdőlap",
    statistics: "Statisztika",
    social: "Közösség",
    settings: "Beállítások",
  },
  errors: {
    generic: "Hiba történt. Próbáld újra.",
    unreachable: "A WalkIt nem érhető el. Ellenőrizd az internetkapcsolatot, és próbáld újra.",
    timeout: "A WalkIt túl lassan válaszol. Próbáld újra.",
  },
  snackbar: {
    errorTitle: "Hiba",
    errorLabel: "Hiba: {{message}}",
  },
};

export default hu;
