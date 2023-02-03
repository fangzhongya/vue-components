import {
    open,
    readdir,
    stat,
    writeFile,
    write,
    readFile,
} from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * 合并两个对象的值
 * @param a 合并到的对象
 * @param b 合并对象
 * @param j 合并级别
 * @param i 是否合并数组
 * @returns 合并的对象
 */
function mergeObject<T>(
    a: T,
    b: T,
    j: number = 0,
    i?: boolean,
): T {
    if (a instanceof Array) {
        if (j > 0 && i) {
            if (b instanceof Array) {
                a.push(...b);
            } else {
                a.push(b);
            }
        } else {
            a = b;
        }
    } else if (typeof a == 'object') {
        const cv = Object.prototype.toString.call(a);
        const ct = Object.prototype.toString.call(b);
        if (
            a &&
            typeof b == 'object' &&
            cv == ct &&
            j > 0
        ) {
            const n = j - 1;
            if (n > 0) {
                for (const key in b) {
                    const v = a[key];
                    const t = b[key];
                    a[key] = mergeObject(v, t, n, i);
                }
            } else {
                for (const key in b) {
                    a[key] = b[key];
                }
            }
        } else {
            a = b;
        }
    } else {
        a = b;
    }
    return a;
}

interface Objunkn {
    [key: string]: any;
}

interface FsReaddir {
    file: Array<string>;
    dirs: Array<string>;
}

interface TsupObj {
    [key: string]: {
        main: string;
        module: string;
        types: string;
    };
}

/******************配置******************** */

const config = {
    dir: './packages/',
    package: './package.json',
    files: 'dist',
    cover: true,
    tsup: {
        module: {
            main: 'cjs.js',
            module: 'js',
            types: 'd.ts',
        },
        default: {
            main: 'js',
            module: 'mjs',
            types: 'd.ts',
        },
    } as TsupObj,
};

const typesVersions = {
    '*': {
        '*': [
            `./${config.files}/*`,
            // "./*"
        ],
    },
};

const filess = [
    config.files,
    '*.d.ts',
    // 'types',
];

const exportsObj: {
    [key: string]:
        | {
              [key: string]: string;
          }
        | string;
} = {
    // "./*": "./*",// 没有理解
};

/******************配置******************** */

let packageObj: Objunkn = {};
const packageUrl = resolve(process.cwd(), config.package);

const dirUrl = resolve(process.cwd(), config.dir);

function getTsupObj() {
    const key = packageObj.type || 'default';
    return config.tsup[key];
}

function setExportsObj(
    url: string,
    name: string = 'index',
) {
    const ust = url.replace(dirUrl, '').replace(/\\/g, '/');
    const tsup = getTsupObj();
    let key = '.' + ust;
    if (name != 'index') {
        key += '/' + name;
    }
    exportsObj[key] = {
        require: `./${config.files + ust}/${name}.${
            tsup.main
        }`,
        import: `./${config.files + ust}/${name}.${
            tsup.module
        }`,
        types: `./${config.files + ust}/${name}.${
            tsup.types
        }`,
    };
}

async function getPackage() {
    const st = await fsReadFile(packageUrl);
    packageObj = JSON.parse(st);
}

function setPackage() {
    const tsup = getTsupObj();
    const jb = config.cover ? 0 : 10;

    packageObj.main = `./${config.files}/index.${tsup.main}`;
    packageObj.module = `./${config.files}/index.${tsup.module}`;
    packageObj.types = `./${config.files}/index.${tsup.types}`;
    let tv = packageObj.typesVersions || {};
    packageObj.typesVersions = mergeObject(
        tv,
        typesVersions,
        jb,
        true,
    );

    let files = packageObj.files || [];

    packageObj.files = mergeObject(files, filess, jb, true);

    let exports = packageObj.exports || {};

    packageObj.exports = mergeObject(
        exports,
        exportsObj,
        jb,
        true,
    );

    fsOpen(packageUrl, JSON.stringify(packageObj, null, 4));
}
/**
 * 读取文件内容
 */
function fsReadFile(url: string): Promise<string> {
    return new Promise((resolve) => {
        readFile(url, 'utf-8', function (err, dataStr) {
            if (err) {
                console.log(err);
            }
            resolve(dataStr);
        });
    });
}

function fsReaddir(filePath: string): Promise<FsReaddir> {
    return new Promise((resolve, reject) => {
        //根据文件路径读取文件，返回文件列表
        readdir(filePath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                const lg = files.length;
                const dirs: Array<string> = [];
                const file: Array<string> = [];
                if (lg) {
                    let i = 0;
                    //遍历读取到的文件列表
                    files.forEach((filename) => {
                        //获取当前文件的绝对路径
                        const filedir = join(
                            filePath,
                            filename,
                        );
                        //根据文件路径获取文件信息，返回一个fs.Stats对象
                        stat(filedir, (err, stats) => {
                            i++;
                            if (err) {
                                console.log(err);
                            } else {
                                const isFile =
                                    stats.isFile(); //是文件
                                const isDir =
                                    stats.isDirectory(); //是文件夹
                                if (isFile) {
                                    file.push(filename);
                                }
                                if (isDir) {
                                    dirs.push(filename);
                                }
                            }
                            if (i >= lg) {
                                resolve({
                                    file,
                                    dirs,
                                });
                            }
                        });
                    });
                } else {
                    resolve({
                        file,
                        dirs,
                    });
                }
            }
        });
    });
}

/**
 * 异步地打开文件。详见 open(2)。 flags 可以是：
 * 以写入模式打开文件。文件会被创建（如果文件不存在）或截断（如果文件存在）。
 * @param {*} path
 * @param {*} json
 * @param {*} callback
 */
function fsOpen(
    path: string,
    json: string,
    callback?: () => void,
) {
    // 检查文件是否存在于当前目录，且是否可写。
    open(path, 'wx', (err, fd) => {
        if (err) {
            if (err.code === 'EEXIST') {
                writeFile(path, json, 'utf-8', (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if (callback) callback();
                    }
                });
            } else {
                console.log(err);
            }
        } else {
            write(fd, json, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    if (callback) callback();
                }
            });
        }
    });
}

async function main() {
    await getPackage();
    setExportsObj('');
    await writes(dirUrl);
    setPackage();
}

function writes(url: string): Promise<boolean> {
    return new Promise(async (resolve) => {
        if (url) {
            const data = await fsReaddir(url);
            await writeIndex(url, data);
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

function writeIndex(
    url: string,
    file: FsReaddir,
): Promise<boolean> {
    return new Promise(async (resolve) => {
        file.file.forEach((name) => {
            const wjmc = name.replace(/\.ts$/, '');
            setExportsObj(url, wjmc);
        });
        if (file.dirs.length > 0) {
            for (let i = 0; i < file.dirs.length; i++) {
                await writes(join(url, file.dirs[i]));
            }
        }
        resolve(true);
    });
}

main();
