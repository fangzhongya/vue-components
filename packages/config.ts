export interface Config {
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

export interface FangConfig extends Config {
    /**
     * 是否去掉路径的前缀
     */
    urlprefix?: boolean;
    /**
     * 是否生成json 配置文件
     */
    isJson?: boolean;
    /**
     * 生成json 配置文件名称
     */
    jsonName?: string;
    /**
     * 格式化的组件的地址
     */
    urls?: Array<string>;
    /**
     * 格式化的指令的地址
     */
    dirUrls?: Array<string>;
}

export const config: Config = {
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
};

/**
 * 合并两个对象的值
 * @param a 合并到的对象
 * @param b 合并对象
 * @param j 合并级别
 * @param i 是否合并数组
 * @returns 合并的对象
 */
export function objectMerge<T>(
    a: T,
    b: T,
    j: number = 1,
    i?: boolean,
): T {
    for (const key in b) {
        const v = a[key];
        const t = b[key];
        if (v) {
            if (v instanceof Array) {
                if (i) {
                    if (t instanceof Array) {
                        v.push(...t);
                    } else {
                        v.push(t);
                    }
                } else {
                    a[key] = t;
                }
            } else if (typeof v == 'object') {
                const cv =
                    Object.prototype.toString.call(v);
                const ct =
                    Object.prototype.toString.call(t);
                if (cv == ct) {
                    const n = j - 1;
                    if (n > 0) {
                        a[key] = objectMerge(v, t, n, i);
                    } else {
                        a[key] = t;
                    }
                } else {
                    a[key] = t;
                }
            } else {
                a[key] = t;
            }
        } else {
            a[key] = t;
        }
    }
    return a;
}
