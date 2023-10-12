export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
      'subject-case': [
        2,
        'always',
        [
          'sentence-case',
          'start-case',
          'pascal-case',
          'upper-case'
        ]
      ],
      'type-case': [0],
      'type-enum': [
        2,
        'always',
        [
          'Breaking',
          'Build',
          'Bump',
          'Chore',
          'CI',
          'Deploy',
          'Deps',
          'Docs',
          'Fix',
          'Hotfix',
          'New',
          'Perf',
          'Refactor',
          'Revert',
          'Style',
          'Test',
          'Update',
          'WIP'
        ]
      ]
    }
  }
  