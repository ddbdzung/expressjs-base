/**
 * Enhanced standard-version configuration following current best practices.
 *
 * This configuration prioritizes:
 * 1. User-facing changes in the changelog
 * 2. Clear visual hierarchy with meaningful emojis
 * 3. Logical grouping that matches how teams actually work
 * 4. Semantic versioning alignment with conventional commits
 */

const BUMP_PRIORITY = { MAJOR: 0, MINOR: 1, PATCH: 2 };

/** @type {import('standard-version').Options} */
module.exports = {
  releaseCommitMessageFormat: 'chore(release): v{{currentTag}}',
  tagPrefix: 'v',
  bumpFiles: ['package.json'],

  // Reorganized types following modern best practices
  types: [
    // === USER-FACING CHANGES (Always visible) ===
    {
      type: 'feat',
      section: '✨ Features',
      bump: BUMP_PRIORITY.MINOR,
    },
    {
      type: 'fix',
      section: '🐛 Bug Fixes',
    },
    {
      type: 'perf',
      section: '⚡ Performance Improvements',
    },
    {
      type: 'security',
      section: '🔒 Security Updates',
      // Security fixes should be visible and often warrant patch releases
    },

    // === INFRASTRUCTURE & MAINTENANCE (Visible but lower priority) ===
    {
      type: 'build',
      section: '📦 Build System & Dependencies',
      bump: BUMP_PRIORITY.MINOR, // Build changes can affect users
    },
    {
      type: 'deps',
      section: '📦 Build System & Dependencies',
      // Dependency updates - often grouped with build changes
    },
    {
      type: 'refactor',
      section: '♻️ Code Refactoring',
      // Code improvements without functionality changes
    },

    // === DOCUMENTATION & DEVELOPER EXPERIENCE ===
    {
      type: 'docs',
      section: '📝 Documentation',
      // Documentation improvements - valuable for users
    },

    // === HIDDEN TYPES (Internal changes) ===
    {
      type: 'style',
      section: '💄 Code Style',
      hidden: true,
      // Code formatting, linting fixes - not user-facing
    },
    {
      type: 'test',
      section: '🧪 Testing',
      hidden: true,
      // Test additions/improvements - internal quality
    },
    {
      type: 'ci',
      section: '👷 CI/CD',
      hidden: true,
      // CI/CD pipeline changes - internal automation
    },
    {
      type: 'chore',
      section: '🔧 Maintenance',
      hidden: true,
      // General maintenance tasks - internal housekeeping
    },

    // === SPECIAL CASES ===
    {
      type: 'revert',
      section: '⏪ Reverts',
      // Reverts are always important to show
    },
    {
      type: 'breaking',
      section: '💥 Breaking Changes',
      bump: BUMP_PRIORITY.MAJOR,
      // Explicit breaking change type (alternative to BREAKING CHANGE footer)
    },
  ],

  /**
   * Enhanced version bump logic with better reasoning.
   *
   * The logic now provides more detailed reasons for version bumps,
   * making it easier to understand why a particular version was chosen.
   */
  whatBump: commits => {
    let level = 2; // Default to PATCH
    let reason = 'patch-level changes';
    const significantChanges = [];

    for (const commit of commits) {
      // Check for breaking changes (highest priority)
      const hasBreakingNote = commit.notes.some(
        n => n.title === 'BREAKING CHANGE'
      );
      const headerHasBang = /!:/.test(commit.header || '');
      const isBreakingType = commit.type === 'breaking';

      if (hasBreakingNote || headerHasBang || isBreakingType) {
        // Early return for breaking changes - no need to process further commits
        return {
          level: 0,
          reason:
            'breaking changes detected' +
            (commit.subject ? ` (${commit.subject})` : ''),
        };
      }

      // Evaluate commit type for bump level
      const typeCfg = (module.exports.types || []).find(
        t => t.type === commit.type
      );
      if (typeCfg && typeCfg.bump !== undefined) {
        const newLevel = typeCfg.bump;
        if (newLevel < level) {
          level = newLevel;
          significantChanges.push(commit.type);
        }
      }
    }

    // Generate more descriptive reasons based on what we found
    if (level === 1) {
      const changeTypes = [...new Set(significantChanges)].join(', ');
      reason = `minor-level changes (${changeTypes})`;
    } else if (significantChanges.length > 0) {
      reason = `patch-level changes with ${significantChanges.length} commits`;
    }

    return { level, reason };
  },

  // Enhanced commit URL formatting for better traceability
  commitUrlFormat: '{{host}}/{{owner}}/{{repository}}/commit/{{hash}}',
  compareUrlFormat:
    '{{host}}/{{owner}}/{{repository}}/compare/{{previousTag}}...{{currentTag}}',

  // Skip commits that shouldn't trigger releases
  skip: {
    commit: true, // Skip if no commits
    tag: false, // Always create tags
  },
};
