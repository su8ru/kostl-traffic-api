import Body, { Dt } from "types/keioApi";
import { Section, Train } from "types/response";
import { capitalMap, destListKeio, typeList } from "data";
import dayjs from "dayjs";
import arraySupport from "dayjs/plugin/arraySupport";

dayjs.extend(arraySupport);

const parseKeio = (raw: Body): { sections: Section[]; date: string } => {
  const trainMap = new Map<string, Train[]>();
  const result: Section[] = [];
  const date = parseDtToTime(raw.up[0].dt);
  if ("TS" in raw) {
    for (const station of raw.TS) {
      if (station.sn !== "I") {
        for (const train of station.ps) {
          const pos = `${station.id}-${train.bs}`;
          if (!trainMap.has(pos)) trainMap.set(pos, []);
          const inf = parseInfToType(train.inf, +train.sy, !!+train.ki);
          trainMap.get(pos)?.push({
            id: train.tr.trim(),
            type: inf.sy ?? train.sy,
            direction: +train.ki ? "West" : "East",
            delay: +train.dl,
            dest: inf.ik || train.ik_tr,
            length: +train.sr,
          });
        }
      }
    }
    for (const key of trainMap.keys()) {
      result.push({
        id: key,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        trains: trainMap.get(key)!,
      });
    }
  }
  if ("TB" in raw) {
    for (const station of raw.TB) {
      if (station.sn !== "I" && typeof station !== "undefined") {
        const pos = station.id;
        result.push({
          id: pos,
          trains: station.ps.map((train) => {
            const inf = parseInfToType(train.inf, +train.sy, !!+train.ki);
            return {
              id: train.tr.trim(),
              type: inf.sy ?? train.sy,
              direction: +train.ki ? "West" : "East",
              delay: +train.dl,
              dest: inf.ik || train.ik_tr,
              length: +train.sr,
            };
          }),
        });
      }
    }
  }
  return { sections: result, date };
};

const parseInfToType = (
  raw: string,
  sy: number,
  ki: boolean
): { sy: string | null; ik: string | null } => {
  if (raw !== "") {
    const removeRegExp = /この列車は|駅で|\s|行となります。/;
    const arr = raw.split(removeRegExp);
    if (arr.length === 5) {
      const data = {
        chgSta: arr[1],
        destSta: arr[3],
        newType: arr[2],
      } as { chgSta: string; destSta: string; newType: string | null };
      for (const [key, value] of capitalMap) {
        if (value === data.chgSta) data.chgSta = key;
        if (value === data.destSta) data.destSta = key;
      }
      data.newType =
        Object.keys(typeList).find((key) => typeList[+key] === data.newType) ||
        "";
      if (!ki && data.newType !== "")
        [data.newType, sy] = [`${sy}`, +data.newType];
      return {
        ik:
          Object.keys(destListKeio).find(
            // eslint-disable-next-line no-irregular-whitespace
            (key) => destListKeio[key] === `${data.chgSta}　${data.destSta}`
          ) || null,
        sy: data.newType ? `${sy}${data.newType}` : null,
      };
    }
  }
  return { sy: null, ik: null };
};

const parseDtToTime = (dt: Dt[]): string => {
  if (dt.length) {
    const _dt: Dt = dt[0];
    const m = dayjs([+_dt.yy, +_dt.mt - 1, +_dt.dy, +_dt.hh, +_dt.mm, +_dt.ss]);
    return m.format("YYYY.MM.DD HH:mm:ss");
  }
  return dayjs().format("YYYY.MM.DD HH:mm:ss");
};

export default parseKeio;
