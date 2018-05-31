import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';

@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {

    constructor(private router: Router) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.headers.has(InterceptorSkipHeader)) {
            const headers = req.headers.delete(InterceptorSkipHeader);
            return next.handle(req.clone({ headers }));
        } else {
            if (sessionStorage.getItem('token') != null) {
                req = req.clone({
                    setHeaders: {
                        authorization: sessionStorage.getItem('token')
                    }
                });
            }
            return next.handle(req).map((event: HttpEvent<any>) => {
                return event;
            }).catch((err: any, caught) => {
                if (err instanceof HttpErrorResponse) {
                    if (err.status === 401) {
                        sessionStorage.clear();
                        this.router.navigate(['/login']);
                    }
                    return Observable.throw(err);
                }
            });
        }
    }
}
