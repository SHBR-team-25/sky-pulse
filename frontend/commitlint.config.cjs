module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'build',
                'chore',
                'ci',
                'docs',
                'feat',
                'fix',
                'perf',
                'refactor',
                'revert',
                'style',
                'test',
            ],
        ],
        'type-empty': [2, 'never'],

        'scope-case': [2, 'always', 'lower-case'],

        'header-max-length': [2, 'always', 100],

        'subject-full-stop': [2, 'never', '.'],
        'subject-empty': [2, 'never'],
        'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case', 'sentence-case']],

        'body-leading-blank': [2, 'always'],
        'footer-leading-blank': [2, 'always'],
    },
};
