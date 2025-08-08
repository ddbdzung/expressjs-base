const path = require('path');

const buildEslintCommand = (filenames) => {
  const ignoreTrigger = process.env.HUSKY_LINT_STAGED_IGNORE?.toString();
  if (ignoreTrigger === '0') {
    return 'echo "✅ ESLint is disabled via HUSKY_LINT_STAGED_IGNORE"';
  }
  
  // Run ESLint fix on the staged files
  return `npx eslint ${filenames.join(' ')} --fix`;
};

const buildPrettierCommand = (filenames) => {
  const prettierConfig = path.join(__dirname, '.prettierrc');
  const ignoreTrigger = process.env.HUSKY_LINT_STAGED_IGNORE?.toString();
  if (ignoreTrigger === '0') {
    return 'echo "✅ Prettier is disabled via HUSKY_LINT_STAGED_IGNORE"';
  }
  
  // Run Prettier on the staged files
  return `npx prettier --config ${prettierConfig} --write ${filenames.join(' ')}`;
};

const buildJSONPrettierCommand = (filenames) => {
  const prettierConfig = path.join(__dirname, '.prettierrc');
  const ignoreTrigger = process.env.HUSKY_LINT_STAGED_IGNORE?.toString();
  if (ignoreTrigger === '0') {
    return 'echo "✅ Prettier (JSON) is disabled via HUSKY_LINT_STAGED_IGNORE"';
  }
  
  return `npx prettier --config ${prettierConfig} --write ${filenames.join(' ')}`;
};

module.exports = {
  // JavaScript/TypeScript files - run ESLint first, then Prettier
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, buildPrettierCommand],
  
  // JSON files - run Prettier only
  '*.{json,jsonc}': [buildJSONPrettierCommand],
  
  // Markdown files - run Prettier only
  '*.{md,markdown}': [buildJSONPrettierCommand],
  
  // YAML files - run Prettier only
  '*.{yml,yaml}': [buildJSONPrettierCommand],
  
  // CSS/SCSS files - run Prettier only
  '*.{css,scss,sass,less}': [buildJSONPrettierCommand],
  
  // HTML files - run Prettier only
  '*.{html,htm}': [buildJSONPrettierCommand],
  
  // Config files - run Prettier only
  '*.{rc,config}': [buildJSONPrettierCommand],
  
  // Package manager files - run Prettier only
  '{package.json,package-lock.json,pnpm-lock.yaml,yarn.lock}': [buildJSONPrettierCommand],
};
