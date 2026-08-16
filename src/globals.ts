import { Buffer } from "buffer";

(globalThis as any).Buffer = Buffer;

(globalThis as any).process = {
  env: {
    NODE_ENV: import.meta.env.MODE,
  },
};
