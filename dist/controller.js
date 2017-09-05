'use strict';

System.register(['app/plugins/sdk', 'lodash', 'app/core/utils/kbn', 'app/core/time_series2', './data_formatter', 'echarts', 'china'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, _, kbn, TimeSeries, DataFormatter, echarts, china, _createClass, Controller;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_appCoreUtilsKbn) {
            kbn = _appCoreUtilsKbn.default;
        }, function (_appCoreTime_series) {
            TimeSeries = _appCoreTime_series.default;
        }, function (_data_formatter) {
            DataFormatter = _data_formatter.default;
        }, function (_echarts) {
            echarts = _echarts.default;
        }, function (_china) {
            china = _china.default;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _export('Controller', Controller = function (_MetricsPanelCtrl) {
                _inherits(Controller, _MetricsPanelCtrl);

                function Controller($scope, $injector, $rootScope) {
                    _classCallCheck(this, Controller);

                    var _this = _possibleConstructorReturn(this, (Controller.__proto__ || Object.getPrototypeOf(Controller)).call(this, $scope, $injector));

                    _this.$rootScope = $rootScope;

                    var optionDefaults = {
                        type: 'map',
                        legend: {
                            show: false, // disable/enable legend
                            values: true
                        },
                        links: [],
                        datasource: null,
                        maxDataPoints: 3,
                        interval: null,
                        targets: [{}],
                        cacheTimeout: null,
                        nullPointMode: 'connected',
                        legendType: 'Under graph',
                        aliasColors: {},
                        format: 'short',
                        valueName: 'current',
                        strokeWidth: 1,
                        fontSize: '80%',
                        thresholds: '0,200',
                        unitSingle: '',
                        unitPlural: '',
                        esMetric: 'Count'
                    };

                    _.defaults(_this.panel, optionDefaults);
                    _.defaults(_this.panel.legend, optionDefaults.legend);

                    _this.dataFormatter = new DataFormatter(_this, kbn);

                    _this.events.on('render', _this.onRender.bind(_this));
                    _this.events.on('data-received', _this.onDataReceived.bind(_this));
                    _this.events.on('data-error', _this.onDataError.bind(_this));
                    _this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));
                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
                    return _this;
                }

                _createClass(Controller, [{
                    key: 'onRender',
                    value: function onRender() {
                        console.info('onRender trigger');
                        console.trace();
                    }
                }, {
                    key: 'onDataReceived',
                    value: function onDataReceived(dataList) {
                        if (!dataList) return;

                        var data = [];
                        this.dataFormatter.setGeohashValues(dataList, data);
                        this.data = this.dataFormatter.aggByProvince(data);

                        this.render();
                    }
                }, {
                    key: 'onDataError',
                    value: function onDataError() {
                        this.render(); // 渲染界面
                    }
                }, {
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('ChinaMap', 'public/plugins/chinamap-panel/partials/editor.html', 2);
                        this.unitFormats = kbn.getUnitFormats();
                    }
                }, {
                    key: 'seriesHandler',
                    value: function seriesHandler(seriesData) {
                        var series = new TimeSeries({
                            datapoints: seriesData.datapoints,
                            alias: seriesData.target
                        });

                        series.flotpairs = series.getFlotPairs(this.panel.nullPointMode);
                        return series;
                    }
                }, {
                    key: 'link',
                    value: function link(scope, elem, attrs, ctrl) {
                        ctrl.events.on('render', function () {
                            renderHandler(false);
                        });

                        var dom = elem.find('.chinamap'),
                            panel = void 0,
                            chinaMap = void 0;

                        function renderHandler(incrementRenderCounter) {
                            panel = ctrl.panel;

                            var height = setElementHeight();
                            if (height != 0) {
                                if (!chinaMap) chinaMap = echarts.init(dom.get(0));

                                buildChart(height);
                            }

                            if (incrementRenderCounter) {
                                ctrl.renderingCompleted();
                            }
                        }

                        function setElementHeight() {
                            try {
                                var height = ctrl.height || panel.height || ctrl.row.height;
                                if (_.isString(height)) {
                                    height = parseInt(height.replace('px', ''), 10);
                                }

                                height -= 5; // padding
                                height -= panel.title ? 24 : 9; // subtract panel title bar

                                dom.css('height', '500px');

                                return height;
                            } catch (e) {
                                // IE throws errors sometimes
                                console.log('setElementHeight error......');
                                return 0;
                            }
                        }

                        function buildChart(height) {
                            var data = [{ name: '北京', value: 100 }, { name: '天津', value: 50 }, { name: '上海', value: 80 }, { name: '重庆', value: 120 }];

                            if (ctrl.data) {
                                data = ctrl.data;
                            }

                            var option = {
                                title: {},
                                tooltip: {
                                    trigger: 'item'
                                },
                                legend: {
                                    orient: 'vertical',
                                    left: 'left'
                                },
                                visualMap: {
                                    min: 0,
                                    max: 2000,
                                    calculable: true,
                                    color: ['red', 'orange', 'yellow', 'lightgreen', 'green']
                                },
                                series: [{
                                    type: 'map',
                                    mapType: 'china',
                                    hoverable: true,
                                    roam: true,
                                    itemStyle: {
                                        normal: { label: { show: true }, areaColor: '#edf2f1' },
                                        emphasis: { label: { show: true }, areaColor: '#06060f' }
                                    },
                                    mapLocation: {
                                        y: "center",
                                        x: "center",
                                        height: "500"
                                    },
                                    label: {
                                        normal: {
                                            show: true
                                        },
                                        emphasis: {
                                            show: true
                                        }
                                    },
                                    data: data
                                }]
                            };

                            chinaMap.setOption(option);

                            window.$.getJSON('public/plugins/chinamap-panel/data/china.json').then(function (chinaJson) {
                                echarts.registerMap('china', chinaJson);
                                chinaMap.series.type = 'map';
                                chinaMap.series.mapType = 'china';
                            });
                        }
                    }
                }]);

                return Controller;
            }(MetricsPanelCtrl));

            _export('Controller', Controller);

            Controller.templateUrl = './partials/module.html';
        }
    };
});
//# sourceMappingURL=controller.js.map
