import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap, take } from "rxjs/operators";
import { IDispatcherEvent } from "./event-dispatcher.interfaces";
import { v4 as uuid } from "uuid";
import { trace, empty } from "ems-web-app-utils";
import * as _ from "underscore";

@Injectable({
  providedIn: 'root'
})
export class EventDispatcherService {
  
  public jwt?: string;
  public endpoint!: string;

  constructor(private http: HttpClient) {}

  public dispatch(event: IDispatcherEvent, name?: string):Promise<any> {
    const key = `${name ?? uuid()}.json`;
    const namespace = event.namespace ? `${event.namespace}%2F` : "";
    const request = this.buildRequest(`${namespace}${key}`);
    return this.executePutRequest(request, event);
  }

  public getEventTemplate(type: string): IDispatcherEvent {
    return {
        type,
        agent: window.navigator.userAgent,
        time: (new Date()).getTime(),
        timestamp: (new Date()).toISOString(),
        properties: {}
      }
  }

  private executePutRequest(request: string, data: any, transform?: (input: any) => any, suppressErrors?: boolean, customHeaders?: any ): Promise<any> {
    const headers = this.headers(customHeaders || {});
    return this.http.put(request, data, { headers }).pipe(
      map((result: any) => 
        transform ?  transform(result) : result
      ),
      catchError(suppressErrors ? this.handleErrorQuietly : this.handleError)
    ).toPromise()
  }

  private buildRequest(endpoint: string): string {
    return `${this.endpoint}/${endpoint}`;
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(error);
  }

  private handleErrorQuietly(error: HttpErrorResponse) {
    console.error(error);
    return of(null);
  }

  private headers(custom: any = {}): HttpHeaders {
    const headers = _.extend({ 
          "Content-Type": "application/json"
       }, custom);
    return new HttpHeaders(headers);
  }
}
