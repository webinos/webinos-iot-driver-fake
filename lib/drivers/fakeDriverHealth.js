/*******************************************************************************
 *  Code contributed to the webinos project
 * 
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * Copyright 2013 Telecom Italia SpA
 * 
 ******************************************************************************/


(function () {
    'use strict';

    var driverId = null;
    var registerFunc = null;
    var removeFunc = null;
    var callbackFunc = null;

    var elementsList = new Array;

    elementsList[0] = {
        'type': 'bloodpressure',
        'name': 'Fake bloodpressure sensor',
        'description': 'Fake bloodpressure sensor',
        'sa': 0,
        'interval': 1000,
        'value': 120,
        'running': false,
        'incUnit': 1,
        'maxVal': 200,
        'minVal': 40,
        'maxInit': 140,
        'minInit': 100,
        'id': 0
    };

    elementsList[1] = {
        'type': 'bloodsugar',
        'name': 'Fake bloodsugar sensor',
        'description': 'Monitors bloodsugar',
        'sa': 0,
        'interval': 3000,
        'value': 5.0,
        'running': false,
        'incUnit': 0.1,
        'maxVal': 8.0,
        'minVal': 4.0,
        'maxInit': 6.0,
        'minInit': 4.5,
        'id': 0
    };

    elementsList[2] = {
        'type': 'temperature',
        'name': 'Fake temperature sensor',
        'description': 'Monitors human body temperature',
        'sa': 0,
        'interval': 2300,
        'value': 37.0,
        'running': false,
        'incUnit': 0.1,
        'maxVal': 41.0,
        'minVal': 34.0,
        'maxInit': 38.5,
        'minInit': 36.3,
        'id': 0
    };

    elementsList[3] = {
        'type': 'heartratemonitor',
        'name': 'Fake heartrate sensor',
        'description': 'Monitors heartrate',
        'sa': 0,
        'interval': 1800,
        'value': 70,
        'running': false,
        'incUnit': 1,
        'maxVal': 110,
        'minVal': 40,
        'maxInit': 80,
        'minInit': 60,
        'id': 0
    };

    elementsList[4] = {
        'type': 'weightscale',
        'name': 'Fake weight sensor',
        'description': 'Monitors baby weight',
        'sa': 0,
        'interval': 1300,
        'value': 3.5,
        'running': false,
        'incUnit': 0.1,
        'maxVal': 10.0,
        'minVal': 2.5,
        'maxInit': 5.0,
        'minInit': 2.5,
        'id': 0
    };


    exports.init = function(dId, regFunc, remFunc, cbkFunc) {
        console.log('Fake driver health init - id is '+dId);
        driverId = dId;
        registerFunc = regFunc;
        removeFunc = remFunc;
        callbackFunc = cbkFunc;
        intReg();
    };


    exports.execute = function(cmd, eId, data, errorCB, successCB) {
        //console.log('Fake driver 1 data - element is '+eId+', data is '+data);
        switch(cmd) {
            case 'cfg':
                //In this case cfg data are transmitted to the sensor/actuator
                //this data is in json(???) format
                console.log('Fake driver health - Received cfg for element '+eId+', cfg is '+ JSON.stringify(data));
                var index = -1;
                for(var i in elementsList) {
                    if(elementsList[i].id == eId)
                        index = i;
                }; 
                elementsList[index].interval = data.rate;
                successCB(eId);
                break;
            case 'start':
                //In this case the sensor should start data acquisition
                console.log('Fake driver health - Received start for element '+eId+', mode is '+data);
                var index = -1;
                for(var i in elementsList) {
                    if(elementsList[i].id == eId){
                        index = i;
                    }
                };                
                console.log(elementsList[index]);
                console.log(JSON.stringify(elementsList[index]));
                elementsList[index].running = true;
                dataAcquisition(index);
                break;
            case 'stop':
                //In this case the sensor should stop data acquisition
                //the parameter data can be ignored
                console.log('Fake driver health - Received stop for element '+eId);
                var index = -1;
                for(var i in elementsList) {
                    if(elementsList[i].id == eId)
                        index = i;
                };
                elementsList[index].running = false;
                break;
            case 'value':
                //In this case the actuator should store the value
                //the parameter data is the value to store
                
                var index = -1;
                for(var i in elementsList) {
                    if(elementsList[i].id == eId)
                        index = i;
                };
                console.log('Fake driver health - Received value for element '+elementsList[index].id+'; value is '+data.actualValue);
                callbackFunc('data', elementsList[index].id, data);
                
                break;
            default:
                console.log('Fake driver health - unrecognized cmd');
        }
    }


    function intReg() {
        console.log('\nFake driver health - register new elements');
        for(var i in elementsList) {
            var json_info = {type:elementsList[i].type, name:elementsList[i].name, description:elementsList[i].description, range:elementsList[i].range};
            elementsList[i].id = registerFunc(driverId, elementsList[i].sa, json_info);
            //elementsList[i].id = registerFunc(driverId, elementsList[i].sa, elementsList[i].type);
            elementsList[i].value = rndInit(elementsList[i]);
        };
    }


    function dataAcquisition(index) {
        //If not stopped send data and call again after interval...
        if(elementsList[index].running) {
            //Send data value...
            callbackFunc('data', elementsList[index].id, elementsList[index].value);
            nextValue(index);
            setTimeout(function(){dataAcquisition(index);}, (elementsList[index].interval));
        }
    }


    function nextValue(index) {
        elementsList[index].value+=(incDec()*elementsList[index].incUnit);
        if(elementsList[index].value < elementsList[index].minVal) {
            elementsList[index].value = elementsList[index].minVal;
        }
        else if(elementsList[index].value > elementsList[index].maxVal) {
            elementsList[index].value = elementsList[index].maxVal;
        }
    }


    function incDec() {
        var upProb = 25;
        var downProb = 25;
        var rnd = Math.floor(Math.random()*100);
        if (rnd < downProb) {
            return -1;
        }
        else if (rnd > (100-upProb)) {
            return 1;
        }
        else {
            return 0;
        }
    }


    function rndInit(el) {
        var minRange = (el.value - el.minInit)/el.incUnit;
        var maxRange = (el.maxInit - el.value)/el.incUnit;
        if(minRange < 0) {
            minRange = 0;
        }
        if(maxRange < 0) {
            maxRange = 0;
        }
        var minRnd = Math.floor(Math.random()*minRange)*el.incUnit;
        var maxRnd = Math.floor(Math.random()*maxRange)*el.incUnit;
        var res = el.value-minRnd+maxRnd;
        console.log(' --> rnd init: minRnd is '+minRnd+', maxRnd is '+maxRnd+', res is '+res);
        return res;
    }


}());
