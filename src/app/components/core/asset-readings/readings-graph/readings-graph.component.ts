import { Component, EventEmitter, OnDestroy, HostListener, Output, ViewChild } from '@angular/core';
import { uniq } from 'lodash';
import { interval, Subject } from 'rxjs';
import { takeWhile, takeUntil } from 'rxjs/operators';
import * as moment from 'moment';

import { AssetsService, PingService } from '../../../../services';
import { COLOR_CODES, MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
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

  layout = {
    autosize: true,
    dragmode: 'pan',
    xaxis: {
      tickformat: '%H:%M:%S'
    },
    yaxis: {
      fixedrange: true
    },
    height: 500,
    margin: {
      l: 50,
      r: 50,
      b: 30,
      t: 50,
      pad: 1
    },
  };

  config = {
    displaylogo: false,
    responsive: true,
    modeBarButtonsToRemove: ['resetScale2d', 'hoverClosestCartesian',
      'hoverCompareCartesian', 'lasso2d', 'zoom2d', 'autoScale2d',
      'toImage', 'toggleSpikelines'],
    modeBarButtonsToAdd: [[{
      name: 'autoScale2d',
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
  }

  public getAssetCode(assetCode: string) {
    this.payload.assetCode = encodeURIComponent(assetCode);
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
          this.loadPage = false;
          this.getBucketReadings(data);
        },
        error => {
          console.log('error in response', error);
        });
  }

  getBucketReadings(readings: any) {
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
        title: key,
        type: 'scatter', mode: 'lines',
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
    console.log('Read', this.numReadings);
  }

  public caluclateBucketSize(duration) {
    let bucket = Math.round(duration / 600);
    return bucket = bucket === 0 ? 1 : (bucket > 48 ? 48 : bucket);
  }

  calculateGraphData(event: any) {
    console.log('e', event);
    if (event['xaxis.range[0]'] === undefined) {
      return;
    }
    this.isAlive = false;
    console.log('start', event['xaxis.range[0]']);
    console.log('end', event['xaxis.range[1]']);

    const start = moment(event['xaxis.range[1]']).utc();
    const until = moment(event['xaxis.range[0]']).utc();
    console.log('start utc', start.format());
    console.log('end utc', until.format());

    console.log('start(unix timestamp)', moment(start.format()).valueOf() / 1000);
    console.log('end(unix timestamp)', moment(until.format()).valueOf() / 1000);

    const duration = moment.duration(start.diff(until));
    console.log('duration', duration);

    const seconds = duration.asSeconds();  // duration;

    const bucketSize = this.caluclateBucketSize(seconds);
    this.payload = {
      assetCode: encodeURIComponent(this.assetCode),
      start: moment(start.format()).valueOf() / 1000,
      len: Math.round(seconds),
      bucketSize: bucketSize
    };
    this.getAssetReadings(this.payload);
  }



  public ngOnDestroy(): void {
    this.isAlive = false;
    this.destroy$.next(true);
    // Now let's also unsubscribe from the subject itself
    this.destroy$.unsubscribe();
  }
}
