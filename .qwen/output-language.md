# Output language preference: Auto-detect
<!-- qwen-code:llm-output-language: auto -->

## Rule
Respond in the same language as the user's input:
- If the user writes in **English** → respond in English
- If the user writes in **Russian** → respond in Russian
- If the user explicitly requests a different language → use that language

## Keep technical artifacts unchanged
Do **not** translate or rewrite:
- Code blocks, CLI commands, file paths, stack traces, logs, JSON keys, identifiers
- Exact quoted text from the user (keep quotes verbatim)

## Tool / system outputs
Raw tool/system outputs may contain fixed-format English. Preserve them verbatim, and if needed, add a short explanation in the user's language.
