import { Component, EventEmitter, OnDestroy, HostListener, Output, ViewChild } from '@angular/core';
import { chain, map } from 'lodash';
import { interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { Chart } from 'chart.js';

import * as moment from 'moment';

import { AssetsService, PingService } from '../../../../services';
import { ASSET_READINGS_TIME_FILTER, COLOR_CODES, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})
export class ReadingsGraphComponent implements OnDestroy {
  public assetCode: string;
  public assetChartType: string;
  public assetReadingValues: any;
  public assetChartOptions: any;
  public loadPage = true;
  public MAX_RANGE = MAX_INT_SIZE;
  public graphRefreshInterval = POLLING_INTERVAL;
  public optedTime = ASSET_READINGS_TIME_FILTER;
  public readKeyColorLabel = [];
  private isAlive: boolean;
  public autoRefresh = false;
  public showSpinner = false;
  public timeDropDownOpened = false;
  public isModalOpened = false;
  public showResetZoomButton = false;
  public panning = false;

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('assetChart', { static: false }) assetChart: Chart;

  public numberTypeReadingsList = [];
  public selectedTab = 1;
  public timestamps = [];

  constructor(private assetService: AssetsService,
    private ping: PingService) {
    this.assetChartType = 'line';
    this.assetReadingValues = [];
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.graphRefreshInterval = timeInterval;
    });
  }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.loadPage = false;
    this.toggleModal(false);
  }

  public roundTo(num, to) {
    const _to = Math.pow(10, to);
    return Math.round(num * _to) / _to;
  }

  public toggleModal(shouldOpen: Boolean) {
    // reset all variable and array to default state
    this.assetReadingValues = [];
    this.readKeyColorLabel = [];
    this.assetChartOptions = {};
    sessionStorage.removeItem(this.assetCode);
    this.showResetZoomButton = false;
    this.panning = false;

    const chart_modal = <HTMLDivElement>document.getElementById('chart_modal');
    if (shouldOpen) {
      chart_modal.classList.add('is-active');
      return;
    }
    if (this.graphRefreshInterval === -1) {
      this.notify.emit(false);
    } else {
      this.notify.emit(true);
    }
    this.isAlive = false;
    chart_modal.classList.remove('is-active');
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      activeDropDowns[0].classList.remove('is-active');
    }
    this.optedTime = ASSET_READINGS_TIME_FILTER;
  }

  public getAssetCode(assetCode: string) {
    this.assetCode = assetCode;
    const payload = {
      assetCode: encodeURIComponent(this.assetCode),
      bucketSize: 1
    };
    this.isModalOpened = true;
    this.selectedTab = 1;
    this.loadPage = true;
    this.notify.emit(false);
    if (this.graphRefreshInterval === -1) {
      this.isAlive = false;
      this.getAssetReadings(payload);
    } else {
      this.isAlive = true;
      interval(this.graphRefreshInterval)
        .pipe(takeWhile(() => this.isAlive)) // only fires when component is alive
        .subscribe(() => {
          this.autoRefresh = true;
          this.getAssetReadings(payload);
        });
    }
  }

  getBucketReadings(readings: any) {
    const numReadings = [];
    this.timestamps = readings.map((r: any) => r.timestamp);
    for (const r of readings) {
      Object.entries(r.reading).forEach(([k, value]) => {
        if (typeof value['average'] === 'number') {
          numReadings.push({
            key: k,
            read: { x: r.timestamp, y: value['average'] }
          });
        }
      });
    }
    this.numberTypeReadingsList = numReadings.length > 0 ? this.mergeObjects(numReadings) : [];
    this.statsAssetReadingsGraph(this.numberTypeReadingsList, this.timestamps);
  }

  mergeObjects(assetReadings: any) {
    return chain(assetReadings).groupBy('key').map(function (group, key) {
      return {
        key: key,
        read: map(group, 'read')
      };
    }).value();
  }

  getColorCode(readKey, cnt, fill) {
    let cc = '';
    if (!['RED', 'GREEN', 'BLUE', 'R', 'G', 'B'].includes(readKey.toUpperCase())) {
      if (cnt >= 51) { // 50 is length of Utils' colorCodes array
        cc = '#ad7ebf';
      } else {
        cc = COLOR_CODES[cnt];
      }
    }
    if (readKey.toUpperCase() === 'RED' || readKey.toUpperCase() === 'R') {
      cc = '#FF334C';
    } else if (readKey.toUpperCase() === 'BLUE' || readKey.toUpperCase() === 'B') {
      cc = '#339FFF';
    } else if (readKey.toUpperCase() === 'GREEN' || readKey.toUpperCase() === 'G') {
      cc = '#008000';
    }

    if (fill) {
      this.readKeyColorLabel.push({ [readKey]: cc });
    }
    return cc;
  }

  private statsAssetReadingsGraph(assetReadings: any, timestamps: any): void {
    const dataset = [];
    this.readKeyColorLabel = [];
    let count = 0;
    for (const r of assetReadings) {
      const dt = {
        label: r.key,
        data: r.read,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        hidden: this.getLegendState(r.key),
        backgroundColor: this.getColorCode(r.key.trim(), count, true),
        borderColor: this.getColorCode(r.key.trim(), count, false)
      };
      if (dt.data.length) {
        dataset.push(dt);
      }
      count++;
    }
    this.setAssetReadingValues(dataset, timestamps);
  }

  public getLegendState(key) {
    const selectedLegends = JSON.parse(sessionStorage.getItem(this.assetCode));
    if (selectedLegends == null) {
      return false;
    }
    for (const l of selectedLegends) {
      if (l.key === key && l.selected === true) {
        return true;
      }
    }
  }

  private setAssetReadingValues(ds: any, timestamps) {
    this.assetChartOptions = {};
    this.assetReadingValues = {
      labels: timestamps,
      datasets: ds
    };
    this.assetChartType = 'line';
    this.assetChartOptions = {
      elements: {
        point: { radius: 0 }
      },
      scales: {
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            unit: 'second',
            tooltipFormat: 'HH:mm:ss:SSS',
            displayFormats: {
              unit: 'second',
              second: 'HH:mm:ss'
            }
          },
          ticks: {
            autoSkip: true
          },
          bounds: 'ticks'
        }]
      },
      legend: {
        onClick: (e, legendItem) => {
          console.log('clicked ', legendItem, e);
          const index = legendItem.datasetIndex;
          const chart = this.assetChart.chart;
          const meta = chart.getDatasetMeta(index);
          /**
          * meta data have hidden property as null by default in chart.js
          */
          meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;
          let savedLegendState = JSON.parse(sessionStorage.getItem(this.assetCode));
          if (savedLegendState !== null) {
            if (legendItem.hidden === false) {
              savedLegendState.push({ key: legendItem.text, selected: true });
            } else {
              savedLegendState = savedLegendState.filter(dt => dt.key !== legendItem.text);
            }
          } else {
            savedLegendState = [{ key: legendItem.text, selected: true }];
          }
          sessionStorage.setItem(this.assetCode, JSON.stringify(savedLegendState));
          chart.update();
        }
      },
      pan: {
        enabled: true,
        mode: 'x',
        speed: 10,
        rangeMin: {
          x: 1000
        },
        onPan: () => {
          this.isAlive = false;
        },
        onPanComplete: ({ chart }) => {
          this.setGraphData(chart);
        }
      },
      zoom: {
        enabled: true,
        mode: 'x',
        sensitivity: 0.3,
        rangeMin: {
          x: 1000
        },
        onZoomComplete: ({ chart }) => {
          if (!this.panning) {
            this.setGraphData(chart);
          }
        }
      },
      responsive: true
    };

    if (this.panning) {
      // in pan mode set mode to empty from x-axis to stop chart drag
      this.assetChartOptions.pan['mode'] = '';

      this.assetChartOptions.zoom['drag'] = {};
      this.assetChartOptions.zoom['drag']['enable'] = true;
      this.assetChartOptions.zoom['drag']['borderWidth'] = 1;
      this.assetChartOptions.zoom['drag']['backgroundColor'] = 'rgb(130, 202, 250, 0.4)';
    }
  }

  setGraphData(chart: Chart) {
    this.isAlive = false;
    this.showResetZoomButton = true;
    const start = moment.utc(chart.scales['x-axis-0'].min);
    const end = moment.utc(chart.scales['x-axis-0'].max);
    console.log('pan start', start);
    console.log('pan end', end);
    const duration = moment.duration(end.diff(start));
    console.log('duration', duration.asSeconds());
    const seconds = duration.asSeconds();
    const bucketSize = this.caluclateBucketSize(seconds);
    const payload = {
      assetCode: encodeURIComponent(this.assetCode),
      start: start.unix(),
      len: Math.round(seconds),
      bucketSize: bucketSize
    };
    this.getAssetReadings(payload);
  }

  public toggleDropdown() {
    const dropDown = document.querySelector('#time-dropdown');
    dropDown.classList.toggle('is-active');
    if (!dropDown.classList.contains('is-active')) {
      this.timeDropDownOpened = false;
    } else {
      this.timeDropDownOpened = true;
    }
  }

  public isNumber(val) {
    return typeof val === 'number';
  }

  selectTab(id: number, showSpinner = true) {
    this.showSpinner = showSpinner;
    this.selectedTab = id;
    const payload = {
      assetCode: encodeURIComponent(this.assetCode),
      bucketSize: 1
    };
    this.getAssetReadings(payload);
  }

  isEmptyObject(obj) {
    return (obj && (Object.keys(obj).length === 0));
  }

  keyDescOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>): number => {
    return a.key > b.key ? -1 : (b.key > a.key ? 1 : 0);
  }

  public resetZoom() {
    this.isAlive = true;
    this.showResetZoomButton = false;
    this.assetChart.chart.resetZoom();
    const payload = {
      assetCode: encodeURIComponent(this.assetCode),
      bucketSize: 1
    };
    this.getAssetReadings(payload);
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }

  getAssetReadings(payload: any) {
    this.assetService.getAssetReadingsBucket(payload).
      subscribe(
        (data: any[]) => {
          this.showSpinner = false;
          this.loadPage = false;
          this.getBucketReadings(data);
        },
        error => {
          this.showSpinner = false;
          console.log('error in response', error);
        });
  }

  public caluclateBucketSize(duration) {
    let bucket = Math.round(duration / 10);
    return bucket = bucket === 0 ? 1 : (bucket > 48 ? 48 : bucket);
  }

  setPaning(isPanning: boolean) {
    this.panning = !isPanning;
    this.resetZoom();
  }
}
