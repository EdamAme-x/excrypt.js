# excrypt.js

Super easy and secure encryption library.

## Installation and Usage

```bash
npx jsr add @evex/excryptjs
bunx --bun jsr install @evex/excryptjs
deno add @evex/excryptjs
```

```ts
import { encrypt, decrypt } from "@evex/excryptjs";

const message = "Hello, world!"; // or Uint8Array
const password = "secret"; // or Uint8Array

const encrypted = await encrypt(message, password); // eTo3txn8WLNU+Kxib3teP7pdz7az8+P0XbLexjz1xsz/KJOyQouEUPzSVOud.GudWiA3N2yewWcNn5M9X4tzL9QMGqpfC+aN9vK2zT4g=

const decrypted = await decrypt(encrypted, password); // Hello, world!
```
