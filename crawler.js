const axios = require("axios");
const { parse } = require("node-html-parser");
const validUrl = require("valid-url");
const fs = require("fs");

const args = process.argv.slice(2);
if (args.length >= 2 && Number.isInteger(+args[1])) {
  main(args);
} else {
  console.log("Wrong input arguments");
}

async function main(args) {
  const [url, depth] = args;
  const results = await crawlImages(url, 0, depth);
  saveResult(results);
}

async function crawlImages(sourceUrl, currentDepth, maxDepth) {
  const results = [];
  if (currentDepth >= maxDepth) {
    return results;
  }

  console.log(`Processing ${sourceUrl}...`);
  try {
    const { data: page } = await axios.get(sourceUrl);
    const root = parse(page);
    const imgs = extractTagAttribute(root, "img", "src").map((imageUrl) => ({
      imageUrl,
      sourceUrl,
      depth: currentDepth,
    }));
    if (imgs) {
      results.push(...imgs);
    }

    const links = extractTagAttribute(root, "a", "href");
    if (!links) {
      return results;
    }

    for (const link of links) {
      const imgs = await crawlImages(link, currentDepth + 1, maxDepth);
      results.push(...imgs);
    }
  } catch (error) {
    console.log("Error:", error.message);
  } finally {
    return results;
  }
}

function extractTagAttribute(rootTag, tag, attribure) {
  return rootTag
    .querySelectorAll(tag)
    ?.map((element) => element.getAttribute(attribure))
    ?.filter(validUrl.isWebUri);
}

function saveResult(results) {
  fs.writeFileSync("results.json", JSON.stringify({ results }));
}
