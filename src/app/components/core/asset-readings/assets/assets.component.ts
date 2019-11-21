import { UnsubscribeOnDestroyAdapter } from './../../../../unsubscribe-on-destroy-adapter';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { orderBy } from 'lodash';
import { interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

import { AlertService, AssetsService, PingService, GenerateCsvService } from '../../../../services';
import { MAX_INT_SIZE, POLLING_INTERVAL } from '../../../../utils';
import { ReadingsGraphComponent } from '../readings-graph/readings-graph.component';

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.css']
})
export class AssetsComponent extends UnsubscribeOnDestroyAdapter implements OnInit, OnDestroy {

  selectedAsset: any; // Selected asset object (assetCode, count)
  MAX_RANGE = MAX_INT_SIZE / 2;
  assets = [];
  public refreshInterval = POLLING_INTERVAL;
  public showSpinner = false;
  private isAlive: boolean;
  assetReadings = [];

  @ViewChild(ReadingsGraphComponent, { static: true }) readingsGraphComponent: ReadingsGraphComponent;

  constructor(private assetService: AssetsService,
    private alertService: AlertService,
    private generateCsvService: GenerateCsvService,
    private ping: PingService) {
    super();
    this.isAlive = true;
    this.subs.sink = this.ping.pingIntervalChanged.subscribe((timeInterval: number) => {
      if (timeInterval === -1) {
        this.isAlive = false;
      }
      this.refreshInterval = timeInterval;
    });
  }

  ngOnInit() {
    this.showLoadingSpinner();
    this.getAsset();
    this.subs.sink = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive)) // only fires when component is alive
      .subscribe(() => {
        this.getAsset();
      });
  }

  public getAsset(): void {
    this.subs.sink = this.assetService.getAsset().
      subscribe(
        (data: any[]) => {
          this.assets = data;
          this.assets = orderBy(this.assets, ['assetCode'], ['asc']);
          if (this.selectedAsset) {
            this.selectedAsset = this.assets.find(a => a.assetCode === this.selectedAsset.assetCode);
          }
          this.hideLoadingSpinner();
        },
        error => {
          this.hideLoadingSpinner();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getAssetReadings(assetCode, recordCount) {
    this.assetReadings = [];
    const fileName = assetCode + '-readings';
    if (recordCount === 0) {
      this.alertService.error('No reading to export.', true);
      return;
    }
    this.alertService.activityMessage('Exporting readings to ' + fileName, true);
    let limit = recordCount;
    let offset = 0;
    let isLastRequest = false;
    if (recordCount > this.MAX_RANGE) {
      let chunkCount;
      let lastChunkLimit;
      limit = this.MAX_RANGE;
      chunkCount = Math.ceil(recordCount / this.MAX_RANGE);
      lastChunkLimit = (recordCount % this.MAX_RANGE);
      if (lastChunkLimit === 0) {
        lastChunkLimit = this.MAX_RANGE;
      }
      for (let j = 0; j < chunkCount; j++) {
        if (j !== 0) {
          offset = (this.MAX_RANGE * j);
        }
        if (j === (chunkCount - 1)) {
          limit = lastChunkLimit;
          isLastRequest = true;
        }
        this.exportReadings(assetCode, limit, offset, isLastRequest, fileName);
      }
    } else {
      this.exportReadings(assetCode, limit, offset, true, fileName);
    }
  }

  exportReadings(assetCode: any, limit: number, offset: number, lastRequest: boolean, fileName: string) {
    this.subs.sink = this.assetService.getAssetReadings(encodeURIComponent(assetCode), limit, offset).
      subscribe(
        (data: any[]) => {
          data = data.map(r => {
            return r;
          });
          this.assetReadings = this.assetReadings.concat(data);
          if (lastRequest === true) {
            this.generateCsvService.download(this.assetReadings, fileName, 'asset');
          }
        },
        error => {
          console.log('error in response', error);
        });
  }

  /**
  * Open asset chart modal dialog
  */
  public showAssetChart(assetCode) {
    this.readingsGraphComponent.getAssetCode(assetCode);
    this.readingsGraphComponent.toggleModal(true);
  }

  public showLoadingSpinner() {
    this.showSpinner = true;
  }

  public hideLoadingSpinner() {
    this.showSpinner = false;
  }

  onNotify(event) {
    this.isAlive = event;
    this.subs.sink = interval(this.refreshInterval)
      .pipe(takeWhile(() => this.isAlive)) // only fires when component is alive
      .subscribe(() => {
        this.getAsset();
      });
  }

  public ngOnDestroy(): void {
    this.isAlive = false;
  }
}
