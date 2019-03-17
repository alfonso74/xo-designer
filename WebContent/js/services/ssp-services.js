
  (function () {

    angular.module('ballotTemplateDesigner').service('sspServices', ['$rootScope',
        '$http', '$uibModal', '$translate', 'ngToast', '$q', '$filter',
        '$timeout', '$location',
        function ($rootScope, $http, $uibModal, $translate, ngToast, $q,
            $filter, $timeout, $location) {

            this.UUIDGenerator = function () {
                const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
                                replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0, v = c == 'x' ?
                                r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                return uuid;
            };
    
            /**
             * Show a toast message
             * @param type The type of toast.
             Valid values are 'success', 'info', 'warning' or 'danger'
             * @param i18nKey The i18n message key
             * @param i18nKeyParams The i18n message key parameters (optional)
             */
            this.toast = function (type, i18nKey, i18nKeyParams, targetURL) {
                const text = $filter('translate')(i18nKey, i18nKeyParams);
                let targetTagStart = "";
                let targetEndStart = "";
                if (targetURL) {
                    targetTagStart = "<a href='/ssp/#" + targetURL + "'>";
                    targetEndStart = "</a>";
                }
                ngToast.create({
                    className: type,
                    content: targetTagStart + text + targetEndStart,
                    dismissOnTimeout: true,
                    timeout: 3000
                });
            };
            
        }]);

})(angular);
