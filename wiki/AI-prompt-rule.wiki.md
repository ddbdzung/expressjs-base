## 🧠 Prompt Writing Rules for AI (Dev Workspace Standard)

> Use this guideline whenever prompting Cursor AI, ChatGPT, or any coding assistant. Optimize clarity, context, and correctness.

---

### ✅ 1. **Clarify Context First**

> Always describe:

- What you’re building (e.g., backend with NestJS, React UI, MongoDB)
- Where this code lives (e.g., controller, service, test file)
- Why you’re asking for help

📌 _Example:_

```md
I’m working on a backend using NestJS + MongoDB. Here’s a schema. I need to validate email format in `pre('save')`.
```

---

### ✅ 2. **Be Explicit About Expectations**

> Tell AI what output format you expect:

- Code only?
- Short explanation?
- Bullet list?
- Pro/Con comparison?

📌 _Example:_

```md
Give me 3 alternatives, with pros/cons, and a final recommendation.
```

---

### ✅ 3. **Use a Structured Prompt Template**

```md
# Task:

<what you want AI to do>

# Context:

<stack, file, relevant background>

# Code:

<your code snippet, if any>

# Requirements:

<clear things AI must follow>

# Output:

<code | list | explanation | JSON | etc.>
```

📌 _This template is reusable across the team._

---

### ✅ 4. **Narrow the Scope**

> Ask only one specific thing per prompt.
> Avoid combined requests like:
> ❌ “Fix this, explain it, add test, compare it with another approach.”

📌 _Split into separate prompts instead._

---

### ✅ 5. **Avoid Vague Verbs**

> Don’t say:

- “Improve”
- “Optimize”
- “Make it better”

✅ Instead, say:

- “Reduce complexity”
- “Remove nested loops”
- “Improve readability with early return”

---

### ✅ 6. **Always Ask for Justification**

> Ask AI to explain:

- Why this approach is better
- What the tradeoffs are
- When it might fail

📌 _Example:_

```md
Suggest a debounce hook in React and explain performance implication.
```

---

### ✅ 7. **Ask for Tests**

> For anything logic-heavy or critical:

- Ask for 2–3 test cases
- Prefer real test framework syntax (Jest, Vitest, etc.)

📌 _Example:_

```md
Add 3 unit tests (valid, invalid, edge case).
```

---

### ✅ 8. **Critical Tone Rule**

> - Be direct

- No flattery
- If it’s bad → say it’s bad
- If it’s good → explain why, without overpraise

📌 _Applies to both user and AI._

---

## 🔁 Reusable Prompt Sample

````md
# Task:

Refactor error flow with new `exception.helper` and update tests.

# Context:

This is an Express backend using our `HttpResponse`, `wrapController`, and `globalErrorHandler`.

# Code:

```js
// Controller should throw domain errors using ExceptionFactory
import { ExceptionFactory } from 'src/core/helpers/exception.helper.js';

export async function createUser(req) {
  if (!req.body.email) throw ExceptionFactory.badRequest('Email is required');
  // ...
  return { id: 'u_1' };
}
```
````

# Requirements:

- Use `ExceptionFactory` or custom `ValidationException`
- Do not call `res.send` directly unless `allowRes: true`
- Errors must be forwarded to `globalErrorHandler` via `next(err)`

# Output:

- Final code
- Short explanation
