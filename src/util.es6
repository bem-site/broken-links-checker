import path  from 'path';

/**
 * @exports
 * @class Util
 * @desc Implements utility methods
 */
export default class Util {
    /**
     * Returns resolved path to configuration folder
     * @return {String} path to configuration folder
     * @static
     */
    static getConfigurationDirectory() {
        return path.join(process.cwd(), './configs');
    }

    /**
     * Returns resolved path to reports folder
     * @return {String} path to reports folder
     * @static
     */
    static getReportsDirectory() {
        return path.join(process.cwd(), './reports');
    }
}
