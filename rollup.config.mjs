import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/tasker-simple-card.js',
  // Mark these packages as external so they aren’t re-bundled
  external: [
    '@material/mwc-icon',
    '@material/mwc-button',
    // Add any other Material components you’re using
  ],
  output: {
    file: 'www/tasker-simple-card.js',
    format: 'esm',
    sourcemap: false,
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    terser()
  ]
};
