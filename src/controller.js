import { MetricsPanelCtrl } from 'app/plugins/sdk';
import _ from 'lodash';
import kbn from 'app/core/utils/kbn';
import TimeSeries from 'app/core/time_series2';

import DataFormatter from './data_formatter';

import echarts from 'echarts';
import china from 'china';

export class Controller extends MetricsPanelCtrl {
    constructor($scope, $injector, $rootScope) {
        super($scope, $injector);
        this.$rootScope = $rootScope;

        const optionDefaults = {
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
            esMetric: 'Count',
        };

        _.defaults(this.panel, optionDefaults);
        _.defaults(this.panel.legend, optionDefaults.legend);

        this.dataFormatter = new DataFormatter(this, kbn);

        this.events.on('render', this.onRender.bind(this));
        this.events.on('data-received', this.onDataReceived.bind(this));
        this.events.on('data-error', this.onDataError.bind(this));
        this.events.on('data-snapshot-load', this.onDataReceived.bind(this));
        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
    }

    onRender() {
        console.info('onRender trigger')
        console.trace();
    }

    onDataReceived(dataList) {
        if (!dataList) return;

        const data  = [];
        this.dataFormatter.setGeohashValues(dataList, data);
        this.data = this.dataFormatter.aggByProvince(data);

        this.render();
    }

    onDataError() {
        this.render(); // 渲染界面
    }

    onInitEditMode() {
        this.addEditorTab('ChinaMap', 'public/plugins/chinamap-panel/partials/editor.html', 2);
        this.unitFormats = kbn.getUnitFormats();
    }

    link(scope, elem, attrs, ctrl) {
        ctrl.events.on('render', () => {
            renderHandler(false);
        });

        elem = elem.find('.chinamap');
        console.dir(elem);
        let panel, chinaMap;

        function renderHandler(incrementRenderCounter) {
            panel = ctrl.panel;
    
            let height = setElementHeight();
            if (height != 0) {
                chinaMap = echarts.init(elem.get(0));
                buildChart(height);
            } 

            if (incrementRenderCounter){
                ctrl.renderingCompleted();
            }
        }

        function setElementHeight() {
            try {
                let height = ctrl.height || panel.height || ctrl.row.height;
                if (_.isString(height)) {
                    height = parseInt(height.replace('px', ''), 10);
                }

                height -= 5; // padding
                height -= panel.title ? 24 : 9; // subtract panel title bar

                elem.css('height', '350px');
                elem.css('width', '700px');

                return height;
            } catch(e) { // IE throws errors sometimes
                console.log('setElementHeight error......')
                return 0;
            }
        }

        function buildChart(height) {
            let data = [{name: '北京',value: 100 },
                        {name: '天津',value: 50 },
                        {name: '上海',value: 80 },
                        {name: '重庆',value: 120 }]

            if (ctrl.data){
                data = ctrl.data;
            }

            const option = {
                title : {
                
                },
                tooltip : {
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
                    color: ['red','orange','yellow','lightgreen','green']
                },
                series : [
                    {
                        type: 'map',
                        mapType: 'china',
                        hoverable: true,
                        roam:true,
                        itemStyle:{
                            normal:{label:{show:true}, areaColor: '#edf2f1'},
                            emphasis:{label:{show:true}, areaColor: '#06060f'}
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
                    }
                ]
            };

            chinaMap.setOption(option);

            window.$.getJSON('public/plugins/chinamap-panel/data/china.json').then((chinaJson) => {
                echarts.registerMap('china', chinaJson);
                chinaMap.series.type = 'map';
                chinaMap.series.mapType = 'china';
            }); 
        }
    }

}

Controller.templateUrl = './partials/module.html';
