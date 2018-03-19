﻿angular.module('virtoCommerce.notificationsModule')
.controller('virtoCommerce.notificationsModule.editTemplateController', ['$rootScope', '$scope', '$timeout', '$localStorage', 'virtoCommerce.notificationsModule.notificationsModuleApi', 'FileUploader', 'platformWebApp.bladeNavigationService', 'platformWebApp.dialogService', 
 function ($rootScope, $scope, $timeout, $localStorage, notifications, FileUploader, bladeNavigationService, dialogService) {
    var blade = $scope.blade;    
    blade.updatePermission = 'platform:notification:update';
    $scope.isValid = false;
     
    var formScope; 
    $scope.setForm = function (form) { 
        formScope = form; 
    }

    var codemirrorEditor;
    var keyTemplateLocalStorage;
    blade.dynamicProperties = '';

    $scope.saveChanges = function () {
        var date = new Date();
        var now = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
        if (!blade.currentEntity.languageCode) { blade.currentEntity.languageCode = 'default'; }
        if (!blade.isNew) {
            blade.currentEntity.modified = now;
            blade.origEntity = angular.copy(blade.currentEntity);
        }
        else {
            blade.currentEntity.created = now;
            blade.origEntity = angular.copy(blade.currentEntity);
        }
        var ind = blade.notification.templates.findIndex(function (element) {
            return element.id === blade.currentEntity.id || element.languageCode === blade.currentEntity.languageCode;
        });
        if (ind >= 0) {
            blade.notification.templates[ind] = blade.currentEntity;
        }
        else {
            blade.notification.templates.push(blade.currentEntity);
        }
        if (blade.dynamicProperties) {
            $localStorage[keyTemplateLocalStorage] = blade.dynamicProperties;    
        }
        blade.parentBlade.initialize();
        $scope.bladeClose();
    };
     
     
    //todo 
    var contentType = 'image';//blade.contentType.substr(0, 1).toUpperCase() + blade.contentType.substr(1, blade.contentType.length - 1);
    $scope.fileUploader = new FileUploader({
        url: 'api/platform/assets?folderUrl=cms-content/' + contentType + '/assets',
        headers: { Accept: 'application/json' },
        autoUpload: true,
        removeAfterUpload: true,
        onBeforeUploadItem: function (fileItem) {
            blade.isLoading = true;
        },
        onSuccessItem: function (fileItem, response, status, headers) {
            $scope.$broadcast('filesUploaded', { items: response });
        },
        onErrorItem: function (fileItem, response, status, headers) {
            bladeNavigationService.setError(fileItem._file.name + ' failed: ' + (response.message ? response.message : status), blade);
        },
        onCompleteAll: function () {
            blade.isLoading = false;
        }
    });
     
    function setTemplate(data) {
        
		blade.isLoading = false;
        if (!blade.isNew) {
            keyTemplateLocalStorage = blade.tenantType + '.' + blade.notification.type + '.' + blade.currentEntity.languageCode;
            var itemFromLocalStorage = $localStorage[keyTemplateLocalStorage];
            if (itemFromLocalStorage) {
                blade.dynamicProperties = itemFromLocalStorage;
            }    
        }
        
		$timeout(function () {
			if (codemirrorEditor) {
				codemirrorEditor.refresh();
				codemirrorEditor.focus();
			}
			blade.origEntity = angular.copy(blade.currentEntity);
		}, 1);
        
        $scope.isValid = false;
	};

	blade.initialize = function () {
		blade.isLoading = true;
        if (blade.languageCode) {
            var found = _.findWhere(blade.notification.templates, { languageCode: blade.languageCode });
            if (found){
                blade.currentEntity = angular.copy(found);        
                blade.origEntity = angular.copy(blade.currentEntity);
                blade.orightml = blade.currentEntity.body;
            }
            
        }
        setTemplate(blade.currentEntity);
	};

//	$scope.editorOptions = {
//		lineWrapping: true,
//		lineNumbers: true,
//		parserfile: "liquid.js",
//		extraKeys: { "Ctrl-Q": function (cm) { cm.foldCode(cm.getCursor()); } },
//		foldGutter: true,
//		gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
//		onLoad: function (_editor) {
//			codemirrorEditor = _editor;
//		},
//		mode: "liquid-html"
//	};
     
     blade.renderTemplate = function () {
		var newBlade = {
			id: 'renderTemplate',
			title: 'notifications.blades.notifications-template-render.title',
			subtitle: 'notifications.blades.notifications-template-render.subtitle',
			subtitleValues: { type: blade.notificationType },
			notification: blade.notification,
			tenantId: blade.tenantId,
			tenantType: blade.tenantType,
            currentEntity: blade.currentEntity,
            language: blade.currentEntity.language,
			controller: 'virtoCommerce.notificationsModule.templateRenderController',
			template: 'Modules/$(VirtoCommerce.Notifications)/Scripts/blades/notifications-template-render.tpl.html'
		};

		bladeNavigationService.showBlade(newBlade, blade);
	}
     
    $scope.blade.toolbarCommands = [
        {
            name: "platform.commands.preview", icon: 'fa fa-eye',
            executeMethod: function () {
                blade.renderTemplate();
            },
            canExecuteMethod: function () {
                return true;
            },
            permission: blade.updatePermission
        }
    ];
	 
     
    function isDirty() {
        return (!angular.equals(blade.origEntity, blade.currentEntity) || blade.isNew) && blade.hasUpdatePermission();
	}
 
     
    $scope.$watch("blade.currentEntity", function () {
		$scope.isValid = isDirty() && formScope && formScope.$valid;
	}, true); 

	blade.headIcon = 'fa-envelope';

	blade.initialize();
}]);