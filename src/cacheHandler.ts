import { Context } from "hono";
import parseKeio from "parsers/keioParser";
import parseToei from "parsers/toeiParser";

type CacheValue = { data: unknown; timestamp: number };

const getCache = async (key: string): Promise<CacheValue | null> =>
  CACHES.get<CacheValue>(key, "json");
const putCache = async (key: string, value: CacheValue): Promise<void> =>
  CACHES.put(key, JSON.stringify(value));

const cacheHandler = async (
  c: Context<never>,
  kvKey: "keio" | "toei",
  apiUrl: string,
  ttl = 5
): Promise<Response> => {
  const cache = await getCache(kvKey);
  const reqTime = new Date().getTime();
  if (
    cache &&
    cache.timestamp + ttl * 1000 > reqTime &&
    typeof cache.data === "object"
  ) {
    return c.json({ fromKV: true, ...cache.data });
  } else {
    const res = await fetch(apiUrl);
    const parser = kvKey === "keio" ? parseKeio : parseToei;
    const data = parser(await res.json());
    const timestamp = new Date().getTime();
    await putCache(kvKey, { data, timestamp });
    return c.json({ fromKV: false, ...data });
  }
};

export default cacheHandler;
