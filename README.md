# har-sunset-audit

Turn a browser or proxy HAR capture into a short inventory of API deprecation and shutdown signals.

```sh
har-sunset-audit traffic.har
har-sunset-audit traffic.har --now 2026-10-01 --json
```

The audit recognizes the standard `Deprecation` response header and `deprecation` link relation from [RFC 9745](https://www.rfc-editor.org/rfc/rfc9745.html), plus `Sunset` and `sunset` links from [RFC 8594](https://www.rfc-editor.org/rfc/rfc8594.html). It also recognizes `successor-version` links, checks date ordering, deduplicates repeated requests, and grades sunsets inside 90 or 30 days. Exit code 1 means an endpoint is already sunset or within 30 days.

Query strings and fragments are removed by default because HAR files often contain tokens or personal data; `--include-query` is explicit. Everything runs locally and response bodies are never inspected.

Security scanners broadly inspect headers, but deprecation notices are operational migration signals rather than vulnerabilities. This utility is deliberately narrow and works on traffic you already captured, making it useful for CI browser runs and dependency migration inventories.

Zero dependencies, Node.js 20+, MIT licensed.
