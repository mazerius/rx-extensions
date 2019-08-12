import {Subject} from '../Subject';
import {WebSocketListenerSubject} from './WebSocketListenerSubject';
import { ObjectUnsubscribedError } from '../util/ObjectUnsubscribedError';
import { ConstraintSubscriber } from './ConstraintSubscriber';
import { StaticTimeoutSubscriber } from './StaticTimeoutSubscriber';
import { Subscription } from '../Subscription';
import { Subscriber } from '../Subscriber';
import { SubjectSubscription } from '../SubjectSubscription';
import { default as configuration } from './config';
import { Message} from '../types';
let request = require('request');
import * as util from 'util'; // has no default export
import { inspect } from 'util'; // or directly
//import { AdapterSubscriber } from './AdapterSubscriber';

/**
 * A variant of Subject that connects to Khronos and parses incoming events, 
 * propagating them to this object's subscribers.
 *
 * @class OrchestratorSubject<T>
 */

export class OrchestratorSubject<T> extends Subject<Message<T>> {

  khronos_url: string;
  observers: Subscriber<Message<T>>[] = [];
 
    constructor() {
       super();
       const ws_subject = new WebSocketListenerSubject(configuration['khronos']['address'], configuration['khronos']['port'], '/khronos', 'ws');
       let self: OrchestratorSubject<T> = this;
       ws_subject.subscribe({
        next: (v: any) => {self.next(v); }
      });
    }

     next(message?: Message<T>) {
      if (this.closed) {
        throw new ObjectUnsubscribedError();
      }
      if (!this.isStopped) {
        const { observers } = this;
        const len = observers.length;
        const copy = observers.slice();
        message = this.parseMessage(message);
        for (let i = 0; i < len; i++) {
          if (this.containsID(copy[i], message.id)) {
              copy[i].next(message);
            }
          }
      }
    }

     containsID(subscriber: Subscriber<Message<T>>, id: string): boolean {
       //console.log(util.inspect(subscriber));
       if (subscriber instanceof ConstraintSubscriber || subscriber instanceof StaticTimeoutSubscriber) {
         //console.log('constraint subscriber!');
         //console.log('subscriber.getID()' + subscriber.getID());
         //console.log('id' + id);
        return subscriber.getID() == id;
       }
       if (subscriber.getDestination() == undefined) {
         //console.log('undefined destination!')
         return false;
       } else {
         //console.log('recursion')
         return this.containsID(subscriber.getDestination() as Subscriber<Message<T>>, id);
       }
     }

      parseMessage(message: any): Message<T> {
        //console.log('Orchestrator.parseMessage')
        let tmp = {};
        let data = JSON.parse(message.utf8Data);
        for (let key in data) {
          if (data.hasOwnProperty(key)) {
            let new_key = key.replace(/\\"/g, '"');
            tmp[new_key] = data[key];
          }
        }
        let result: Message<T> = {id: tmp['id'], value: tmp['value'], completeness: tmp['completeness'], timeOut: tmp['timeOut'], timestamp: tmp['timestamp'], type: tmp['type']};
        return result;
      }

    /** @deprecated This is an internal implementation detail, do not use. */
    _subscribe(subscriber: Subscriber<Message<T>>): Subscription {
      if (this.closed) {
        throw new ObjectUnsubscribedError();
      } else if (this.hasError) {
        subscriber.error(this.thrownError);
        return Subscription.EMPTY;
      } else if (this.isStopped) {
        subscriber.complete();
        return Subscription.EMPTY;
      } else {
        this.observers.push(subscriber);
        }
        return new SubjectSubscription(this, subscriber);
      }

  
    convertDeviceKeyToURL(device_key: string): string {
      let pid1 = device_key.split('/')[0];
      let pid2 = device_key.split('/')[1].split(':')[0];
      let mac = device_key.split(':')[1].split('|')[0];
      let measurement = device_key.split('|')[1];
      return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
    }

}
