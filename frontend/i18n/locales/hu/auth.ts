import type en from "../en/auth";
import type { Translation } from "../../types";

const hu: Translation<typeof en> = {
  fields: {
    name: "Név",
    email: "E-mail",
    password: "Jelszó",
  },
  allFieldsRequired: "Minden mezőt ki kell tölteni",
  login: {
    title: "Bejelentkezés",
    submit: "Bejelentkezés",
    noAccount: "Még nincs fiókod?",
    register: "Regisztráció",
    failed: "Nem sikerült bejelentkezni",
  },
  register: {
    title: "Fiók létrehozása",
    submit: "Regisztráció",
    haveAccount: "Már van fiókod?",
    login: "Bejelentkezés",
    failed: "Nem sikerült regisztrálni",
  },
  password: {
    tooShort: "A jelszónak legalább {{min}} karakterből kell állnia",
  },
  sessionExpired: "Lejárt a munkameneted. Jelentkezz be újra.",
};

export default hu;
