import {Subscriber} from '../Subscriber';
import {Message, Context} from '../types';
import { default as configuration } from './config';
let request = require('request');

/**
 * 
 * A class responsible for encapsulating a static timeout, which is registered to Khronos.
 *
 * @class StaticTimeoutSubscriber<T>
 */

export class StaticTimeoutSubscriber<T> extends Subscriber<Message<T>> {

  static_timeout: number;
  device_key: string;
  id: string;
  khronos_url: string;

  constructor(device_key: string, static_timeout: number, destinationOrNext?: (value: Message<T>) => void,
              error?: (e?: any) => void,
              complete?: () => void,
              timeOut?: (value?: Message<T>) => void) {

    // necessary to de-multiplex the next call, based on given 'context'.
    function branch(value?: Message<T>, context?: Context): void {
      if (context == 'timeout') {
          timeOut(value);
      } else {
          destinationOrNext(value);
      }
    }
    super(branch, error, complete);
    this.static_timeout = static_timeout;
    this.device_key = device_key;
    this.khronos_url = 'http://' + configuration['khronos']['address'] + ':' + configuration['khronos']['port'];
    this.registerStaticTimeout();
  }

  /** registers this static timeout to Khronos middleware. */
  registerStaticTimeout() {
    let self = this;
    let r = request({ url: self.khronos_url + '/registerTimeout/' + self.convertDeviceKeyToURL() + '/' + self.getStaticTimeout(), method: 'PUT'}, function(err: any, res: any, data: any) {
        if (!err && res.statusCode == 200) {
          self.setID(data);
        }
    });
  }

  getStaticTimeout(): number {
    return this.static_timeout;
  }

  setID(id: string): void {
    this.id = id;
  }

  getID(): string {
    return this.id;
  }

  convertDeviceKeyToURL(): string {
    let pid1 = this.device_key.split('/')[0];
    let pid2 = this.device_key.split('/')[1].split(':')[0];
    let mac = this.device_key.split(':')[1].split('|')[0];
    let measurement = this.device_key.split('|')[1];
    return pid1 + '/' + pid2 + '/' + mac + '/' + measurement;
  }

}
