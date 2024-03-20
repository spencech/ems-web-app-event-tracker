import { Component, OnInit, Input, Output } from '@angular/core';
import { EventDispatcherService } from "./event-dispatcher.service";
import { v4 as uuid } from "uuid";
import { trace, empty } from "ems-web-app-utils";

@Component({
  selector: 'event-dispatcher',
  template: '<div id="event-dispatcher"></div>',
  styles: [
  ]
})
export class EventDispatcherComponent implements OnInit {

  @Input("endpoint") endpoint!: string;
  @Input("session") session?: any;
  @Input("token") token?: string;
  @Input("sessionLimit") limit: number = 1800000; //30m

  private _queue: any[] = [];
  private _processing: boolean = false;
  private _tokenId: string;
  private _sessionId!: string;
  
  constructor(private service: EventDispatcherService) {
   
  }

  ngOnInit(): void {
    this.service.jwt = this.session?.idToken.jwtToken ?? this.token;
    this.service.endpoint = this.endpoint;
    trace(this.service.jwt, this.session)
    this._tokenId = this.session?.idToken.payload.jti ?? this.token;
    this._sessionId = this.determineSessionId();
    window.localStorage.setItem("ems_et_sessionId", this._sessionId);
    window.setInterval(this.updateSession, 1000);
  }

  public dispatch(event: any, name?: string): any {
    event.sessionId = this._sessionId;
    this._queue.push({ event, name });
    this.processQueue();
    return event;
  }

  private async processQueue() {
    if(this._processing) return;
    this._processing = true;

    const obj = this._queue.shift();
    if(!obj) {
      this._processing = false;
      return;
    }

    await this.service.dispatch(obj.event, obj.name);
    this.processQueue(); 
  }

  private determineSessionId() {
    const sessionTimestamp = parseInt(window.localStorage.getItem(this._tokenId) ?? "");
    const sessionId = window.localStorage.getItem("ems_et_sessionId");
    const now = (new Date()).getTime();

    if(!isNaN(sessionTimestamp) && !empty(sessionId) && this.stillInSession(now, sessionTimestamp)) {
      return sessionId!;
    }
    
    return uuid();
  }

  private stillInSession(time1: number, time2: number) {
    return Math.abs(time1 - time2) < this.limit;
  }

  private updateSession = () => {
    const timestamp = (new Date()).getTime();
    window.localStorage.setItem(this._tokenId, timestamp.toString());
  }

}
