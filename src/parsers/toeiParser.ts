import { Section, Train } from "types/response";
import OdptTrain, { OdptDirection } from "types/toeiApi";
import { destListToei } from "data";
import dayjs from "dayjs";
import minMax from "dayjs/plugin/minMax";

dayjs.extend(minMax);

const toeiParser = (
  raw: OdptTrain[]
): { sections: Section[]; date: string } => {
  const trainMap = new Map<string, Train[]>();
  const result: Section[] = [];
  let date = dayjs();
  for (const train of raw) {
    // Record Date and Time
    date = dayjs.max(date, dayjs(train["dc:date"]));
    // Generate Position Keys
    const pos =
      (train["odpt:railDirection"] === OdptDirection.E ? "E" : "W") +
      (toeiStations.indexOf(train["odpt:fromStation"]!.split(".").pop()!) + 1) +
      (train["odpt:toStation"]
        ? "-" +
          (toeiStations.indexOf(train["odpt:toStation"].split(".").pop()!) + 1)
        : "");
    // Push to Object
    if (!trainMap.has(pos)) trainMap.set(pos, []);
    trainMap.get(pos)!.push({
      id: train["odpt:trainNumber"],
      type: train["odpt:trainType"]!.split(".").pop()! === "Local" ? "6" : "2",
      direction:
        train["odpt:railDirection"] === OdptDirection.W ? "West" : "East",
      delay: train["odpt:delay"]!,
      dest: destListToei[
        train["odpt:destinationStation"]![0].split(".").pop()!
      ],
      length: null,
    });
  }
  // Convert to Array
  for (const key of trainMap.keys()) {
    result.push({
      id: key,
      trains: trainMap.get(key)!,
    });
  }

  return { sections: result, date: date.format("YYYY.MM.DD HH:mm:ss") };
};

const toeiStations: ReadonlyArray<string> = [
  "Shinjuku",
  "ShinjukuSanchome",
  "Akebonobashi",
  "Ichigaya",
  "Kudanshita",
  "Jimbocho",
  "Ogawamachi",
  "Iwamotocho",
  "BakuroYokoyama",
  "Hamacho",
  "Morishita",
  "Kikukawa",
  "Sumiyoshi",
  "NishiOjima",
  "Ojima",
  "HigashiOjima",
  "Funabori",
  "Ichinoe",
  "Mizue",
  "Shinozaki",
  "Motoyawata",
] as const;

export default toeiParser;
