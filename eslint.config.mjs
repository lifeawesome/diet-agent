import coreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...coreWebVitals,
  {
    rules: {
      /** Standard mount-time fetches using useState + useEffect; revisit with Suspense/use() later. */
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files:   ['eslint.config.mjs'],
    rules:   { 'import/no-anonymous-default-export': 'off' },
  },
]

export default config
