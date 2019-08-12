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

Make sure to properly configure config.js, located in ~/rx-extensions/cjs/src/internal/time-mgmt, with the correct IP address and PORT numbers of Khronos.


## Authors

**Stefanos Peros** 

## License

This project is licensed under the Apache License - see the [LICENSE.md](LICENSE.md) file for details

## References

[1]. Waiting for proceedings. 
[2]. Peros, Stefanos & Stéphane, Delbruel & Michiels, Sam & Joosen, Wouter & Hughes, Danny. (2019). Khronos: Middleware for Simplified Time Management in CPS. 127-138. 10.1145/3328905.3329507. 
