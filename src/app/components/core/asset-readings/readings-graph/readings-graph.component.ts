import { Component, EventEmitter, OnDestroy, HostListener, Output, ViewChild } from '@angular/core';
import { uniq } from 'lodash';
import { interval, Subject } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

import { AssetsService, PingService } from '../../../../services';
import Utils, { COLOR_CODES, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { PlotlyService } from 'angular-plotly.js';

@Component({
  selector: 'app-readings-graph',
  templateUrl: './readings-graph.component.html',
  styleUrls: ['./readings-graph.component.css']
})

export class ReadingsGraphComponent implements OnDestroy {
  public assetCode: string;
  public MAX_RANGE = MAX_INT_SIZE;
  public graphRefreshInterval = POLLING_INTERVAL;
  public readKeyColorLabel = [];

  public loadPage = true;
  private isAlive: boolean;
  numReadings = [];
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('assetChart', { static: false }) assetChart: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  DEFAULT_TIME_WINDOW_INDEX = 23;
  panning = false;
  zoom = false;
  layout = {
    font: {
      size: 12
    },
    dragmode: 'pan',
    xaxis: {
      tickformat: '%H:%M:%S',
      type: 'date',
      title: {
        text: 'Time Window - 10 mins',
        font: {
          size: 14,
          color: '#7f7f7f'
        }
      },
    },
    yaxis: {
      fixedrange: true
    },
    height: 500,
    margin: {
      l: 50,
      r: 50,
      b: 50,
      t: 50,
      pad: 1
    }
  };

  timeWindowIndex = this.DEFAULT_TIME_WINDOW_INDEX;  // initial value is 600s
  config = {
    doubleClick: false,
    displaylogo: false,
    displayModeBar: true,
    modeBarButtonsToRemove: ['resetScale2d', 'hoverClosestCartesian', 'select2d',
      'hoverCompareCartesian', 'lasso2d', 'zoom2d', 'autoScale2d', 'pan2d',
      'zoomIn2d', 'zoomOut2d', 'toImage', 'toggleSpikelines'],
    modeBarButtonsToAdd: [[
      {
        name: 'Zoom in',
        icon: {
          'width': 875,
          'height': 1000,
          'path': 'm1 787l0-875 875 0 0 875-875 0z m687-500l-187 0 0-187-125 0 0 187-188 0 0 125 188 0 0 187 125 0 0-187 187 0 0-125z',
          'transform': 'matrix(1 0 0 -1 0 850)'
        },
        click: () => {
          if (this.timeWindowIndex <= 0) {
            console.log('minimum zoom level reached');
            return;
          }

          if (this.numReadings.length <= 0 || (this.numReadings.length > 0 && this.numReadings[0].x.length <= 1)) {
            console.log('No readings to zoom in');
            return;
          }
          this.timeWindowIndex--;
          const timeWindow = Utils.getTimeWindow(this.timeWindowIndex);
          this.updateTimeWindowText(timeWindow.key);
          if (this.panning) {
            this.panModeZoom();
            return;
          }
          this.zoomGraph(timeWindow.value);

        }
      },
      {
        name: 'Zoom out',
        icon: {
          'width': 875,
          'height': 1000,
          'path': 'm0 788l0-876 875 0 0 876-875 0z m688-500l-500 0 0 125 500 0 0-125z',
          'transform': 'matrix(1 0 0 -1 0 850)'
        },
        click: () => {
          if (this.timeWindowIndex >= Utils.getTimeWindow(this.timeWindowIndex).size - 1) {
            console.log('maximum zoom level reached');
            return;
          }
          this.timeWindowIndex++;
          const timeWindow = Utils.getTimeWindow(this.timeWindowIndex);
          this.updateTimeWindowText(timeWindow.key);
          if (this.panning) {
            this.panModeZoom(true);
            return;
          }
          this.zoomGraph(timeWindow.value);
        }
      },
      {
        name: 'Reset',
        icon: {
          'width': 1000,
          'height': 1000,
          // tslint:disable-next-line: max-line-length
          'path': 'm250 850l-187 0-63 0 0-62 0-188 63 0 0 188 187 0 0 62z m688 0l-188 0 0-62 188 0 0-188 62 0 0 188 0 62-62 0z m-875-938l0 188-63 0 0-188 0-62 63 0 187 0 0 62-187 0z m875 188l0-188-188 0 0-62 188 0 62 0 0 62 0 188-62 0z m-125 188l-1 0-93-94-156 156 156 156 92-93 2 0 0 250-250 0 0-2 93-92-156-156-156 156 94 92 0 2-250 0 0-250 0 0 93 93 157-156-157-156-93 94 0 0 0-250 250 0 0 0-94 93 156 157 156-157-93-93 0 0 250 0 0 250z',
          'transform': 'matrix(1 0 0 -1 0 850)'
        },
        click: () => {
          this.resetGraphToDefault();
          if (this.assetCode !== undefined) {
            this.getAssetReadings(this.payload);
          }
        }
      }
    ]]
  };

  payload = {
    assetCode: '',
    start: 0,
    len: 600,
    bucketSize: 1
  };

  constructor(private assetService: AssetsService,
    private ping: PingService, public plotly: PlotlyService) {
    this.ping.pingIntervalChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe((timeInterval: number) => {
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

  public toggleModal(shouldOpen: Boolean) {
    // reset all variable and array to default state
    this.readKeyColorLabel = [];
    sessionStorage.removeItem(this.assetCode);
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
    this.resetGraphToDefault();
  }

  public resetGraphToDefault() {
    sessionStorage.removeItem(this.assetCode);
    this.timeWindowIndex = this.DEFAULT_TIME_WINDOW_INDEX;
    this.panning = false;
    this.zoom = false;
    // reset payload to default
    this.payload = {
      assetCode: this.assetCode,
      start: 0,
      len: 600,
      bucketSize: 1
    };
    this.updateTimeWindowText('10 mins');
  }

  public getAssetCode(assetCode: string) {
    this.payload.assetCode = assetCode;
    this.assetCode = assetCode;
    this.loadPage = true;
    this.notify.emit(false);
    if (this.graphRefreshInterval === -1) {
      this.isAlive = false;
      this.getAssetReadings(this.payload);
    } else {
      this.isAlive = true;
      interval(this.graphRefreshInterval)
        .pipe(takeWhile(() => this.isAlive), takeUntil(this.destroy$)) // only fires when component is alive
        .subscribe(() => {
          this.getAssetReadings(this.payload);
        });
    }
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

  getAssetReadings(payload: any) {
    this.assetService.getAssetReadingsBucket(payload).
      subscribe(
        (data: any[]) => {
          this.generateGraph(data);
          this.loadPage = false;
        },
        error => {
          console.log('error in response', error);
        });
  }

  generateGraph(readings: any) {
    this.numReadings = [];
    const output = {};
    let item: any;
    // iterate the outer array to look at each item in that array
    for (const r of readings) {
      item = r.reading;
      // iterate each key on the object
      for (const prop in item) {
        if (item.hasOwnProperty(prop)) {
          // if this keys doesn't exist in the output object, add it
          if (!(prop in output)) {
            output[prop] = [];
            output['timestamp'] = [];
          }
          // add data onto the end of the key's array
          output[prop].push(item[prop].average);
          output['timestamp'].push(r.timestamp);
        }
      }
    }
    let count = 0;
    for (const key in item) {
      const readingTimestamps = uniq(output['timestamp'], 'timestamp');
      this.numReadings.push({
        x: readingTimestamps,
        y: output[key],
        type: 'scatter',
        mode: readingTimestamps.length === 1 ? 'markers' : 'lines',
        name: key,
        visible: this.getLegendState(key),
        marker: {
          color: this.getColorCode(key.trim(), count, false)
        },
        modeBarButtons: [{
          displaylogo: false
        }]
      });
      count++;
    }

    const timestamps = uniq(output['timestamp'], 'timestamp');
    const now = moment.utc(new Date()).valueOf() / 1000.0; // in seconds
    const graphStartTimeSeconds = this.payload.start === 0 ? (now - this.payload.len) : this.payload.start;
    const graphStartDateTime = moment(graphStartTimeSeconds * 1000).format('YYYY-M-D H:mm:ss.SSS');
    this.layout.xaxis['range'] = [graphStartDateTime, timestamps[0]];
    const timeWindow = Utils.getTimeWindow(this.timeWindowIndex);
    this.updateXAxisTickFormat(timeWindow.value);
  }

  public zoomGraph(seconds: number) {
    this.zoom = true;
    const maxDataPoints = 600;
    const bucket = seconds / maxDataPoints;
    const length = seconds;
    console.log('Bucket = ', bucket, ' length = ', length);
    this.payload = {
      assetCode: this.assetCode,
      start: 0,
      len: length,
      bucketSize: bucket
    };
    this.getAssetReadings(this.payload);
  }

  updateXAxisTickFormat(length) {
    // below 1 minute
    if (length < 60) {
      this.layout.xaxis.tickformat = '%H:%M:%S.%L';
    }
    // 1 minute to 6 hours
    if (60 <= length && length <= 21600) {
      this.layout.xaxis.tickformat = '%H:%M:%S';
    }
    // 6 hours to 1 day
    if (21600 < length && length < 86400) {
      this.layout.xaxis.tickformat = '%H:%M';
    }
    // 1 day to 1 week
    if (86400 <= length && length < 604800) {
      this.layout.xaxis.tickformat = '%e %b %H:%M';
    }
    // 1 week to 6 months
    if (604800 <= length && length < 15552000) {
      this.layout.xaxis.tickformat = '%e %b';
    }
    // above 6 months
    if (15552000 <= length) {
      this.layout.xaxis.tickformat = '%b %y';
    }
  }

  dragGraph(event: any) {
    if (event['xaxis.range[0]'] === undefined || this.numReadings.length === 0) {
      return;
    }

    const maxDataPoints = 600;
    console.log('click', this.numReadings[0].x[this.numReadings[0].x.length - 1]);
    const panClickTime = moment(this.numReadings[0].x[this.numReadings[0].x.length - 1]).utc();
    const panReleaseTime = moment(event['xaxis.range[0]']).utc();

    console.log('Pan Click Time ', panClickTime);
    console.log('Pan Release Time ', panReleaseTime);

    console.log('panClickTime utc', panClickTime.format());
    console.log('panReleaseTime utc', panReleaseTime.format());

    const panDeltaTime = moment.duration(panClickTime.diff(panReleaseTime)).asSeconds();
    console.log('panDeltaTime', panDeltaTime);

    const now = moment.utc(new Date()).valueOf() / 1000.0; // in seconds
    console.log('now', now);

    const currentTimeWindow = Utils.getTimeWindow(this.timeWindowIndex); // in seconds
    console.log('current time window', currentTimeWindow);

    const start = now - currentTimeWindow.value - panDeltaTime;
    console.log('start', start);

    const bucket = currentTimeWindow.value / maxDataPoints;
    console.log('bucket', bucket);

    const draggedToTime = moment(event['xaxis.range[1]']).utc().valueOf() / 1000.0;
    console.log('draggedToTime', draggedToTime);

    this.zoom = false;
    this.panning = true;
    this.payload = {
      assetCode: this.assetCode,
      start: start,
      len: currentTimeWindow.value,
      bucketSize: bucket
    };

    if (now < draggedToTime) {
      this.panning = false;
      console.log('Graph cannot be dragged in future time.');
      this.payload = {
        assetCode: this.assetCode,
        start: 0,
        len: currentTimeWindow.value,
        bucketSize: bucket
      };
    }
    this.getAssetReadings(this.payload);
  }

  legendClick(event) {
    const legendItem = event.data[event.curveNumber].name;
    let selectedLegends = JSON.parse(sessionStorage.getItem(this.assetCode));
    selectedLegends = selectedLegends === null ? [] : selectedLegends;
    if (selectedLegends.includes(legendItem)) {
      selectedLegends = selectedLegends.filter(dt => dt !== legendItem);
    } else {
      selectedLegends.push(legendItem);
    }
    sessionStorage.setItem(this.assetCode, JSON.stringify(selectedLegends));
  }

  public getLegendState(key) {
    const selectedLegends = JSON.parse(sessionStorage.getItem(this.assetCode));
    if (selectedLegends == null) {
      return true;
    }
    for (const lg of selectedLegends) {
      if (lg === key) {
        return 'legendonly';
      }
    }
  }

  public updateTimeWindowText(timeWindowText) {
    this.layout.xaxis.title.text = `Time Window - ${timeWindowText}`;
  }

  panModeZoom(zoomOut = false) {
    // <Start> =(previous Start) + (previous Timespan in seconds) / 2 - (new Timespan in seconds) /2
    console.log('lateset payload', this.payload);
    const currentTimeWindow = Utils.getTimeWindow(this.timeWindowIndex); // in seconds
    console.log('current time window', currentTimeWindow);

    const now = moment.utc(new Date()).valueOf() / 1000.0; // in seconds
    console.log('now', now);

    let start = this.payload.start + this.payload.len / 2 - currentTimeWindow.value / 2;
    console.log('start', start);
    // <bucket> = (new Timespan in seconds) / (Max Datapoints)
    const bucket = currentTimeWindow.value / 600;
    // <length> = (new Timespan in seconds)
    const len = currentTimeWindow.value;

    if (zoomOut) {
      const totalDuration = start + len;
      console.log('totalDuration', totalDuration);
      if (start < 0 || totalDuration >= now) {
        console.log('Graph cannot be dragged in future time.');
        start = 0;
        this.panning = false;
      }
    }
    this.payload.start = start;
    this.payload.len = len;
    this.payload.bucketSize = bucket;
    console.log('final payload', this.payload);
    this.getAssetReadings(this.payload);
  }


  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself
    this.destroy$.unsubscribe();
  }
}
