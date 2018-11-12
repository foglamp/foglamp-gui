import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
    return this.http.get(this.GET_ASSET).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  /**
  *  /foglamp/asset/{assetCode}
  * @param assetCode
  * @param limit
  *  Return a set of asset readings for the given asset code
  */
  public getAssetReadings(assetCode, limit: number = 0, time: number = 0) {
    let params = new HttpParams();
    if (+time !== 0) {
      params = params.append('seconds', time.toString());
    }
    if (+limit !== 0) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(this.GET_ASSET + '/' + assetCode, { params: params }).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  /**
  *  foglamp/{assetCode}/summary
  *  @param assetCode
  *  Return a set of readings summary for the given asset code
  */
  public getAllAssetSummary(assetCode: string, limit: Number = 0, time: Number = 0) {
    let params = new HttpParams();
    if (+time !== 0) {
      params = params.append('seconds', time.toString());
    }
    if (+limit !== 0) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetCode) + '/summary', { params: params }).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  public getReadings(assetCode: string) {
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetCode)).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  public getAssetAverage(assetCode: string, reading: string, group, time) {
    let params = new HttpParams();
    params = params.append('group', group);
    params = params.append(group, time);
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetCode) + '/' + encodeURIComponent(reading) + '/series',
    { params: params }).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }
}
