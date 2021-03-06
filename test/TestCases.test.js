/**
 * @file unit test
 * @author simmons8616(simmons0616@gmail.com)
 */

import path from 'path';
import {exec} from 'child_process';
import {promisify} from 'util';

import webpack from 'webpack';
import glob from 'glob';

const execCommand = promisify(exec);

function pathResolve(...subPaths) {
    return path.resolve(__dirname, ...subPaths);
}

function globDirectories(cwd) {
    return new Promise(
        (resolve, reject) => {
            glob(
                '*',
                {cwd},
                function (err, directories) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(directories);
                }
            );
        }
    );
}

function runCompiler(compiler) {
    return new Promise(
        (resolve, reject) => {
            compiler.run(
                (err, stats) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(stats);
                }
            );
        }
    );
}

test('TestCases', async done => {
    const casesDirectories = pathResolve('cases');
    let directories;

    await execCommand('tsc');

    try {
        directories = await globDirectories(casesDirectories);
    }
    catch (e) {
        console.log(e);
    }

    for (const directory of directories) {
        if (!/^(\.|_)/.test(directory)) {
            const directoryForCase = pathResolve(casesDirectories, directory);
            const webpackConf = require(
                pathResolve(directoryForCase, 'webpack.config.js')
            );

            Object.assign(
                webpackConf,
                {
                    context: directoryForCase
                },
                webpackConf
            );

            let stats;

            try {
                stats = await runCompiler(webpack(webpackConf));
            }
            catch (e) {
                done(e);
            }

            done();

            if (stats.hasErrors()) {
                done(
                    new Error(
                        stats.toString({
                            context: pathResolve('..'),
                            errorDetails: true
                        })
                    )
                );
                return;
            }

            console.log(
                stats.toString({
                    context: pathResolve('..'),
                    chunks: true,
                    chunkModules: true,
                    modules: false
                })
            );
        }
    }
});
