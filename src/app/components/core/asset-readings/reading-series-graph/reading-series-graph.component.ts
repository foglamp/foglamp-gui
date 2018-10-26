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

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(ReadingsGraphComponent) readingsGraphComponent: ReadingsGraphComponent;
  @ViewChild(AverageGraphComponent) averageGraphComponent: AverageGraphComponent;
  @ViewChild('assetChart') assetChart: Chart;

  constructor(private alertService: AlertService, private assetService: AssetsService) {}

  public toggleModal(shouldOpen: Boolean) {
    const graph_modal = <HTMLDivElement>document.getElementById('graph_modal');
    if (shouldOpen) {
      graph_modal.classList.add('is-active');
      return;
    }
    if (this.graphRefreshInterval === -1) {
      this.notify.emit(false);
    } else {
      this.notify.emit(true);
    }
    // reset showGraph variable to default state
    this.optedGroup = 'minutes';
    this.timeValue = 10;
    this.isOutOfRange = false;
    graph_modal.classList.remove('is-active');
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
        console.log('readings', this.readings);
        this.averageGraphComponent.readings = this.readings;
        this.averageGraphComponent.plotSeriesGraph(assetCode);
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
    this.averageGraphComponent.setReading(reading, this.assetCode);
  }

  setGroup(group) {
    this.optedGroup = group;
    this.readingsGraphComponent.getTimeBasedAssetReadingsAndSummary(this.timeValue, this.optedGroup);
    this.averageGraphComponent.setGroup(group, this.assetCode);
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
    this.averageGraphComponent.setTimeValue(this.timeValue, this.assetCode);
  }

  public getGraph(assetCode) {
    this.assetCode = assetCode;
    this.getAssetReadings(assetCode);
    this.readingsGraphComponent.getReadingsGraph(assetCode);
    this.averageGraphComponent.getSeriesGraph(assetCode);
  }
}
