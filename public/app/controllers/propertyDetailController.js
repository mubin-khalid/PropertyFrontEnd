define(['services/propertyService' ,'services/schoolService'], function() {
    var coreModule = angular.module('coreModule');

    coreModule.filter('range', function() {
        return function(input, total) {
            total = parseInt(total);
            for (var i=0; i<total; i++)
                input.push(i);
            return input;
        };
    });



    coreModule.directive('flexSlider', [
        '$parse', '$timeout', function($parse, $timeout) {
            return {
                restrict: 'AE',
                scope: false,
                replace: true,
                transclude: true,
                template: '<div class="flexslider-container"></div>',
                compile: function(element, attr, linker) {
                    return function($scope, $element) {
                        var addSlide, collectionString, flexsliderDiv, getTrackFromItem, indexString, match, removeSlide, slidesItems, trackBy;
                        match = (attr.slide || attr.flexSlide).match(/^\s*(.+)\s+in\s+(.*?)(?:\s+track\s+by\s+(.+?))?\s*$/);
                        indexString = match[1];
                        collectionString = match[2];
                        trackBy = angular.isDefined(match[3]) ? $parse(match[3]) : $parse("" + indexString);
                        flexsliderDiv = null;
                        slidesItems = {};
                        getTrackFromItem = function(collectionItem, index) {
                            var locals;
                            locals = {};
                            locals[indexString] = collectionItem;
                            locals['$index'] = index;
                            return trackBy($scope, locals);
                        };
                        addSlide = function(collectionItem, index, callback) {
                            var childScope, track;
                            track = getTrackFromItem(collectionItem, index);
                            if (slidesItems[track] != null) {
                                throw "Duplicates in a repeater are not allowed. Use 'track by' expression to specify unique keys.";
                            }
                            childScope = $scope.$new();
                            childScope[indexString] = collectionItem;
                            childScope['$index'] = index;
                            return linker(childScope, function(clone) {
                                var slideItem;
                                slideItem = {
                                    collectionItem: collectionItem,
                                    childScope: childScope,
                                    element: clone
                                };
                                slidesItems[track] = slideItem;
                                return typeof callback === "function" ? callback(slideItem) : void 0;
                            });
                        };
                        removeSlide = function(collectionItem, index) {
                            var slideItem, track;
                            track = getTrackFromItem(collectionItem, index);
                            slideItem = slidesItems[track];
                            if (slideItem == null) {
                                return;
                            }
                            delete slidesItems[track];
                            slideItem.childScope.$destroy();
                            return slideItem;
                        };
                        return $scope.$watchCollection(collectionString, function(collection) {
                            var attrKey, attrVal, c, currentSlidesLength, e, i, idx, n, options, slider, slides, t, toAdd, toRemove, trackCollection, _i, _j, _k, _l, _len, _len1, _len2, _len3;
                            if (!(collection != null ? collection.length : void 0)) {
                                return;
                            }
                            if (flexsliderDiv != null) {
                                slider = flexsliderDiv.data('flexslider');
                                currentSlidesLength = Object.keys(slidesItems).length;
                                if (collection == null) {
                                    collection = [];
                                }
                                trackCollection = {};
                                for (i = _i = 0, _len = collection.length; _i < _len; i = ++_i) {
                                    c = collection[i];
                                    trackCollection[getTrackFromItem(c, i)] = c;
                                }
                                toAdd = (function() {
                                    var _j, _len1, _results;
                                    _results = [];
                                    for (i = _j = 0, _len1 = collection.length; _j < _len1; i = ++_j) {
                                        c = collection[i];
                                        if (slidesItems[getTrackFromItem(c, i)] == null) {
                                            _results.push({
                                                value: c,
                                                index: i
                                            });
                                        }
                                    }
                                    return _results;
                                })();
                                toRemove = (function() {
                                    var _results;
                                    _results = [];
                                    for (t in slidesItems) {
                                        i = slidesItems[t];
                                        if (trackCollection[t] == null) {
                                            _results.push(i.collectionItem);
                                        }
                                    }
                                    return _results;
                                })();
                                if ((toAdd.length === 1 && toRemove.length === 0) || toAdd.length === 0) {
                                    for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
                                        e = toRemove[_j];
                                        e = removeSlide(e, collection.indexOf(e));
                                        slider.removeSlide(e.element);
                                    }
                                    for (_k = 0, _len2 = toAdd.length; _k < _len2; _k++) {
                                        e = toAdd[_k];
                                        idx = e.index;
                                        addSlide(e.value, idx, function(item) {
                                            if (idx === currentSlidesLength) {
                                                idx = void 0;
                                            }
                                            return $scope.$evalAsync(function() {
                                                return slider.addSlide(item.element, idx);
                                            });
                                        });
                                    }
                                    return;
                                }
                            }
                            slidesItems = {};
                            if (flexsliderDiv != null) {
                                flexsliderDiv.remove();
                            }
                            slides = angular.element('<ul class="slides"></ul>');
                            flexsliderDiv = angular.element('<div class="flexslider"></div>');
                            flexsliderDiv.append(slides);
                            $element.append(flexsliderDiv);
                            for (i = _l = 0, _len3 = collection.length; _l < _len3; i = ++_l) {
                                c = collection[i];
                                addSlide(c, i, function(item) {
                                    return slides.append(item.element);
                                });
                            }
                            options = {};
                            for (attrKey in attr) {
                                attrVal = attr[attrKey];
                                if (attrKey.indexOf('$') === 0) {
                                    continue;
                                }
                                if (!isNaN(n = parseInt(attrVal))) {
                                    options[attrKey] = n;
                                    continue;
                                }
                                if (attrVal === 'false' || attrVal === 'true') {
                                    options[attrKey] = attrVal === 'true';
                                    continue;
                                }
                                if (attrKey === 'start' || attrKey === 'before' || attrKey === 'after' || attrKey === 'end' || attrKey === 'added' || attrKey === 'removed') {
                                    options[attrKey] = (function(attrVal) {
                                        var f;
                                        f = $parse(attrVal);
                                        return function(slider) {
                                            return $scope.$apply(function() {
                                                return f($scope, {
                                                    '$slider': {
                                                        element: slider
                                                    }
                                                });
                                            });
                                        };
                                    })(attrVal);
                                    continue;
                                }
                                if (attrKey === 'startAt') {
                                    options[attrKey] = $parse(attrVal)($scope);
                                    continue;
                                }
                                options[attrKey] = attrVal;
                            }
                            if (!options.sliderId && attr.id) {
                                options.sliderId = "" + attr.id + "-slider";
                            }
                            if (options.sliderId) {
                                flexsliderDiv.attr('id', options.sliderId);
                            }
                            return $timeout((function() {
                                return flexsliderDiv.flexslider(options);
                            }), 0);
                        });
                    };
                }
            };
        }
    ]);
    coreModule.controller('propertyDetailController', ['$scope', '$http', '$q', 'propertyService', 'schoolService', function($scope, $http, $q, propertyService, schoolService) {
        $("#overlay").show();
        $scope.id = $("#property_id").val();
        var map_center = new google.maps.LatLng(-34.397, 150.644);
        var mapOptions = {
            zoom: 15,
            center: map_center,
            styles: [{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"on"},{"saturation":-150},{"lightness":10}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"on"},{"saturation":-150},{"lightness":10}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"on"},{"saturation":-40},{"lightness":10}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"visibility":"simplified"},{"saturation":-100},{"lightness":10}]},{"featureType":"landscape.natural","elementType":"all","stylers":[{"visibility":"simplified"},{"saturation":-100},{"lightness":20}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"},{"saturation":-150},{"lightness":20}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"},{"saturation":-150},{"lightness":20}]}]
        }
        var map = new google.maps.Map(document.getElementById('property_map'), mapOptions);
        $scope.setCurrentImage = function(image){
            $scope.currentimage = image;
        };
        $scope.getProperty = propertyService.getPropertyDetail($scope.id).then(function(response) {
            console.log(response);
            var prop_data = response.data.data[0];

            $scope.images_array = [];

            //console.log(prop_data);
            var update_p = prop_data.image_url.split("|");
            angular.forEach(update_p, function(value, key){
                var imge = {
                    thumb : value,
                    img : value
                }
                $scope.images_array.push(imge);
            });
            $scope.currentimage = _.first($scope.images_array)
            $scope.image_url = update_p;
            $scope.title = prop_data.title;
            $scope.address = prop_data.address;
            $scope.bedroom = prop_data.bedrooms;
            $scope.bathroom = prop_data.bathrooms;
            $scope.area = prop_data.area;
            $scope.purpose = prop_data.purpose;
            $scope.price = prop_data.price;
            $scope.utilities = JSON.parse(prop_data.utilities);
            $scope.park = $scope.utilities.parking;
            $scope.ac = $scope.utilities.ac;
            $scope.swim = $scope.utilities.swim;
            $scope.balcony = $scope.utilities.balcony;
            $scope.update_date = prop_data.updated_at;
            var new_center = new google.maps.LatLng(prop_data.latitude, prop_data.longitude);
            map.setCenter(new_center);
            var marker = new google.maps.Marker({
                position: new_center,
                map: map,
                title: prop_data.address,
                animation: google.maps.Animation.BOUNCE,
                //icon:'http://maps.google.com/mapfiles/ms/icons/green-dot.png'

            });
            $scope.schools= "";
            schoolService.getSchools(map, new_center, $scope);
            $scope.date = new Date();
            //console.log($scope.date);
        }, function(response) {
            $("#overlay").hide();
        });
        $scope.getProperty;
        propertyService.addView($scope.id);
    }]);
});