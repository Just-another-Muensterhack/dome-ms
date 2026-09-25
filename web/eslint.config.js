import config from '@helpwave/eslint-config'

export default [
  {
    ignores: [
      'next-env.d.ts',
      'build/*',
      'i18n/translations.ts',
    ],
  },
  {
    rules: {
      indent: ['warn', 2],
    },
  },
  ...config.nextExtension,
]
