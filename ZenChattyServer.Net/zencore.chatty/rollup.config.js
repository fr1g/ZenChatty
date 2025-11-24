import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

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
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        tslib: 'tslib'
      })
    ],
    external: ['axios', '@microsoft/signalr']
  },
  {
    input: 'src/models/index.ts',
    output: [
      {
        file: 'dist/models/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        tslib: 'tslib'
      })
    ]
  },
  {
    input: 'src/api/index.ts',
    output: [
      {
        file: 'dist/api/index.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        tslib: 'tslib'
      })
    ],
    external: ['axios']
  },
  {
    input: 'src/signalr-client.ts',
    output: [
      {
        file: 'dist/signalr-client.js',
        format: 'esm',
        sourcemap: true
      }
    ],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationMap: false,
        tslib: 'tslib'
      })
    ],
    external: ['@microsoft/signalr']
  },
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()]
  },
  {
    input: 'dist/models/index.d.ts',
    output: [{ file: 'dist/models/index.d.ts', format: 'esm' }],
    plugins: [dts()]
  },
  {
    input: 'dist/api/index.d.ts',
    output: [{ file: 'dist/api/index.d.ts', format: 'esm' }],
    plugins: [dts()]
  },
  {
    input: 'dist/signalr-client.d.ts',
    output: [{ file: 'dist/signalr-client.d.ts', format: 'esm' }],
    plugins: [dts()]
  }
];

export default config;