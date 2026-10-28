import type en from "../en/statistics";
import type { Translation } from "../../types";

const hu: Translation<typeof en> = {
  title: "Statisztika",
  tabs: {
    activity: "Aktivitás",
    walks: "Séták",
  },
  header: {
    updated: "Frissítve: {{time}} · húzd le a frissítéshez",
    source: "Aktivitásod forrása: {{provider}}",
  },
  lastUpdated: {
    justNow: "épp most",
    minutesAgo: "{{minutes}} perce",
    hoursAgo: "{{hours}} órája",
  },
  provider: {
    demo: "Demóadatok",
    unsupported: "Egészségadatok",
  },
  views: {
    day: "Nap",
    week: "Hét",
    month: "Hónap",
  },
  refreshFailed: "Nem sikerült frissíteni. A legutóbbi adataidat látod.",
  loading: "Statisztika betöltése",
  today: {
    title: "Ma",
    stepsLabel: "Ma {{steps}} lépés",
    stepsGoal: "lépés · cél: {{goal}}",
    goalReached: "Napi cél teljesítve 🎉",
    goalPercent: "A napi cél {{percent}}%-a",
  },
  trend: {
    vsYesterday: "a tegnaphoz képest",
    text: "{{change}}% {{label}}",
  },
  metrics: {
    distance: "Táv",
    calories: "Kalória",
  },
  goal: {
    title: "Heti cél",
    progress: "{{done}} / {{goal}} km",
    reached: "Cél teljesítve 🎉",
    streak_one: "🔥 {{count}} hetes sorozat",
    streak_other: "🔥 {{count}} hetes sorozat",
    streakLabel_one: "{{count}} hetes sorozat",
    streakLabel_other: "{{count}} hetes sorozat",
    noStreak: "Sétálj ezen a héten, és elindul a sorozatod",
    summaryLabel: "Heti cél: {{progress}}, {{percent}}%. {{streak}}",
    change: "Cél módosítása",
    inputLabel: "Heti cél (km)",
    invalid: "1 és 200 km közötti célt adj meg",
    saveFailed: "Nem sikerült menteni a célt. Próbáld újra.",
  },
  walkTotals: "WalkIt-séták ezen a héten",
  charts: {
    goal: "Cél",
    hour: "{{hour}}:00",
    dayMonth: "{{month}}. {{day}}.",
    summary: "{{steps}} lépés · {{distance}}",
    day: {
      title: "Ma óránként",
      subtitle: "Eddig {{steps}} lépés",
      empty:
        "Ma még nincs rögzített lépés. Amint elindulsz, itt látod az óránkénti aktivitásodat.",
    },
    week: {
      title: "Az elmúlt 7 nap",
      empty: "Az elmúlt 7 napban nem volt aktivitás. Itt jelennek majd meg a napi lépéseid.",
    },
    month: {
      title: "Az elmúlt 30 nap",
      empty: "Az elmúlt 30 napban nem volt aktivitás. Itt jelennek majd meg a napi lépéseid.",
    },
  },
  insights: {
    average: "Napi átlag",
    averageValue: "{{steps}} lépés",
    bestDay: "Legjobb nap",
    activeDays: "Aktív napok",
    activeDaysValue: "{{active}} / {{total}}",
    streak: "Jelenlegi sorozat",
    streakValue_one: "{{count}} nap",
    streakValue_other: "{{count}} nap",
  },
  empty: {
    title: "Még nincs aktivitás",
    message:
      "Az elmúlt 30 napból nem találtunk lépést, távot vagy kalóriát (forrás: {{provider}}).",
    tip: "Ellenőrizd, hogy a telefonod rögzíti-e az aktivitást, és hogy a WalkIt olvashatja-e (forrás: {{provider}}).",
    refresh: "Frissítés",
  },
  errors: {
    denied: {
      title: "Hozzáférés kell az egészségadatokhoz",
      message:
        "Engedd meg a WalkItnek, hogy olvassa a lépéseidet, a sétatávot és az aktív energiát (forrás: {{provider}}), így megmutathatjuk a statisztikádat.",
      action: "Beállítások megnyitása",
    },
    notInstalled: {
      title: "Ehhez Health Connect kell",
      message:
        "A WalkIt a Health Connecten keresztül olvassa az aktivitásodat. Telepítsd vagy frissítsd a Play Áruházból, aztán gyere vissza, és próbáld újra.",
      action: "Health Connect letöltése",
    },
    unavailable: {
      title: "Nem érhető el: {{provider}}",
      message:
        "Ezen az eszközön vagy az alkalmazás ezen verziójában nem érhetők el egészségadatok. Használd a WalkIt alkalmazást iPhone-on (Apple Health) vagy Androidon (Health Connect).",
    },
    error: {
      title: "Nem sikerült betölteni a statisztikádat",
      message: "Hiba történt az adatok olvasásakor (forrás: {{provider}}). Próbáld újra.",
    },
  },
  calorieMessage: {
    none: "Mozdulj meg! 💪",
    start: "Jó kezdés! 🔥",
    great: "Szép munka! ⚡",
    awesome: "Szuper! 🎉",
    amazing: "Elképesztő! 🚀",
  },
};

export default hu;
