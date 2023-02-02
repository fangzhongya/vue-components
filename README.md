# vue-components

是自定义的 unplugin-vue-components 的 插件

支持自定义解析方式

支持多次配置

<pre>
npm i -D <b>@fangzhongya/vue-components</b>
</pre>

### 单个配置

```js
import { ComponentsResolver } from '@fangzhongya/vue-components';

Components({
    resolvers: [ComponentsResolver()],
});
```

### 多配置

```js
Components({
    resolvers: [
        ComponentsResolver({
            alias: 'cs',
            /**
             * 自动导入的文件目录
             */
            dir: './src/cs/',
            matchexts: ['.vue'],
        }),
        ComponentsResolver({
            /**
             * 自动导入的文件目录
             */
            dir: './src/cs2/',
            matchexts: ['.vue'],
        }),
    ],
});
```

### config 默认配置

```js
const config = {
    /**
     * 自动导入的文件目录
     */
    dir: './src/components/',
    /**
     * 文件后缀
     * 如果为空数组，
     */
    extensions: ['vue'],
    /**
     * 自己的别名
     */
    alias: '',
    /**
     * 只支持自己的别名组件，与子别名无关
     */
    onlyAlias: false,
    /**
     * 通过头匹配，默认转换成 - 模式匹配的
     * dir下面子目录来配置别名
     * 不区分首字母大小写
     */
    aliass: {},
    /**
     * 匹配数组
     * '' 表示匹配当前文件名
     */
    matchs: [],
    /**
     * 匹配文件名称和文件类型
     */
    matchexts: ['.vue', '/index.vue'],

    /**
     * 指令文件夹名称
     */
    directives: 'directive',
    /**
     * 是否缓存
     */
    isCache: true,

    /**
     * 过滤 不匹配 通过头匹配，默认转换成 - 模式匹配的
     * 不区分首字母大小写
     */
    startss: [
        // 'router'
    ],
    /**
     * 过滤 不匹配 全匹配 - 模式匹配的
     * 不区分首字母大小写
     */
    filtes: ['router-link', 'router-view'],

    /**
     * 匹配到的文件路径
     * @param {*} url
     *
     */
    getFromName() {
        return 'default';
    },

    /**
     * 获取匹配数组
     */
    getMatch(v, extensions, matchs, matchexts) {
        const urls = [];
        if (matchs) {
            matchs.forEach((key) => {
                const s = '/' + v + key;
                if (extensions) {
                    extensions.forEach((z) => {
                        urls.push(s + '.' + z);
                    });
                } else {
                    urls.push(new RegExp(s + "\.([a-z|A-Z]+?)$"));
                }
            });
        }
        if (matchexts) {
            matchexts.forEach((key) => {
                urls.push('/' + v + key);
            });
        }
        return [...new Set(urls)];
    };
};
```

### config 配置 ts 类型

```ts
interface Config {
    /**
     * 自动导入的文件目录
     */
    dir?: string;
    /**
     * 文件后缀
     * 如果为空数组，
     */
    extensions?: Array<string>;
    /**
     * 自己的别名
     */
    alias?: string;
    /**
     * 只支持自己的别名组件，与子别名无关
     */
    onlyAlias?: boolean;
    /**
     * 通过头匹配，默认转换成 - 模式匹配的
     * dir下面子目录来配置别名
     * 不区分首字母大小写
     */
    aliass?: {
        [key: string]: string;
    };
    /**
     * 匹配数组
     * '' 表示匹配当前文件名
     */
    matchs?: Array<string>;
    /**
     * 匹配文件名称和文件类型
     */
    matchexts?: Array<string>;

    /**
     * 指令文件夹名称
     */
    directives?: string;
    /**
     * 是否缓存
     */
    isCache?: boolean;

    /**
     * 过滤 不匹配 通过头匹配，默认转换成 - 模式匹配的
     * 不区分首字母大小写
     */
    startss?: Array<string>;

    /**
     * 过滤 不匹配 全匹配 - 模式匹配的
     * 不区分首字母大小写
     */
    filtes?: Array<string>;

    /**
     * 匹配到的文件路径
     */
    getFromName?(
        url: string,
        name: string,
        type: string,
    ): string;

    /**
     * 获取匹配数组
     */
    getMatch?(
        name: string,
        extensions?: Array<string>,
        matchs?: Array<string>,
        matchexts?: Array<string>,
    ): Array<string | RegExp>;
}
```
