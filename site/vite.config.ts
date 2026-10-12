import { createReadStream, statSync } from "node:fs";
import path from "node:path";

import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { type Connect, type Plugin, defineConfig } from "vite-plus";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

// Copied into build/ by `vp run stage` after the site builds, so they 404 while prerendering.
const STAGED_FILES =
  /^\/(registry\.json|schema\.json|templates\/[a-z0-9-]+\/(compose\.yaml|\.env\.example))$/;

/** Files `vp run stage` copies into build/, which the dev and preview servers otherwise lack. */
const REPO_FILES =
  /^\/(registry\.json|schema\.json|templates\/[a-z0-9-]+\/(compose\.yaml|\.env\.example|template\.json|README\.md))$/;

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
};

/** Serve the staged repo files during `vp dev` and `vp preview`, matching production. */
function serveRepoFiles(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const pathname = decodeURIComponent((req.url ?? "").split("?")[0] ?? "");
    if (!REPO_FILES.test(pathname)) return next();

    const filePath = path.join(REPO_ROOT, pathname);
    try {
      if (!statSync(filePath).isFile()) return next();
    } catch {
      return next();
    }

    res.setHeader(
      "Content-Type",
      CONTENT_TYPES[path.extname(filePath)] ?? "text/plain; charset=utf-8",
    );
    createReadStream(filePath).pipe(res);
  };

  return {
    name: "arcane-templates:serve-repo-files",
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig({
  plugins: [
    serveRepoFiles(),
    tailwindcss(),
    sveltekit({
      compilerOptions: { runes: true },
      // Pages are prerendered into the repo-level build/ directory, next to the raw template
      // files that `vp run stage` copies in, so /templates/<id>/ serves both.
      adapter: adapter({ pages: "../build", assets: "../build", fallback: "404.html" }),
      prerender: {
        handleHttpError({ path, status, message }) {
          if (status === 404 && STAGED_FILES.test(path)) return;
          throw new Error(message);
        },
      },
    }),
  ],
  server: {
    // The data loaders read templates/ and scripts/ from the repo root.
    fs: { allow: [".."] },
  },
});
