import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

// 公共插件配置
const commonPlugins = [
  nodeResolve(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
    tslib: 'tslib'
  })
];

// 公共外部依赖
const commonExternal = ['axios', '@microsoft/signalr'];

const config = [
  // 主入口点
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
  },

  // 模型入口点
  {
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
  },

  // API入口点
  {
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
  },

  // SignalR客户端
  {
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
  },

  // 工具入口点（新增）
  {
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
  },

  // // 类型声明文件处理 // fvck... idiot...
  // {
  //   input: 'dist/index.d.ts',
  //   output: [{ file: 'dist/index.d.ts', format: 'esm' }],
  //   plugins: [dts()]
  // },
  // {
  //   input: 'dist/models/index.d.ts',
  //   output: [{ file: 'dist/models/index.d.ts', format: 'esm' }],
  //   plugins: [dts()]
  // },
  // {
  //   input: 'dist/api/index.d.ts',
  //   output: [{ file: 'dist/api/index.d.ts', format: 'esm' }],
  //   plugins: [dts()]
  // },
  // {
  //   input: 'dist/signalr-client.d.ts',
  //   output: [{ file: 'dist/signalr-client.d.ts', format: 'esm' }],
  //   plugins: [dts()]
  // },
  // {
  //   input: 'dist/tools/index.d.ts',
  //   output: [{ file: 'dist/tools/index.d.ts', format: 'esm' }],
  //   plugins: [dts()]
  // }
];

export default config;