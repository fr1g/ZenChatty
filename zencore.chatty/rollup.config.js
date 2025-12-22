import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

const commonPlugins = [
  nodeResolve(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    tslib: 'tslib'
  })
];

const commonExternal = ['axios', '@microsoft/signalr', '@reduxjs/toolkit'];
const config = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: commonPlugins,
    external: commonExternal
  }, {
    input: 'src/models/index.ts',
    output: [
      {
        file: 'dist/models/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: commonPlugins,
    external: commonExternal
  }, {
    input: 'src/api/index.ts',
    output: [
      {
        file: 'dist/api/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: commonPlugins,
    external: ['axios']
  }, {
    input: 'src/signalr-client.ts',
    output: [
      {
        file: 'dist/signalr-client.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: commonPlugins,
    external: ['@microsoft/signalr']
  }, {
    input: 'src/tools/index.ts',
    output: [
      {
        file: 'dist/tools/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: commonPlugins,
    external: commonExternal
  }, {
    input: 'src/actions/index.ts',
    output: [
      {
        file: 'dist/actions/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: commonPlugins,
    external: commonExternal
  }, {
    input: 'src/redux/index.ts',
    output: [
      {
        file: 'dist/redux/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: commonPlugins,
    external: [...commonExternal, '@reduxjs/toolkit']
  },
];

export default config;