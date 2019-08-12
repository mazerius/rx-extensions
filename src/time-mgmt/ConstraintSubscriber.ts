import {Subscriber} from '../Subscriber';
import {Message} from '../types';
//import {Context} from '..//types';
import { default as configuration } from './config';
import * as util from 'util'; // has no default export

let request = require('request');

/**
 *
 * A class responsible for encapsulating a completeness constraint, which is registered to Khronos.
 * @class ConstraintSubscriber<T>
 */

export class ConstraintSubscriber<T> extends Subscriber<Message<T>> {

  constraint: number;
  device_key: string;
  id: string;
  threshold: number;
  khronos_url: string;

  constructor(device_key: string, constraint: number, threshold: number = 0.99999, destinationOrNext?: (value: Message<T>) => void,
              error?: (e?: any) => void,
              complete?: () => void,
              timeOut?: (value: Message<T>) => void,
              violation?: (value: Message<T>) => void) {
    /** necessary to coordinate between 'next', 'timeOut' and 'violation' event calls */
    function branch(value?: Message<T>): void {
      var context = (value as any).type;
      if (context == 'timeout') {
        timeOut(value);
      } else if (context == 'violation') {
        violation(value);
      } else {
          destinationOrNext(value);
      }
    }
    super(branch, error, complete);
    this.constraint = constraint;
    this.device_key = device_key;
    this.threshold = threshold;
    this.khronos_url = 'http://' + configuration['khronos']['address'] + ':' + configuration['khronos']['port'];
    this.registerConstraint();
  }

    /** registers this constraint to Khronos middleware. */
     registerConstraint(): void {
       let self = this;
       let r = request({ url: self.khronos_url + '/registerCompletenessConstraint/' + self.convertDeviceKeyToURL() + '/' + self.getConstraint().toString() + '/' + self.getThreshold().toString(), method: 'PUT'}, function(err: any, res: any, data: any) {
           if (!err && res.statusCode == 200) {
               // receive ID from Khronos for this subscriber.
               self.setID(data);
           } else {
             console.error(err);
             console.log('ERROR: Registering constraint ' + self.getConstraint() + ' for ' + self.getDeviceKey() + ' failed.');
           }
       });
      }

  getConstraint(): number {
    return this.constraint;
  }

  getDeviceKey(): string {
    return this.device_key;
  }

  getThreshold(): number {
    return this.threshold;
  }

  getID(): string {
    return this.id;
  }

  setID(id: string): void {
    this.id = id;
    }

  /** helper function to convert device_key to URL valid format */
  convertDeviceKeyToURL(): string {
    let pid1 = this.device_key.split('/')[0];
    let pid2 = this.device_key.split('/')[1].split(':')[0];
    let mac = this.device_key.split(':')[1].split('|')[0];
    let measurement = this.device_key.split('|')[1];
    return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
  }
}
