# Extensions that integrate RxJS with the time management functionality of Khronos (https://github.com/mazerius/khronos)

This project is the software implementation of the reactive extensions proposed in [1]. 
These extensions remove the need for static signal timeout specification at compile time, thus simplifying time management and facilitating the development of CPS applications. 
More concretely, the proposed extensions utilize Khronos [2] to provide developers with language support to precisely trade off timeliness versus completeness of the data produced by the underlying CPS infrastructure in their reactive programs.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

1. Clone Khronos from repository: https://github.com/mazerius/khronos

2. Start Khronos
```
$ python3 khronos.py, located in /src
```
3. Start GatewayManager, located in /src/cps_communication
```
$ python3 GatewayManager.py
```
4. $ Open a terminal and navigate to ~/rx-extensions/examples/
```
$ cd /rx-extensions/examples/
```

5. Start the example application
```
$ npm start
```

### Prerequisites


```
Python3.6
Node.js
```


## Deployment

GatewayManager is currently the only component that can be deployed on a different device than the rest of the middleware. 

Make sure to configure gm_config.json, general_config.json correctly by assigning the IP address and port of the device(s) involved in the deployment. 

In these configuration files there are three devices: gateway, gateway_manager and khronos. 

The template assumes that gateway_manager and khronos run on the same device. If not, reconfigure the .json files with the corresponding IP address and port number of each device.

The implementation assumes a gateway that provides a websocket that forwards all incoming sensor data from the CPS network. 


## Authors

**Stefanos Peros** 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## References

[1]. Waiting for proceedings. 

## Data Sets
The data sets used for the evaluation of Khronos, discussed in [1], can be downloaded from: https://ufile.io/g3tvehcw
# rx-extensions
