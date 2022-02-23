import { Hono } from "hono";
import cacheHandler from "./cacheHandler";

const app = new Hono();

app.get("/", (c) => c.json({ message: "Hello, world!" }));
app.get("/keio", (c) =>
  cacheHandler(c, "keio", "https://i.opentidkeio.jp/data/traffic_info.json")
);
app.get("/toei", async (c) =>
  cacheHandler(
    c,
    "toei",
    `https://api.odpt.org/api/v4/odpt%3ATrain?odpt:railway=odpt.Railway:Toei.Shinjuku&acl:consumerKey=${ODPT_TOKEN}`
  )
);

app.fire();
