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
    const swaggerJson: any =
      typeof pluginOptions.swaggerJson === "string"
        ? require(normalizePath(pluginOptions.swaggerJson))
        : (pluginOptions.swaggerJson as any);
    // console.log("1: ", swaggerJson);

    const rtn: DocsetEntries = {
      Entry: {},
    };

    if (!swaggerJson.paths) {
      throw new Error('Invalid swager JSON; no "paths" attribute');
    }

    const tempDir = await createTmpFolder();
    Object.entries(swaggerJson.paths).forEach(([path, data]) => {
      Object.entries(data).forEach(([method, data]) => {
        const _data = data as any;
        const _path = path as string;
        const tag = _data.tags && _data.tags[0];
        const context = tag ? tag : _path.match(/^\/?[^\/]*/)[1];
        const hashPath =
          "swagger/index.html#/" +
          context +
          "/" +
          (_data.operationId
            ? _data.operationId
            : _path
                .split("/")
                .filter((o) => o)
                .map(normalizePart)
                .join());
        const name = tag ? `${tag}: ${_path}` : _path;
        rtn.Entry[name] = hashPath;
      });
    });

    writeFileSync(join(tempDir, "swagger.json"), JSON.stringify(swaggerJson), {
      encoding: "utf8",
    });

    await include({
      path: join(__dirname, "../assets"),
      rootDirName: "swagger",
    });
    await include({
      path: tempDir,
      rootDirName: "swagger",
    });

    return {
      entries: rtn,
    };
  },
};
export default plugin;
