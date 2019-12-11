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

  panning = false;
  zoom = false;
  layout = {
    title: 'Current Data Mode',
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

  timeWindowIndex = 23;  // initial value is 23rd index i.e 720s
  config = {
    displaylogo: false,
    displayModeBar: true,
    modeBarButtonsToRemove: ['resetScale2d', 'hoverClosestCartesian',
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
          if (this.timeWindowIndex <= 23) {  // TODO: FOGL-3516 Add sub-second granularity to time bucket size
            console.log('minimum zoom level reached');
            return;
          }
          this.timeWindowIndex--;
          console.log('zoom in clicked', this.timeWindowIndex);
          if (!this.panning) {
            const timeWindow = Utils.getTimeWindow(this.timeWindowIndex);
            this.updateGraphTitle(timeWindow.key);
            this.zoomGraph(timeWindow.value);
          }
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
          if (this.timeWindowIndex >= 38) {
            console.log('maximum zoom level reached');
            return;
          }
          this.timeWindowIndex++;
          console.log('zoom out clicked', this.timeWindowIndex);
          if (!this.panning) {
            const timeWindow = Utils.getTimeWindow(this.timeWindowIndex);
            this.updateGraphTitle(timeWindow.key);
            this.zoomGraph(timeWindow.value);
          }
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
          this.isAlive = true;
          this.resetGraphToDefault();
          if (this.assetCode !== undefined) {
            this.getAssetCode(this.assetCode);
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
    this.timeWindowIndex = 23;
    this.panning = false;
    this.zoom = false;
    // reset payload to default
    this.payload = {
      assetCode: this.assetCode,
      start: 0,
      len: 600,
      bucketSize: 1
    };
    const Plotly = this.plotly.getPlotly();
    Plotly.relayout(this.assetChart.plotEl.nativeElement, {
      'xaxis.autorange': true,
      'yaxis.autorange': true
    });
    this.updateGraphTitle('10 mins');
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
      this.numReadings.push({
        x: uniq(output['timestamp'], 'timestamp'),
        y: output[key],
        type: 'scatter',
        mode: 'lines',
        name: key,
        marker: {
          color: this.getColorCode(key.trim(), count, false)
        },
        modeBarButtons: [{
          displaylogo: false
        }]
      });
      count++;
    }
    if (this.zoom) {
      const timestamps = uniq(output['timestamp'], 'timestamp');
      this.updateZoomGraph(timestamps);
    }
  }

  public updateZoomGraph(timestamps: any) {
    console.log('update zoom graph');
    const now = moment.utc(new Date()).valueOf() / 1000.0; // in seconds
    const graphStartTimeSeconds = this.payload.start === 0 ? (now - this.payload.len) : this.payload.start;
    const graphStartDateTime = moment(graphStartTimeSeconds * 1000).format('YYYY-M-D H:mm:ss');
    const Plotly = this.plotly.getPlotly();
    Plotly.relayout(this.assetChart.plotEl.nativeElement,
      'xaxis.range', [graphStartDateTime, timestamps[0]]);
  }

  public zoomGraph(seconds: number) {
    this.zoom = true;
    const maxDataPoints = 600;
    const bucket = seconds / maxDataPoints;
    const length = seconds;
    console.log(' Bucket = ', bucket, ' length = ', length);
    this.payload = {
      assetCode: this.assetCode,
      start: 0,
      len: length,
      bucketSize: bucket
    };
    this.getAssetReadings(this.payload);
  }

  dragGraph(event: any) {
    if (event['xaxis.range[0]'] === undefined) {
      return;
    }

    // console.log('payload', this.payload);
    this.panning = true;
    this.isAlive = false;
    const maxDataPoints = 600;
    const panClickTime = moment(event['xaxis.range[0]']).utc();
    const panReleaseTime = moment(event['xaxis.range[1]']).utc();

    console.log('Pan Click Time ', event['xaxis.range[0]']);
    console.log('Pan Release Time ', event['xaxis.range[1]']);

    console.log('panClickTime utc', panClickTime.format());
    console.log('panReleaseTime utc', panReleaseTime.format());

    // console.log('panClickTime(unix timestamp)', moment(panClickTime.format()).valueOf() / 1000);
    // console.log('panReleaseTime(unix timestamp)', moment(panReleaseTime.format()).valueOf() / 1000);

    const panDeltaTime = moment.duration(panReleaseTime.diff(panClickTime)).asSeconds();
    console.log('panDeltaTime', panDeltaTime);

    const now = moment.utc(new Date()).valueOf() / 1000.0; // in seconds
    console.log('now', now);

    const currentTimeWindow = Utils.getTimeWindow(this.timeWindowIndex); // in seconds
    console.log('current time window', currentTimeWindow);

    this.updateGraphTitle(currentTimeWindow.key);

    const start = now - currentTimeWindow.value - panDeltaTime;
    console.log('start', start);

    const bucket = currentTimeWindow.value / maxDataPoints;
    console.log('bucket', bucket);

    this.payload = {
      assetCode: this.assetCode,
      start: start,
      len: currentTimeWindow.value,
      bucketSize: bucket
    };
    this.getAssetReadings(this.payload);
  }

  public updateGraphTitle(timeWindowText) {
    this.layout.xaxis.title.text = `Time Window - ${timeWindowText}`;
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself
    this.destroy$.unsubscribe();
  }
}
