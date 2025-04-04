import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: 'src/tasker-task-list-card.js',
    external: [
      '@material/mwc-formfield',
      '@material/mwc-checkbox',
      '@material/mwc-textfield'
    ],
    output: {
      file: 'www/tasker-task-list-card.js',
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      terser()
    ]
  },
  {
    input: 'src/tasker-new-task-card.js',
    // Mark these as external so they aren’t bundled into your output.
    external: [
      '@material/mwc-formfield',
      '@material/mwc-checkbox',
      '@material/mwc-textfield'
    ],
    output: {
      file: 'www/tasker-new-task-card.js',
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      terser()
    ]
  }
];
