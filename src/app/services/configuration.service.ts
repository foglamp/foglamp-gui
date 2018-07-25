import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class ConfigurationService {
    // private instance variable to hold base url
    private CATEGORY_URL = environment.BASE_URL + 'category';
    constructor(private http: HttpClient) { }

    /**
     *   GET  | /foglamp/category
     */
    getCategories() {
        return this.http.get(this.CATEGORY_URL).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }

    /**
     *   GET  | /foglamp/category/{category_name}
     */
    getCategory(category_name) {
        const categoryName = encodeURIComponent(category_name);
        return this.http.get(this.CATEGORY_URL + '/' + categoryName).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }

    /**
    *  PUT  | /foglamp/category/{category_name}/{config_item}
    */
    saveConfigItem(category_name: string, config_item: string, value: string, type: string) {
        const categoryName = encodeURIComponent(category_name);
        let body = JSON.stringify({ 'value': value });
        if (type.toUpperCase() === 'JSON') {
            body = JSON.stringify({ 'value': value });
        }
        return this.http.put(this.CATEGORY_URL + '/' + categoryName + '/' + config_item, body).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }

    /**
    *  POST  | /foglamp/category/{category_name}/{config_item}
    */
    addNewConfigItem(configItemData, category_name: string, config_item: string) {
        const categoryName = encodeURIComponent(category_name);
        return this.http.post(this.CATEGORY_URL + '/' + categoryName + '/' + config_item, configItemData).pipe(
            map(response => response),
            catchError((error: Response) => observableThrowError(error)));
    }
}
