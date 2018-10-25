import { Component, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';

import { AlertService, AssetsService, PingService } from '../../../../services';
import { POLLING_INTERVAL } from '../../../../utils';
import { MAX_INT_SIZE } from '../../../../utils';
import { ReadingsGraphComponent } from '../readings-graph/readings-graph.component';
import { SeriesGraphComponent } from '../series-graph/series-graph.component';

@Component({
  selector: 'app-reading-series-graph',
  templateUrl: './reading-series-graph.component.html',
  styleUrls: ['./reading-series-graph.component.css']
})
export class ReadingSeriesGraphComponent implements OnDestroy {
  public assetCode: string;
  public optedGroup = 'minutes';
  public timeValue = 10;
  public isAlive: boolean;
  public graphRefreshInterval = POLLING_INTERVAL;
  public isOutOfRange = false;
  public readingKey = '';
  public MAX_RANGE = MAX_INT_SIZE;
  public readings: any;

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild(ReadingsGraphComponent) readingsGraphComponent: ReadingsGraphComponent;
  @ViewChild(SeriesGraphComponent) seriesGraphComponent: SeriesGraphComponent;
  @ViewChild('assetChart') assetChart: Chart;

  constructor(private alertService: AlertService, private assetService: AssetsService, private ping: PingService) {
    this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.graphRefreshInterval = timeInterval;
    });
  }

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
    this.isAlive = false;
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
    this.readingsGraphComponent.plotReadingsGraph(this.assetCode);
    // this.seriesGraphComponent.plotSeriesGraph(this.assetCode);
  }

  setGroup(group) {
    this.optedGroup = group;
    this.readingsGraphComponent.getTimeBasedAssetReadingsAndSummary(this.timeValue, this.optedGroup);
    // this.seriesGraphComponent.plotSeriesGraph(this.assetCode);
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
    // this.seriesGraphComponent.plotSeriesGraph(this.assetCode);
  }

  public getGraph(assetCode) {
    this.assetCode = assetCode;
    this.getAssetReadings(assetCode);
    this.readingsGraphComponent.getReadingsGraph(assetCode);
    // this.seriesGraphComponent.getSeriesGraph(assetCode);
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}

