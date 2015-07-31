var os = require('os'),
    fs = require('fs'),
    path = require('path'),

    fsExtra = require('fs-extra'),
    inherit = require('inherit'),

    FileSystem;

 module.exports = FileSystem = inherit({
     _reportFile: undefined,

     /**
      * Creates empty report file
      */
     createReportFile: function () {
         var reportDir = path.resolve(this.__self.DIR, 'report');
         this._reportFile = path.join(reportDir, (+(new Date())).toString() + '.txt');

         fsExtra.ensureDirSync(reportDir);
         fsExtra.ensureFileSync(this._reportFile);
     },

     /**
      * Reads data from report file
      * @returns {Array}
      */
     readReportFile: function () {
         var content = fs.readFileSync(this._reportFile, 'utf-8');
         return content.split(os.EOL);
     },

     /**
      * Appends data row to report file
      * @param {String} row - string row which should be appended
      */
     appendToReportFile: function (row) {
         fs.appendFile(this._reportFile, row + os.EOL, 'utf8');
     }
}, {
    DIR: './.crawler',
});
