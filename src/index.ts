import { Plugin, normalizePath, DocsetEntries } from "docset-tools-types";
import { writeFileSync } from "fs-extra";
import { join } from "path";

function normalizePart(value: string) {
  return (
    value.substr(0, 1).toUpperCase() + value.substring(1).toLowerCase()
  ).replace(/[\{\}\?]/g, "");
}

const plugin: Plugin = {
  execute: async function ({ createTmpFolder, include, pluginOptions }) {
    pluginOptions = pluginOptions || {};
    const json: any =
      typeof pluginOptions.json === "string"
        ? require(normalizePath(pluginOptions.json))
        : (pluginOptions.json as any);

    const rtn: DocsetEntries = {
      Entry: {},
      index: "rapidoc/index.html",
    };

    if (!json.paths) {
      throw new Error('Invalid swager JSON; no "paths" attribute');
    }

    const tempDir = await createTmpFolder();
    Object.entries(json.paths).forEach(([path, data]) => {
      Object.entries(data).forEach(([method, data]) => {
        const _data = data as any;
        if (!_data.summary && !data.description && !data.operationId) {
          // it's not valid... possibly a `parameters` attributes
          return;
        }
        method = method || "GET";
        const url = `rapidoc/index.html#${method.toLowerCase()}-${path}`;
        const tag = _data.tags && _data.tags[0];
        const name = tag
          ? `${tag}: [${method.toUpperCase()}] ${path}`
          : `[${method.toUpperCase()}] ${path}`;

        rtn.Service[name] = url;
      });
    });

    writeFileSync(join(tempDir, "swagger.json"), JSON.stringify(json), {
      encoding: "utf8",
    });
    writeFileSync(
      join(tempDir, "index.html"),
      `
    <!doctype html> <!-- Important: must specify -->
    <html>
    <head>
      <meta charset="utf-8"> <!-- Important: rapi-doc uses utf8 charecters -->
      <script type="module" src="./rapidoc-min.js?uid=${Date.now()}"></script>
    </head>
    <body>
    </body>
    </html>
    <script>
      const el = document.createElement('rapi-doc');
      const url = window.location.href.replace(/#.*/, '').replace(/[^\/]*$/, "");
      el.setAttribute('spec-url', url + "swagger.json?uid=${Date.now()}");
      el.setAttribute('show-header', false);
      document.body.appendChild(el);
    </script>
    `,
      {
        encoding: "utf8",
      }
    );

    await include({
      path: join(__dirname, "../assets"),
      rootDirName: "rapidoc",
    });
    await include({
      path: tempDir,
      rootDirName: "rapidoc",
    });

    return {
      entries: rtn,
    };
  },
};
export default plugin;
