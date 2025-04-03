import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/tasker-simple-card.js',
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
      terser(),
    ]
  },
  {
    input: 'src/tasker-new-task-card.js',
    output: {
      file: 'www/tasker-new-task-card.js',
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      terser(),
    ]
  }
];
