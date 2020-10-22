// @ts-check

const helpBase = "/#/help/";
const vdirBase = "/docs/";

/**
 * @param {string} text - The raw html to fix up
 * @param {string} basePath - The URL to fix the links relative to
 */
function fixLinks(text, basePath) {

  let wrapper = document.createElement("div");
  wrapper.innerHTML = text;
  wrapper.querySelectorAll("A,IMG").forEach(elem => {
    // Note: tagName is always in upper-case.
    if (elem.tagName === "A" && elem.hasAttribute("href")) {
      let href = elem.getAttribute("href");
      elem.setAttribute("href", linkToPath(href, helpBase, vdirBase, basePath));
    }
    if (elem.tagName === "IMG" && elem.hasAttribute("src")) {
      let src = elem.getAttribute("src");
      elem.setAttribute("src", linkToPath(src, helpBase, vdirBase, basePath));
    }
    // Do other links such as video etc. here
  });
  return wrapper.innerHTML;
}

/**
 * Convert a markdown link to a site path
 * @param {string} link - The link in the markdown to convert, e.g. "./foo.md" or "guide/logo.png"
 * @param {string} prefix - The location prefix on the site URLs, e.g. "/help/#/"
 * @param {string} rootPath - The root site url to serve static assets, e.g. "/docs/"
 * @param {string} currentPath - The current pathname + hash, e.g. "/help/#/guide/overview"
 */
function linkToPath(link, prefix, rootPath, currentPath) {
  // Convert relative links for docs and media.
  // Links to other doc pages, e.g. "foo/bar/index.md" should be converted
  // relative to the current path/hash. e.g. If currently at "/docs#/root",
  // it should become "/docs#/root/foo/bar/index" (any leading "./" should be
  // ignored. Parent dirs should be honored, e.g. "../bar/index.md" should become
  // "/docs#/bar/index".
  //
  // Media assets should be converted to a links under a base path, (e.g. "/docs")
  // after the prefix (e.g. "/#/help") is taken into account.
  // For example, if at "/#/help/page1", and image src of "assets/logo.jpg" should
  // become "/docs/assets/logo.jpg". If the current location was "/#/help/guide/foo",
  // would become "/docs/guide/assets/logo.jpg". Again, relative paths should be honored,
  // so "../guide/assets/logo.jpg" would become "/docs/assets/logo.jpg" again.

  // Any full site URLs should not be modified
  if (/^https?:/i.test(link)) return link;

  // Get the current route, e.g. "/help/#/guide/step1"
  // Remove the prefix. If not present, throw an error.
  if (currentPath.substring(0, prefix.length) !== prefix) {
    throw "Current location does not start with the route prefix";
  } else {
    currentPath = currentPath.substring(prefix.length);
  }

  // Record if this is a markdown file. (And remove that extension if so)
  let isMarkdown = /\.md$/i.test(link);
  let linkFixed = isMarkdown ? link.substring(0, link.length - 3) : link;

  // The prefix on the result depends if it's a doc link or an asset link
  let resultPrefix = isMarkdown ? prefix : rootPath;

  // For an absolute path, just append that to the prefix.
  // (Which should already have the trailing slash - if needed)
  if (linkFixed.substring(0, 1) === "/") {
    let newLink = resultPrefix + linkFixed.substring(1);
    return newLink;
  }

  // Remove any current dir prefix ("./")
  if (linkFixed.substring(0,2) === "./") linkFixed = linkFixed.substring(2);

  // Record how many directories to go up if needed (e.g. "../" prefixes)
  let removeParts = 0;
  while (true) {
    if (linkFixed.substring(0, 3) === "../") {
      removeParts += 1;
      linkFixed = linkFixed.substring(3);
    } else {
      break;
    }
  }

  // Remove the final element (page name) + any parent dir steps, and add the link
  let toRemove = removeParts + 1;
  let pathParts = currentPath.split("/");
  if (toRemove > pathParts.length) {
    throw `Error trying to build link to ${link} from ${currentPath}`;
  }
  pathParts.splice(0 - toRemove, toRemove, linkFixed);
  let newLink = resultPrefix + pathParts.join("/");
  return newLink;
}


function onLoad() {
  let landingContent = "";
  if (window.location.hash === "") {
    console.log("Redirecting to help base path");
    // TODO: Handle if the helpBase is not only a hash.
    window.location.hash = helpBase.substring(1);
  }

  const tocEl = document.querySelector("#toc");
  const helpEl = document.querySelector("#contents");

  function renderPage(path) {
    // Convert the path to a .md link
    if (path.substring(0, helpBase.length) !== helpBase) {
      throw "Not on a valid path for help content";
    }
    let toFetch = `${vdirBase}${path.substring(helpBase.length)}.md`;
    console.log(`Fetching page ${toFetch} to render`);

    // Render it into the contents element
    fetch(toFetch)
      .then(doc => doc.text())
      .then(text => {
        let rendered = marked(text);
        let currentPath = window.location.pathname + window.location.hash;
        let fixedContent = fixLinks(rendered, currentPath);
        helpEl.innerHTML = fixedContent;
      });
  }

  window.addEventListener('hashchange', (ev) => {
    console.log(`Hash changed to: ${window.location.hash}`);

    let currentPath = window.location.pathname + window.location.hash;
    if (currentPath === helpBase) {
      console.log("Rendering saved landing content");
      helpEl.innerHTML = landingContent;
      return;
    }
    renderPage(currentPath);
  });

  fetch("/docs/_toc.md")
    .then(doc => doc.text())
    .then(text => {
      console.log("Fetched _toc.md contents");
      let rendered = marked(text);

      // Put all the fixed up content in the main pain
      let fixedContent = fixLinks(rendered, helpBase);
      helpEl.innerHTML = fixedContent;

      // Then extract the first unordered list and move this to the table of contents.
      let tocContent = helpEl.querySelector("ul");
      tocContent.parentElement.removeChild(tocContent);
      tocEl.appendChild(tocContent);

      // Save the landing page content for later use
      landingContent = helpEl.innerHTML;

      // If the initial URL already points to a sub-page, render that.
      let currentPath = window.location.pathname + window.location.hash;
      if (currentPath.indexOf(helpBase) == 0 && currentPath.length > helpBase.length) {
        renderPage(currentPath);
      }
    });
}

document.addEventListener("DOMContentLoaded", onLoad);
