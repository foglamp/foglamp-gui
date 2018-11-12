import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { interval } from 'rxjs';
import { Chart } from 'chart.js';

import { DateFormatterPipe } from '../../../../pipes/date-formatter-pipe';
import { AlertService, AssetsService, PingService } from '../../../../services';
import Utils, { POLLING_INTERVAL } from '../../../../utils';
import ReadingsValidator from '../assets/readings-validator';
import { MAX_INT_SIZE } from '../../../../utils';

@Component({
  selector: 'app-average-graph',
  templateUrl: './average-graph.component.html',
  styleUrls: ['./average-graph.component.css']
})
export class AverageGraphComponent {
  public assetCode: string;
  public assetChartType: string;
  public assetReadingValues: any;
  public assetChartOptions: any;
  public showGraph = true;
  public readings: any;
  public assetReadingSeries = [];
  public graphRefreshInterval = POLLING_INTERVAL;
  public readingKey = '';
  public optedGroup = 'minutes';
  public timeValue = 10;
  public readKeyColorLabel = [];
  public showSpinner = false;
  public MAX_RANGE = MAX_INT_SIZE;
  public isOutOfRange = false;

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

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  setReading(reading) {
    this.readingKey = reading;
    this.plotSeriesGraph();
  }

  setGroup(group) {
    this.optedGroup = group;
    this.plotSeriesGraph();
  }

  setTimeValue(time) {
    if (time === null || time === undefined) {
      time = 10;
    }
    this.isOutOfRange = false;
    if (time > this.MAX_RANGE) {
      this.isOutOfRange = true;
      this.timeValue = 10;
      return;
    }
    this.timeValue = time;
  }

  public getSeriesGraph(assetCode, readingKey, timeValue) {
    this.timeValue = timeValue;
    this.assetCode = assetCode;
    this.readingKey = readingKey;
    this.plotSeriesGraph();
    this.notify.emit(false);
    if (this.graphRefreshInterval === -1) {
      this.isAlive = false;
    } else {
      this.isAlive = true;
    }
    this.assetCode = assetCode;
    interval(this.graphRefreshInterval)
      .takeWhile(() => this.isAlive) // only fires when component is alive
      .subscribe(() => {
        this.plotSeriesGraph();
      });
  }

  public plotSeriesGraph() {
    this.assetService.getAssetAverage(this.assetCode, this.readingKey, this.optedGroup, this.timeValue).
      subscribe(
        (data: any[]) => {
          if (data.length === 0) {
            this.getAssetTimeSeries(data);
            return false;
          }
          for (const e in data) {
            data[e].reading = {
              'average': data[e].average,
              'min': data[e].min,
              'max': data[e].max
            };
          }
          const validRecord = ReadingsValidator.validate(data);
          if (validRecord) {
            this.showGraph = true;
            this.getAssetTimeSeries(data);
          } else {
            this.showGraph = false;
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public getAssetTimeSeries(assetChartRecord) {
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
      const timestamps = assetChartRecord.map(t => t.timestamp);
      timestamps.forEach(timestamp => {
        assetTimeLabels.push(datePipe.transform(timestamp, 'HH:mm:ss'));
      });
    }
    this.statsAssetSeriesGraph(assetTimeLabels, assetReading);
  }

  getColor(readKey, cnt, fill) {
    const cc = Utils.getColorCode(readKey, cnt);
    if (fill) {
      this.readKeyColorLabel.push({ [readKey]: cc });
    }
    return cc;
  }

  private statsAssetSeriesGraph(labels, assetReading): void {
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
        backgroundColor: this.getColor(element.key.trim(), count, true),
        borderColor: this.getColor(element.key, count, false)
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

  stopInterval() {
    this.isAlive = false;
  }
}

