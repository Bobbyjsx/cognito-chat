import mermaid from "mermaid";
import { JSDOM } from "jsdom";

const dom = new JSDOM();
global.document = dom.window.document;
global.window = dom.window;

async function test() {
  try {
    const valid = await mermaid.parse("invalid syntax here", {
      suppressErrors: true,
    });
    console.log("parse result:", valid);
  } catch (e) {
    console.log("parse threw:", e.message);
  }
}
test();
