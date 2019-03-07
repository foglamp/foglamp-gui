import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class NotificationsService {
  private GET_NOTIFICATION_URL = environment.BASE_URL + 'notification';

  constructor(private http: HttpClient) { }

  getNotificationPlugins() {
    return this.http.get(this.GET_NOTIFICATION_URL + '/plugin').pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  getNotificationTypeList() {
    return this.http.get(this.GET_NOTIFICATION_URL + '/type').pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  addNotificationInstance(payload: any) {
    return this.http.post(this.GET_NOTIFICATION_URL, payload).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }
}
