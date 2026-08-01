const R = "https://vvwmxfizekmbpkmciyuw.supabase.co/storage/v1/object/public/rules";

// Each game ID maps to { name, pdf } or an array of { name, pdf }
export const rulesMap = {
  // === CATAN ===
  "catan-base":       { name: "Catan — Juego base",             pdf: `${R}/catan-the-game.pdf` },
  "catan-amp":        { name: "Catan — Ampliación 5-6",         pdf: `${R}/catan-ampliacion.pdf` },
  "catan-pescadores": { name: "Catan — Mercaderes y Bárbaros",  pdf: `${R}/catan-mercaderes-barbaros.pdf` },
  "catan-cartas":     { name: "Catan — Mercaderes y Bárbaros",  pdf: `${R}/catan-mercaderes-barbaros.pdf` },
  "catan-amigos":     { name: "Catan — Catan Plus",             pdf: `${R}/catan-plus.pdf` },
  "catan-ayudantes":  { name: "Catan — Catan Plus",             pdf: `${R}/catan-plus.pdf` },
  // === KING OF TOKYO ===
  "king-tokyo":       { name: "King of Tokyo — Reglas",         pdf: `${R}/KOT-king-kong.pdf` },
  "king-tokyo-pu":    { name: "King of Tokyo — Power Up!",      pdf: `${R}/KOT-power-up.pdf` },
  // === TICKET TO RIDE ===
  "t2r-usa":          { name: "Ticket to Ride — USA",           pdf: `${R}/T2R-Rules-ES-2019.pdf` },
  "t2r-france":       { name: "Ticket to Ride — France",        pdf: `${R}/T2R-Rules-France-ES-2019.pdf` },
  "t2r-oldwest":      { name: "Ticket to Ride — Old West",      pdf: `${R}/T2R-OldWest-ES-2019.pdf` },
  // === WINGSPAN ===
  "wingspan-base": [
    { name: "Wingspan — Reglas",    pdf: `${R}/441510024-WS-rules-r17.pdf` },
    { name: "Wingspan — Automa",    pdf: `${R}/458458544-WS-AutomaRules-r5.pdf` },
    { name: "Wingspan — Apéndice", pdf: `${R}/662514300-WS-Appendix-r17.pdf` },
  ],
  // === WYRMSPAN ===
  "wyrmspan":           { name: "Wyrmspan — Reglas",                pdf: `${R}/Wyr_Rulebook_eng_compressed.pdf` },
  // === 7 WONDERS ===
  "7w-base": [
    { name: "7 Wonders — Reglamento",    pdf: `${R}/7-Wonders-Base-Reglamento.pdf` },
    { name: "7 Wonders — Cadenas",        pdf: `${R}/7-Wonders-Base-Chains.pdf` },
    { name: "7 Wonders — Efectos",        pdf: `${R}/7-Wonders-Base-Description-of-Effects.pdf` },
  ],
  "7w-cities": [
    { name: "7 Wonders Cities — Reglas",   pdf: `${R}/932445654-7-Wonders-Cities-Expansion-Rulebook.pdf` },
    { name: "7 Wonders Cities — Efectos",  pdf: `${R}/932445651-7-Wonders-Cities-Expansion-Description-of-Effects.pdf` },
  ],
  "7w-leaders": [
    { name: "7 Wonders Leaders — Reglas",  pdf: `${R}/932445995-7-Wonders-Leaders-Expansion-Rules.pdf` },
    { name: "7 Wonders Leaders — Efectos", pdf: `${R}/932445995-7-Wonders-Leaders-Expansion-Description-of-Effects.pdf` },
  ],
  // === ROOT ===
  "root":                      { name: "Root — The Law of Root",              pdf: `${R}/Root-Base-Law.pdf` },
  "root-the-riverfolk-expansion": { name: "Root: Riverfolk — Learning to Play", pdf: `${R}/Root-Riverfolk-Learn-to-Play.pdf` },
  // === COMMAND OF NATURE ===
  "con-base":          { name: "Command of Nature — Rules",         pdf: `${R}/Command-of-Nature-Rules-base.pdf` },
  // === OTROS ===
  "exploding-kittens-party": { name: "Exploding Kittens Party Pack — Reglas", pdf: `${R}/exploding-kittes-party-pack-rules.pdf` },
  "polilla":                 { name: "Polilla Tramposa — Reglas",             pdf: `${R}/rules-polilla-tramposa.pdf` },
  "virus":                   { name: "Virus — Reglas",                        pdf: `${R}/Virus-Rules.pdf` },
};
