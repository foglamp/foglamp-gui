import { Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { orderBy } from 'lodash';
import { interval } from 'rxjs';
import { Chart } from 'chart.js';

import { DateFormatterPipe } from '../../../../pipes/date-formatter-pipe';
import { AlertService, AssetsService, PingService } from '../../../../services';
import { ASSET_READINGS_TIME_FILTER, COLOR_CODES, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import ReadingsValidator from '../assets/readings-validator';

@Component({
  selector: 'app-series-graph',
  templateUrl: './series-graph.component.html',
  styleUrls: ['./series-graph.component.css']
})
export class SeriesGraphComponent implements OnDestroy {
  public assetCode: string;
  public assetChartType: string;
  public assetReadingValues: any;
  public assetChartOptions: any;
  public showGraph = true;
  public readings: any;
  public assetReadingSeries = [];
  public assetReadingSummary = [];
  public graphRefreshInterval = POLLING_INTERVAL;
  public optedGroup = 'seconds';
  public readKeyColorLabel = [];

  private isAlive: boolean;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('assetChart') assetChart: Chart;

  constructor(private assetService: AssetsService, private alertService: AlertService,
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

  public roundTo(num, to) {
    const _to = Math.pow(10, to);
    return Math.round(num * _to) / _to;
  }

  public toggleModal(shouldOpen: Boolean) {
    const series_graph = <HTMLDivElement>document.getElementById('series_graph');
    if (shouldOpen) {
      series_graph.classList.add('is-active');
      return;
    }
    if (this.graphRefreshInterval === -1) {
      this.notify.emit(false);
    } else {
      this.notify.emit(true);
    }
    this.isAlive = false;
    // reset showGraph variable to default state
    this.showGraph = true;
    series_graph.classList.remove('is-active');
    sessionStorage.removeItem(this.assetCode);
  }

  getTimeSeriesGraph(group) {
    this.optedGroup = group;
    this.showAssetAverage(this.assetCode);
    this.plotReadingsGraph(this.assetCode);
  }

  public getSeriesGraph(assetCode, autoRefresh = true) {
    this.notify.emit(false);
    if (this.graphRefreshInterval === -1) {
      this.isAlive = false;
    } else {
      this.isAlive = true;
    }
    this.assetCode = assetCode;
    if (autoRefresh === false) {
      this.plotReadingsGraph(assetCode);
      this.showAssetAverage(assetCode);
    }
    interval(this.graphRefreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.showAssetAverage(this.assetCode);
        this.plotReadingsGraph(this.assetCode);
      });
  }

  public getAssetReadingsSummary(assetCode) {
    this.assetService.getAllAssetSummary(assetCode).subscribe(
      (data: any) => {
        this.assetReadingSummary = data.map(o => {
          const k = Object.keys(o)[0];
          return {
            name: k,
            value: [o[k]]
          };
        });
        this.assetReadingSummary = orderBy(this.assetReadingSummary, ['name'], ['asc']);
      },
      error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public showAssetAverage(assetCode, ) {
      this.readings.forEach(element => {
        this.getAssetAverage(assetCode, element);
      });
  }

  public getAssetAverage(assetCode, reading) {
    this.assetService.getAssetAverage(assetCode, reading, this.optedGroup).subscribe(
      (data: any) => {
        this.assetReadingSeries = data;
      },
      error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  public plotReadingsGraph(assetCode) {
    if (assetCode === '') {
      return false;
    }
    this.assetService.getAssetReadings(encodeURIComponent(assetCode)).
      subscribe(
        (data: any[]) => {
          console.log('assetCode', assetCode);
          console.log('data1', data);
          if (data.length === 0) {
            this.readings = [];
            this.getAssetTimeReading(data);
            return false;
          }
          const validRecord = ReadingsValidator.validate(data);
          if (validRecord) {
            this.readings = Object.keys(data[0].reading);
            this.getAssetTimeReading(data);
          } else {
            this.readings = [];
            this.showGraph = false;
          }
        },
        error => {
          console.log('error in response', error);
        });
  }

  public getAssetTimeReading(assetChartRecord) {
    let assetTimeLabels = [];
    const datePipe = new DateFormatterPipe();
    let assetReading = [];
    if (assetChartRecord.length === 0) {
      assetTimeLabels = [];
      assetReading = [];
    } else {
      const readings = assetChartRecord.reverse().map(d => d.reading);
      readings.forEach(data => {
        for (const k in data) {
          if (assetReading.length < Object.keys(data).length) {
            const read = {
              key: k,
              values: [data[k]],
            };
            assetReading.push(read);
          } else {
            assetReading.map(el => {
              if (el.key === k) {
                el.values.push(data[k]);
              }
            });
          }
        }
      });
      const timestamps = assetChartRecord.reverse().map(t => t.timestamp);
      timestamps.forEach(timestamp => {
        assetTimeLabels.push(datePipe.transform(timestamp, 'HH:mm:ss'));
      });
    }
    this.statsAssetReadingsGraph(assetTimeLabels, assetReading);
  }

  getColorCode(readKey, cnt, fill) {
    let cc = '';
    if (!['RED', 'GREEN', 'BLUE', 'R', 'G', 'B'].includes(readKey.toUpperCase())) {
      if (cnt >= 16) { // 15 is length of Utils' colorCodes array
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

  private statsAssetReadingsGraph(labels, assetReading): void {
    this.readKeyColorLabel = [];
    const ds = [];
    let count = 0;
    assetReading.forEach(element => {
      const dt = {
        label: element.key,
        data: element.values,
        fill: false,
        lineTension: 0.1,
        spanGaps: true,
        hidden: this.getLegendState(element.key),
        backgroundColor: this.getColorCode(element.key.trim(), count, true),
        borderColor: this.getColorCode(element.key, count, false)
      };
      count++;
      ds.push(dt);
    });
    this.assetChartType = 'line';
    this.assetChartOptions = {
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
      }
    };
    this.setAssetReadingValues(labels, ds);
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

  private setAssetReadingValues(labels, ds) {
    this.assetReadingValues = {
      labels: labels,
      datasets: ds
    };
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}

