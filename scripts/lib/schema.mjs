import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readData } from "./io.mjs";

export function schemaRegistry(root) {
  // Optional lint rules reject valid inherited conditional types and required
  // branches. Schema keywords, formats and the data types remain validated.
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    strictTypes: false,
    strictRequired: false,
  });
  addFormats(ajv);
  const compiled = new Map();
  return {
    compile(path) {
      if (!compiled.has(path))
        compiled.set(path, ajv.compile(readData(root, path)));
      return compiled.get(path);
    },
    validate(data, path, label = path) {
      const check = this.compile(path);
      if (!check(data))
        throw new Error(
          `${label}: ${ajv.errorsText(check.errors, { separator: "; " })}`,
        );
    },
  };
}
