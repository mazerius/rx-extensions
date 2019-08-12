import { Subject } from '../Subject';

/**
 * A variant of Subject that connects and listens to a websocket, calling next() on its subscribers
 * whenever a message is received.
 *
 * @class WebSocketListenerSubject<T>
 */
export class WebSocketListenerSubject<T> extends Subject<T> {
 address: string;
 port: string;
 protocol: string;

 constructor(address: string, port: string, path: string, protocol: string) {
    super();
    this.address = address;
    this.port = port;
    this.protocol = protocol;

    // connect to websocket
    var WebSocketClient = require('websocket').client;
    var client = new WebSocketClient();
    let input:WebSocketListenerSubject<T> = this;    
    client.on('connect', function(connection:any) {
        connection.on('error', function(error:any) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function() {
            console.log('echo-protocol Connection Closed');
        });
        connection.on('message', function(message:any) {
            input.next(message);            
        });      
    });
    client.on('connectFailed', function(error: any) {
        console.log('Connect Error: ' + error.toString());
        input.error(error);
    });
    client.connect(this.protocol + '://' + this.address + ':' + this.port + path);
  }

  
}
