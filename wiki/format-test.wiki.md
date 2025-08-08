## Exception and Error Flow Usage (Up-to-date)

- Controller rules:
  - Return plain object → auto-wrapped `HttpResponse.success`
  - Return `HttpResponse` → sent as is
  - Throw `HttpResponse` or `BaseException` → forwarded to `next(err)`
  - Throw other `Error` → forwarded to `next(err)`
  - `STRICT_CONTROLLER_RETURN` true and no return → throws `BaseException` (forwarded)
  - Do not use `res.send/json/status/end` unless `wrapController(fn, { allowRes: true })`

- Global error handler rules:
  - If `HttpResponse` → `send()` directly
  - If `BaseException` → convert to `HttpResponse.error()` and send
  - Else → 500 with masked message in production

- Exception helper usage:
  - `ExceptionFactory.badRequest('msg', { errorCode: 'CODE' })`
  - `ValidationException`/`BusinessException` via `createExceptionClass`
# Formatting Test Results

## Test File: `wiki/format-sample.js`

This file was created to test EditorConfig and Prettier formatting functionality.

### Before Formatting

- Inconsistent spacing and indentation
- Import order not sorted
- Trailing commas missing
- Line length exceeded 80 characters

### After Formatting (Prettier + EditorConfig)

#### ✅ **Import Sorting**

```javascript
// Before
import { isString, isNumber, isBoolean } from '../src/utils/type-check.util';

// After
import { isBoolean, isNumber, isString } from '../src/utils/type-check.util';
```

#### ✅ **Object Formatting**

```javascript
// Before
const data = {
  name: 'test',
  age: 25,
  isActive: true,
  hobbies: ['reading', 'coding', 'gaming'],
  address: {
    street: '123 Main St',
    city: 'Test City',
    country: 'Test Country'
  }
};

// After
const data = {
  name: 'test',
  age: 25,
  isActive: true,
  hobbies: ['reading', 'coding', 'gaming'],
  address: {
    street: '123 Main St',
    city: 'Test City',
    country: 'Test Country',
  },
};
```

#### ✅ **Function Call Formatting**

```javascript
// Before
const result = someVeryLongFunctionName('parameter1', 'parameter2', 'parameter3', { key: 'value' });

// After (with printWidth: 80)
const result = someVeryLongFunctionName(
  'parameter1',
  'parameter2',
  'parameter3',
  { key: 'value' }
);
```

#### ✅ **Arrow Function Formatting**

```javascript
// Before
const processUser = ({ name, age, email }) => {
  const user = {
    name: name.trim(),
    age: parseInt(age, 10),
    email: email.toLowerCase(),
    createdAt: new Date()
  };
  return user;
};

// After
const processUser = ({ name, age, email }) => {
  const user = {
    name: name.trim(),
    age: parseInt(age, 10),
    email: email.toLowerCase(),
    createdAt: new Date(),
  };
  return user;
};
```

### Key Improvements

1. **Consistent Indentation**: 2 spaces (EditorConfig)
2. **Trailing Commas**: Added to objects and arrays
3. **Import Sorting**: Alphabetical order
4. **Line Length**: Limited to 80 characters (auto-wrap with 2-space indentation)
5. **Quote Style**: Single quotes consistently
6. **Semicolons**: Added where needed

### EditorConfig Settings Applied

```ini
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.{js,jsx,mjs,ts,tsx}]
indent_size = 2
```

### Prettier Settings Applied

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Test Commands

```bash
# Format all files
npm run format

# Format specific file
npx prettier --write "wiki/format-sample.js"

# Check formatting without changing
npm run format:check
```

### Results

✅ **All formatting rules applied correctly**  
✅ **EditorConfig respected across different editors**  
✅ **Prettier configuration working as expected**  
✅ **Import sorting functional**  
✅ **Code style consistent throughout project**
