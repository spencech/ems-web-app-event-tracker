import { Component, OnInit, Input, Output } from '@angular/core';
import { EventDispatcherService } from "./event-dispatcher.service";
import { IDispatcherEvent } from "./event-dispatcher.interfaces";
import { v4 as uuid } from "uuid";
import { trace, empty } from "ems-web-app-utils";

@Component({
  selector: 'event-dispatcher',
  template: '',
  styles: [
  ]
})
export class EventDispatcherComponent implements OnInit {

  @Input("endpoint") endpoint!: string;
  @Input("sessionLimit") limit: number = 1800000; //30m

  private _queue: {event: IDispatcherEvent, name?: string}[] = [];
  private _processing: boolean = false;
  private _sessionId!: string;
  
  constructor(private service: EventDispatcherService) {}

  ngOnInit(): void {
    this.service.endpoint = this.endpoint;
    this._sessionId = this.determineSessionId();
    window.localStorage.setItem("ems_et_sessionId", this._sessionId);
    window.setInterval(this.updateSession, 1000);
  }

  public dispatch(event: IDispatcherEvent, name?: string): any {
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
    this._processing = false;
    this.processQueue(); 
  }

  private determineSessionId() {
    const sessionTimestamp = parseInt(window.localStorage.getItem("ems_et_sessionTime") ?? "");
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
    //question: do we want to expire this after a period of inactivity? e.g., open tab.
    const timestamp = (new Date()).getTime();
    window.localStorage.setItem("ems_et_sessionTime", timestamp.toString());
    window.localStorage.setItem("ems_et_sessionId", this._sessionId);
  }

}
