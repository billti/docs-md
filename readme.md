# Docs

A simple site to dynamically render Markdown authored pages via the URL hash.

Place authored content in the "./docs" directory. Run the site with `npx http-server`.

## Notes on authoring Markdown

Prefer relative links, e.g. "guide/page.md", not "/guide/page.md". Referencing current or
parent directories via "./foo.md" or "../bar.md" is fine. Relative links work
better for previewing at author time, and simplify configuration at runtime.

Always put the .md extension on links to other markdown documentation files.

Prefer to keep assets such as images and pdf  files in an "./assets" directory beside the
markdown file, e.g. if you were working on "guide/tutorial.md", you would put
"abc.png" in "guide/assets/abc.png", and link to it with "![ABC](assets/abc.png)"
in your markdown.

For help with Markdown syntax, see <https://www.markdownguide.org/basic-syntax>

When authoring in VS Code, you can apply you own style-sheet to markdown previews.
See <https://code.visualstudio.com/Docs/languages/markdown#_using-your-own-css>
