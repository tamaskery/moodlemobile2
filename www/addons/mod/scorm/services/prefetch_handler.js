// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.addons.mod_scorm')

/**
 * Mod SCORM prefetch handler.
 *
 * @module mm.addons.mod_scorm
 * @ngdoc service
 * @name $mmaModScormPrefetchHandler
 */
.factory('$mmaModScormPrefetchHandler', function($mmaModScorm, $mmFS, $mmFilepool, $q, $mmSite, mmaModScormComponent) {

    var self = {};

    self.component = mmaModScormComponent;

    /**
     * Get the download size of a module.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#getDownloadSize
     * @param {Object} module   Module to get the size.
     * @param {Number} courseid Course ID the module belongs to.
     * @return {Promise}        Promise resolved with the size.
     */
    self.getDownloadSize = function(module, courseid) {
        return $mmaModScorm.getScorm(courseid, module.id, module.url).then(function(scorm) {
            if ($mmaModScorm.isScormSupported(scorm) !== true) {
                return 0;
            } else if (!scorm.packagesize) {
                // We don't have package size, try to calculate it.
                return $mmaModScorm.calculateScormSize(scorm);
            } else {
                return scorm.packagesize;
            }
        });
    };

    /**
     * Get the downloaded size of a module.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#getDownloadedSize
     * @param {Object} module   Module to get the downloaded size.
     * @param {Number} courseId Course ID the module belongs to.
     * @return {Promise}        Promise resolved with the size.
     */
    self.getDownloadedSize = function(module, courseId) {
        return $mmaModScorm.getScorm(courseId, module.id, module.url).then(function(scorm) {
            // Get the folder where SCORM should be unzipped.
            return $mmaModScorm.getScormFolder(scorm.moduleurl);
        }).then(function(path) {
            return $mmFS.getDirectorySize(path);
        });
    };

    /**
     * Get the list of downloadable files.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#getFiles
     * @param {Object} module   Module to get the files.
     * @param {Number} courseid Course ID the module belongs to.
     * @return {Promise}         Size.
     */
    self.getFiles = function(module, courseid) {
        return $mmaModScorm.getScorm(courseid, module.id, module.url).then(function(scorm) {
            return $mmaModScorm.getScormFileList(scorm);
        }).catch(function() {
            // SCORM not found, return empty list.
            return [];
        });
    };

    /**
     * Get revision of a SCORM (sha1hash).
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#getRevision
     * @param {Object} module   Module to get the revision.
     * @param {Number} courseid Course ID the module belongs to.
     * @return {Number}         Timemodified.
     */
    self.getRevision = function(module, courseid) {
        return $mmaModScorm.getScorm(courseid, module.id, module.url).then(function(scorm) {
            return scorm.sha1hash;
        });
    };

    /**
     * Get timemodified of a SCORM. It always return 0, we don't use timemodified for SCORM packages.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#getTimemodified
     * @param {Object} module   Module to get the timemodified.
     * @param {Number} courseid Course ID the module belongs to.
     * @return {Number}         Timemodified.
     */
    self.getTimemodified = function(module, courseid) {
        return 0;
    };

    /**
     * Invalidates WS calls needed to determine module status.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#invalidateModule
     * @param  {Object} module   Module to invalidate.
     * @param  {Number} courseId Course ID the module belongs to.
     * @return {Promise}         Promise resolved when done.
     */
    self.invalidateModule = function(module, courseId) {
        return $mmaModScorm.invalidateScormData(courseId);
    };

    /**
     * Check if a SCORM is downloadable.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#isDownloadable
     * @param {Object} module    Module to check.
     * @param {Number} courseId  Course ID the module belongs to.
     * @return {Promise}         Promise resolved with true if downloadable, resolved with false otherwise.
     */
    self.isDownloadable = function(module, courseId) {
        return $mmaModScorm.getScorm(courseId, module.id, module.url).then(function(scorm) {
            if (scorm.warningmessage) {
                // SCORM closed or not opened yet.
                return false;
            }
            if ($mmaModScorm.isScormSupported(scorm) !== true) {
                return false;
            }

            return true;
        });
    };

    /**
     * Whether or not the module is enabled for the site.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#isEnabled
     * @return {Boolean}
     */
    self.isEnabled = function() {
        return $mmaModScorm.isPluginEnabled();
    };

    /**
     * Prefetch the module.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#prefetch
     * @param  {Object} module   The module object returned by WS.
     * @param  {Number} courseId Course ID the module belongs to.
     * @param  {Boolean} single  True if we're downloading a single module, false if we're downloading a whole section.
     * @return {Promise}         Promise resolved when all files have been downloaded. Data returned is not reliable.
     */
    self.prefetch = function(module, courseId, single) {
        return $mmaModScorm.getScorm(courseId, module.id, module.url).then(function(scorm) {
            return $mmaModScorm.prefetch(scorm);
        });
    };

    /**
     * Remove module downloaded files.
     *
     * @module mm.addons.mod_scorm
     * @ngdoc method
     * @name $mmaModScormPrefetchHandler#removeFiles
     * @param {Object} module   Module to remove the files.
     * @param {Number} courseId Course ID the module belongs to.
     * @return {Promise}        Promise resolved when done.
     */
    self.removeFiles = function(module, courseId) {
        var siteId = $mmSite.getId(),
            scorm;

        return $mmaModScorm.getScorm(courseId, module.id, module.url).then(function(s) {
            scorm = s;

            // Get the folder where SCORM should be unzipped.
            return $mmaModScorm.getScormFolder(scorm.moduleurl);
        }).then(function(path) {
            var promises = [];

            // Remove the unzipped folder.
            promises.push($mmFS.removeDir(path).catch(function(error) {
                if (error && error.code == 1) {
                    // Not found, ignore error.
                } else {
                    return $q.reject(error);
                }
            }));

            // Maybe the ZIP wasn't deleted for some reason. Try to delete it too.
            promises.push($mmFilepool.removeFileByUrl(siteId, $mmaModScorm.getPackageUrl(scorm)).catch(function() {
                // Ignore errors.
            }));

            return $q.all(promises);
        });
    };

    return self;
});
