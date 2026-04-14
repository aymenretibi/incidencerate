import type { BaseIRTable } from "./types";

/**
 * Base IR table — 42 markets × segments, each with a point estimate and a
 * conservative floor (percentages, 0–100).
 *
 * TODO(USER): replace these placeholder rows with the validated dataset from
 * the prior IR validation work. Shape is fixed — values are not.
 *
 * Segments available: general_population, abc1, abc1c2, abc1c2d,
 * women_18_45, men_25_54, adults_18_34.
 */
export const BASE_IR: BaseIRTable = {
  // --- Americas ---
  Argentina: { general_population: { point: 100, floor: 95 }, abc1: { point: 20, floor: 15 }, abc1c2: { point: 55, floor: 45 }, women_18_45: { point: 27, floor: 22 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 28, floor: 23 } },
  Brazil: { general_population: { point: 100, floor: 95 }, abc1: { point: 22, floor: 18 }, abc1c2: { point: 58, floor: 48 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 30, floor: 25 } },
  Canada: { general_population: { point: 100, floor: 95 }, abc1: { point: 40, floor: 32 }, abc1c2: { point: 68, floor: 58 }, women_18_45: { point: 25, floor: 20 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 26, floor: 22 } },
  Chile: { general_population: { point: 100, floor: 95 }, abc1: { point: 22, floor: 17 }, abc1c2: { point: 52, floor: 42 }, women_18_45: { point: 26, floor: 21 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 28, floor: 23 } },
  Colombia: { general_population: { point: 100, floor: 95 }, abc1: { point: 18, floor: 13 }, abc1c2: { point: 50, floor: 40 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 31, floor: 26 } },
  Mexico: { general_population: { point: 100, floor: 95 }, abc1: { point: 20, floor: 15 }, abc1c2: { point: 52, floor: 42 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 31, floor: 26 } },
  Peru: { general_population: { point: 100, floor: 95 }, abc1: { point: 15, floor: 11 }, abc1c2: { point: 45, floor: 36 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 31, floor: 26 } },
  USA: { general_population: { point: 100, floor: 95 }, abc1: { point: 45, floor: 36 }, abc1c2: { point: 72, floor: 62 }, women_18_45: { point: 25, floor: 20 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 27, floor: 22 } },

  // --- Europe ---
  Austria: { general_population: { point: 100, floor: 95 }, abc1: { point: 42, floor: 34 }, abc1c2: { point: 70, floor: 60 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  Belgium: { general_population: { point: 100, floor: 95 }, abc1: { point: 42, floor: 34 }, abc1c2: { point: 70, floor: 60 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  "Czech Republic": { general_population: { point: 100, floor: 95 }, abc1: { point: 35, floor: 28 }, abc1c2: { point: 66, floor: 56 }, women_18_45: { point: 23, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 23, floor: 19 } },
  Denmark: { general_population: { point: 100, floor: 95 }, abc1: { point: 45, floor: 36 }, abc1c2: { point: 72, floor: 62 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  Finland: { general_population: { point: 100, floor: 95 }, abc1: { point: 44, floor: 36 }, abc1c2: { point: 71, floor: 61 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  France: { general_population: { point: 100, floor: 95 }, abc1: { point: 40, floor: 32 }, abc1c2: { point: 68, floor: 58 }, women_18_45: { point: 23, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 23, floor: 19 } },
  Germany: { general_population: { point: 100, floor: 95 }, abc1: { point: 42, floor: 34 }, abc1c2: { point: 70, floor: 60 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  Greece: { general_population: { point: 100, floor: 95 }, abc1: { point: 30, floor: 23 }, abc1c2: { point: 62, floor: 52 }, women_18_45: { point: 24, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 24, floor: 19 } },
  Hungary: { general_population: { point: 100, floor: 95 }, abc1: { point: 32, floor: 25 }, abc1c2: { point: 64, floor: 54 }, women_18_45: { point: 23, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 24, floor: 19 } },
  Ireland: { general_population: { point: 100, floor: 95 }, abc1: { point: 42, floor: 34 }, abc1c2: { point: 70, floor: 60 }, women_18_45: { point: 24, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 24, floor: 20 } },
  Italy: { general_population: { point: 100, floor: 95 }, abc1: { point: 38, floor: 30 }, abc1c2: { point: 66, floor: 56 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  Netherlands: { general_population: { point: 100, floor: 95 }, abc1: { point: 44, floor: 36 }, abc1c2: { point: 71, floor: 61 }, women_18_45: { point: 23, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 23, floor: 19 } },
  Norway: { general_population: { point: 100, floor: 95 }, abc1: { point: 46, floor: 37 }, abc1c2: { point: 73, floor: 63 }, women_18_45: { point: 23, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 23, floor: 19 } },
  Poland: { general_population: { point: 100, floor: 95 }, abc1: { point: 34, floor: 27 }, abc1c2: { point: 64, floor: 54 }, women_18_45: { point: 24, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 25, floor: 20 } },
  Portugal: { general_population: { point: 100, floor: 95 }, abc1: { point: 34, floor: 27 }, abc1c2: { point: 64, floor: 54 }, women_18_45: { point: 24, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 24, floor: 19 } },
  Romania: { general_population: { point: 100, floor: 95 }, abc1: { point: 28, floor: 22 }, abc1c2: { point: 60, floor: 50 }, women_18_45: { point: 24, floor: 19 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 25, floor: 20 } },
  Spain: { general_population: { point: 100, floor: 95 }, abc1: { point: 36, floor: 29 }, abc1c2: { point: 66, floor: 56 }, women_18_45: { point: 23, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 23, floor: 19 } },
  Sweden: { general_population: { point: 100, floor: 95 }, abc1: { point: 46, floor: 37 }, abc1c2: { point: 73, floor: 63 }, women_18_45: { point: 23, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 23, floor: 19 } },
  Switzerland: { general_population: { point: 100, floor: 95 }, abc1: { point: 48, floor: 39 }, abc1c2: { point: 74, floor: 64 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  Turkey: { general_population: { point: 100, floor: 95 }, abc1: { point: 22, floor: 17 }, abc1c2: { point: 54, floor: 44 }, women_18_45: { point: 27, floor: 22 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 30, floor: 25 } },
  UK: { general_population: { point: 100, floor: 95 }, abc1: { point: 42, floor: 34 }, abc1c2: { point: 70, floor: 60 }, women_18_45: { point: 24, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 24, floor: 19 } },
  Ukraine: { general_population: { point: 100, floor: 95 }, abc1: { point: 22, floor: 17 }, abc1c2: { point: 55, floor: 45 }, women_18_45: { point: 26, floor: 21 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 28, floor: 23 } },

  // --- MEA ---
  Egypt: { general_population: { point: 100, floor: 95 }, abc1: { point: 14, floor: 10 }, abc1c2: { point: 42, floor: 33 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 32, floor: 27 } },
  Morocco: { general_population: { point: 100, floor: 95 }, abc1: { point: 16, floor: 12 }, abc1c2: { point: 44, floor: 35 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 32, floor: 27 } },
  Nigeria: { general_population: { point: 100, floor: 95 }, abc1: { point: 10, floor: 7 }, abc1c2: { point: 32, floor: 25 }, women_18_45: { point: 30, floor: 25 }, men_25_54: { point: 21, floor: 17 }, adults_18_34: { point: 36, floor: 30 } },
  "Saudi Arabia": { general_population: { point: 100, floor: 95 }, abc1: { point: 28, floor: 22 }, abc1c2: { point: 60, floor: 50 }, women_18_45: { point: 26, floor: 21 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 30, floor: 25 } },
  "South Africa": { general_population: { point: 100, floor: 95 }, abc1: { point: 18, floor: 13 }, abc1c2: { point: 45, floor: 36 }, women_18_45: { point: 27, floor: 22 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 30, floor: 25 } },
  UAE: { general_population: { point: 100, floor: 95 }, abc1: { point: 32, floor: 25 }, abc1c2: { point: 62, floor: 52 }, women_18_45: { point: 26, floor: 21 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 28, floor: 23 } },

  // --- APAC ---
  Australia: { general_population: { point: 100, floor: 95 }, abc1: { point: 44, floor: 36 }, abc1c2: { point: 71, floor: 61 }, women_18_45: { point: 24, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 25, floor: 20 } },
  China: { general_population: { point: 100, floor: 95 }, abc1: { point: 24, floor: 18 }, abc1c2: { point: 56, floor: 46 }, women_18_45: { point: 25, floor: 20 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 26, floor: 21 } },
  "Hong Kong": { general_population: { point: 100, floor: 95 }, abc1: { point: 36, floor: 29 }, abc1c2: { point: 66, floor: 56 }, women_18_45: { point: 23, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 23, floor: 19 } },
  India: { general_population: { point: 100, floor: 95 }, abc1: { point: 14, floor: 10 }, abc1c2: { point: 38, floor: 30 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 34, floor: 29 } },
  Indonesia: { general_population: { point: 100, floor: 95 }, abc1: { point: 15, floor: 11 }, abc1c2: { point: 40, floor: 32 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 33, floor: 28 } },
  Japan: { general_population: { point: 100, floor: 95 }, abc1: { point: 42, floor: 34 }, abc1c2: { point: 70, floor: 60 }, women_18_45: { point: 21, floor: 17 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 20, floor: 16 } },
  Malaysia: { general_population: { point: 100, floor: 95 }, abc1: { point: 28, floor: 22 }, abc1c2: { point: 58, floor: 48 }, women_18_45: { point: 26, floor: 21 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 28, floor: 23 } },
  Philippines: { general_population: { point: 100, floor: 95 }, abc1: { point: 14, floor: 10 }, abc1c2: { point: 40, floor: 32 }, women_18_45: { point: 28, floor: 23 }, men_25_54: { point: 22, floor: 18 }, adults_18_34: { point: 33, floor: 28 } },
  Singapore: { general_population: { point: 100, floor: 95 }, abc1: { point: 42, floor: 34 }, abc1c2: { point: 70, floor: 60 }, women_18_45: { point: 23, floor: 19 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 24, floor: 19 } },
  "South Korea": { general_population: { point: 100, floor: 95 }, abc1: { point: 40, floor: 32 }, abc1c2: { point: 68, floor: 58 }, women_18_45: { point: 22, floor: 18 }, men_25_54: { point: 24, floor: 20 }, adults_18_34: { point: 22, floor: 18 } },
  Thailand: { general_population: { point: 100, floor: 95 }, abc1: { point: 22, floor: 17 }, abc1c2: { point: 54, floor: 44 }, women_18_45: { point: 26, floor: 21 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 28, floor: 23 } },
  Vietnam: { general_population: { point: 100, floor: 95 }, abc1: { point: 18, floor: 13 }, abc1c2: { point: 46, floor: 37 }, women_18_45: { point: 27, floor: 22 }, men_25_54: { point: 23, floor: 19 }, adults_18_34: { point: 31, floor: 26 } },
};

export const MARKETS: string[] = Object.keys(BASE_IR).sort();
