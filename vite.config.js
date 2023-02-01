import { defineConfig } from 'vite';
export default defineConfig({
    build: {
        minify: 'esbuild',
        // 打包去掉日志与断点
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        outDir: './dist', //输出文件名称
        lib: {
            entry: './packages/index.ts', //指定组件编译入口文件
            name: 'index',
            fileName: (format) => `index.${format}.js`,
        }, //库编译模式配置
        rollupOptions: {
            // 确保外部化处理那些你不想打包进库的依赖
            external: [],
            output: {
                // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
                globals: {},
            },
        }, // rollup打包配置
    },
});
