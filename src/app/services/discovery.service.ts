import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { InterceptorSkipHeader } from '../services/http.request.interceptor';

@Injectable()
export class DiscoveryService {

  constructor(private http: HttpClient) { }

  /**
   *  GET  | /foglamp/discover
   */
  discover(discoveryUrl) {
    const headers = new HttpHeaders().set(InterceptorSkipHeader, '');
    return this.http.get(discoveryUrl)
      .map(response => response)
      .catch((error: Response) => Observable.throw(error));
  }
}


