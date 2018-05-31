import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';

@Injectable()
export class AssetsService {
  private GET_ASSET = environment.BASE_URL + 'asset';

  constructor(private http: HttpClient) { }

  /**
  * GET  | foglamp/asset
  * Return a summary count of all asset readings
  */
  public getAsset() {
    return this.http.get(this.GET_ASSET)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  /**
  *  /foglamp/asset/{assetCode}
  * @param assetCode
  * @param limit
  * @param offset
  *  Return a set of asset readings for the given asset code
  */
  public getAssetReadings(assetCode, limit: Number = 0, offset: Number = 0) {
    let params = new HttpParams();
    if (limit && offset) {
      params = params.set('limit', limit.toString());
      params = params.set('skip', offset.toString());
    } else if (limit) {
      params = params.set('limit', limit.toString());
    } else if (offset) {  // offset works withOUT limit in postgres!
      params = params.set('skip', offset.toString());
    }

    return this.http.get(this.GET_ASSET + '/' + assetCode, { params: params })
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  public getAssetSummary(assetObject: any) {
    let params = new HttpParams();
    if (assetObject.time !== undefined) {
      const keys = Object.keys(assetObject.time);
      params = params.set(keys[0], assetObject.time[keys[0]]);
    }
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetObject.assetCode)
      + '/' + assetObject.reading + '/summary', { params: params })
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }

  // TODO: Not in use yet
  public getAssetAverage(assetObject: any) {
    // TODO: time based readings average;
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetObject.assetCode) + '/' + assetObject.reading + '/series')
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}
