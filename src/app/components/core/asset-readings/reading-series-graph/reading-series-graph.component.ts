import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';

import { AlertService, AssetsService } from '../../../../services';
import { POLLING_INTERVAL } from '../../../../utils';
import { MAX_INT_SIZE } from '../../../../utils';
import { ReadingsGraphComponent } from '../readings-graph/readings-graph.component';
import { AverageGraphComponent } from '../average-graph/average-graph.component';

@Component({
  selector: 'app-reading-series-graph',
  templateUrl: './reading-series-graph.component.html',
  styleUrls: ['./reading-series-graph.component.css']
})
export class ReadingSeriesGraphComponent {
  public assetCode: string;
  public optedGroup = 'minutes';
  public timeValue = 10;
  public graphRefreshInterval = POLLING_INTERVAL;
  public isOutOfRange = false;
  public readingKey = '';
  public MAX_RANGE = MAX_INT_SIZE;
  public readings: any;

  isModalActive = false;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(ReadingsGraphComponent) readingsGraphComponent: ReadingsGraphComponent;
  @ViewChild(AverageGraphComponent) averageGraphComponent: AverageGraphComponent;
  @ViewChild('assetChart') assetChart: Chart;

  constructor(private alertService: AlertService, private assetService: AssetsService) { }

  public toggleModal() {
    this.isModalActive = !this.isModalActive;
    if (this.isModalActive) {
      this.notify.emit(false);
    } else {
      this.stopInterval();
      this.notify.emit(true);
    }
    // reset showGraph variable to default state
    this.optedGroup = 'minutes';
    this.timeValue = 10;
    this.isOutOfRange = false;
    sessionStorage.removeItem(this.assetCode);
  }

  public getAssetReadings(assetCode) {
    this.assetService.getAssetReadings(encodeURIComponent(assetCode)).subscribe(
      (data: any[]) => {
        if (data.length === 0) {
          this.readings = [];
          return false;
        }
        this.readings = Object.keys(data[0].reading);
        this.averageGraphComponent.readings = this.readings;
        this.averageGraphComponent.getSeriesGraph(assetCode, this.readings[0], this.timeValue);
        this.readingsGraphComponent.getReadingsGraph(assetCode, this.timeValue, this.optedGroup);
      },
      error => {
        if (error.status === 0) {
          console.log('service down ', error);
        } else {
          this.alertService.error(error.statusText);
        }
      });
  }

  setReading(reading) {
    this.readingKey = reading;
    this.averageGraphComponent.setReading(reading);
  }

  setGroup(group) {
    this.optedGroup = group;
    this.readingsGraphComponent.getTimeBasedAssetReadingsAndSummary(this.timeValue, this.optedGroup);
    this.averageGraphComponent.setGroup(group);
  }

  stopInterval() {
    this.readings = [];
    this.readingsGraphComponent.stopInterval();
    this.averageGraphComponent.stopInterval();
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
    this.readingsGraphComponent.getTimeBasedAssetReadingsAndSummary(this.timeValue, this.optedGroup);
    this.averageGraphComponent.setTimeValue(this.timeValue);
  }

  public getGraph(assetCode) {
    this.assetCode = assetCode;
    this.getAssetReadings(assetCode);
  }
}
