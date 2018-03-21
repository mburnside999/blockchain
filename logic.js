/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A shipment has been received by an importer
 * @param {org.acme.shipping.perishable.ShipmentReceived} shipmentReceived - the ShipmentReceived transaction
 * @transaction
 */
function payOut(shipmentReceived) {

    var contract = shipmentReceived.shipment.contract;
    var shipment = shipmentReceived.shipment;
    var payOut = contract.unitPrice * shipment.unitCount;

    console.log('Received at: ' + shipmentReceived.timestamp);
    console.log('Contract arrivalDateTime: ' + contract.arrivalDateTime);

    // set the status of the shipment
    shipment.status = 'ARRIVED';

  var factory = getFactory();
    var shipmentEvent = factory.newEvent('org.acme.shipping.perishable', 'ShipmentEvent');
    shipmentEvent.shipmentId=shipment.shipmentId;
    shipmentEvent.shipmentStatus='ARRIVED';
    shipmentEvent.description='Shipment arrived';
    emit(shipmentEvent);




    // if the shipment did not arrive on time the payout is zero
    if (shipmentReceived.timestamp > contract.arrivalDateTime) {
        payOut = 0;
        console.log('Late shipment');
    } else {
        // find the lowest temperature reading
        if (shipment.temperatureReadings) {
            // sort the temperatureReadings by centigrade
            shipment.temperatureReadings.sort(function (a, b) {
                return (a.centigrade - b.centigrade);
            });
            var lowestReading = shipment.temperatureReadings[0];
            var highestReading = shipment.temperatureReadings[shipment.temperatureReadings.length - 1];
            var penalty = 0;
            console.log('Lowest temp reading: ' + lowestReading.centigrade);
            console.log('Highest temp reading: ' + highestReading.centigrade);

            // does the lowest temperature violate the contract?
            if (lowestReading.centigrade < contract.minTemperature) {
                penalty += (contract.minTemperature - lowestReading.centigrade) * contract.minPenaltyFactor;
                console.log('Min temp penalty: ' + penalty);
            }

            // does the highest temperature violate the contract?
            if (highestReading.centigrade > contract.maxTemperature) {
                penalty += (highestReading.centigrade - contract.maxTemperature) * contract.maxPenaltyFactor;
                console.log('Max temp penalty: ' + penalty);
            }

            // apply any penalities
            payOut -= (penalty * shipment.unitCount);

            if (payOut < 0) {
                payOut = 0;
            }
        }
    }

    console.log('Payout: ' + payOut);
    contract.grower.accountBalance += payOut;
    contract.importer.accountBalance -= payOut;

    console.log('Grower: ' + contract.grower.$identifier + ' new balance: ' + contract.grower.accountBalance);
    console.log('Importer: ' + contract.importer.$identifier + ' new balance: ' + contract.importer.accountBalance);

    return getParticipantRegistry('org.acme.shipping.perishable.Grower')
        .then(function (growerRegistry) {
            // update the grower's balance
            return growerRegistry.update(contract.grower);
        })
        .then(function () {
            return getParticipantRegistry('org.acme.shipping.perishable.Importer');
        })
        .then(function (importerRegistry) {
            // update the importer's balance
            return importerRegistry.update(contract.importer);
        })
        .then(function () {
            return getAssetRegistry('org.acme.shipping.perishable.Shipment');
        })
        .then(function (shipmentRegistry) {
            // update the state of the shipment
            return shipmentRegistry.update(shipment);
        });
}

/**
 * A shipment has been received by an importer
 * @param {org.acme.shipping.perishable.ShipmentPacked} shipmentPacked - the ShipmentPacked transaction
 * @transaction
 */
function shipmentPacked(shipmentPacked) {

    var shipment = shipmentPacked.shipment;

    console.log('Packed at: ' + shipmentPacked.timestamp);

    // set the status of the shipment
    shipment.status = 'PACKED';

    return getAssetRegistry('org.acme.shipping.perishable.Shipment')
        .then(function (shipmentRegistry) {

    var factory = getFactory();
    var shipmentEvent = factory.newEvent('org.acme.shipping.perishable', 'ShipmentEvent');
    shipmentEvent.shipmentId=shipment.shipmentId;
    shipmentEvent.shipmentStatus='PACKED';
    shipmentEvent.description='Shipment packaging complete';
    emit(shipmentEvent);
    // update the shipment
            return shipmentRegistry.update(shipment);
        })

}

/**
 * A shipment has been received by an importer
 * @param {org.acme.shipping.perishable.ShipmentInTransit} shipmentInTransit - the ShipmentInTransit transaction
 * @transaction
 */
function shipmentInTransit(shipmentInTransit) {

    var shipment = shipmentInTransit.shipment;
    console.log('In transit at: ' + shipmentInTransit.timestamp);

    // set the status of the shipment
    shipment.status = 'IN_TRANSIT';

    return getAssetRegistry('org.acme.shipping.perishable.Shipment')
        .then(function (shipmentRegistry) {

    var factory = getFactory();
    var shipmentEvent = factory.newEvent('org.acme.shipping.perishable', 'ShipmentEvent');
    shipmentEvent.shipmentId=shipment.shipmentId;
    shipmentEvent.shipmentStatus='IN_TRANSIT';
    shipmentEvent.description='Shipment is now in transit';
    emit(shipmentEvent);
    // update the shipment
            return shipmentRegistry.update(shipment);
        })

}

/**
 * A temperature reading has been received for a shipment
 * @param {org.acme.shipping.perishable.TemperatureReading} temperatureReading - the TemperatureReading transaction
 * @transaction
 */
function temperatureReading(temperatureReading) {

    var shipment = temperatureReading.shipment;

    console.log('Adding temperature ' + temperatureReading.centigrade + ' to shipment ' + shipment.$identifier);

    if (shipment.temperatureReadings) {
        shipment.temperatureReadings.push(temperatureReading);
    } else {
        shipment.temperatureReadings = [temperatureReading];
    }

    return getAssetRegistry('org.acme.shipping.perishable.Shipment')
        .then(function (shipmentRegistry) {
            // add the temp reading to the shipment
            return shipmentRegistry.update(shipment);
        });
}

/**
 * @param {org.acme.shipping.perishable.basicEventTransaction} basicEventTransaction
 * @transaction
 */
function basicEventTransaction(basicEventTransaction) {
    var factory = getFactory();

    var basicEvent = factory.newEvent('org.acme.shipping.perishable', 'BasicEvent');
    basicEvent.arg1='blockchain event';
    basicEvent.arg2='world!';
    emit(basicEvent);
}

/**
 * @param {org.acme.shipping.perishable.shipmentEventTransaction} shipmentEventTransaction
 * @transaction
 */
function shipmentEventTransaction(shipmentEventTransaction) {
    var factory = getFactory();

    var shipmentEvent = factory.newEvent('org.acme.shipping.perishable', 'ShipmentEvent');
   shipmentEvent.shipmentId='1234';
   shipmentEvent.shipmentStatus='STATUS';
   shipmentEvent.description='DESC';


    emit(shipmentEvent);
}



/**
 * Initialize some test assets and participants useful for running a demo.
 * @param {org.acme.shipping.perishable.SetupDemo} setupDemo - the SetupDemo transaction
 * @transaction
 */
function setupDemo(setupDemo) {

    var factory = getFactory();
    var NS = 'org.acme.shipping.perishable';

    // create the grower
    var grower = factory.newResource(NS, 'Grower', 'GROWER_001');
    var growerAddress = factory.newConcept(NS, 'Address');
    grower.email='farmer@gmail.com';
    growerAddress.country = 'USA';
  grower.companyName='Grower Pty Ltd';
    grower.address = growerAddress;
    grower.accountBalance = 0;

    // create the importer
    var importer = factory.newResource(NS, 'Importer', 'IMPORTER_001');
    var importerAddress = factory.newConcept(NS, 'Address');
    importer.email='supermarket@email.com';
    importerAddress.country = 'UK';
    importer.companyName='Importer Pty Ltd';
    importer.address = importerAddress;
    importer.accountBalance = 0;

    // create the shipper
    var shipper = factory.newResource(NS, 'Shipper', 'SHIPPER_001');
    var shipperAddress = factory.newConcept(NS, 'Address');
    shipperAddress.country = 'Panama';
    shipper.email='shipper@email.com';
    shipper.companyName='Shipper Pty Ltd';
    shipper.address = shipperAddress;
    shipper.accountBalance = 0;

    // create the contract
    var contract = factory.newResource(NS, 'Contract', 'CON_001');
    contract.grower = factory.newRelationship(NS, 'Grower', 'GROWER_001');
    contract.importer = factory.newRelationship(NS, 'Importer', 'IMPORTER_001');
    contract.shipper = factory.newRelationship(NS, 'Shipper', 'SHIPPER_001');
    var tomorrow = setupDemo.timestamp;
    tomorrow.setDate(tomorrow.getDate() + 1);
    contract.arrivalDateTime = tomorrow; // the shipment has to arrive tomorrow
    contract.unitPrice = 0.5; // pay 50 cents per unit
    contract.minTemperature = 2; // min temperature for the cargo
    contract.maxTemperature = 10; // max temperature for the cargo
    contract.minPenaltyFactor = 0.2; // we reduce the price by 20 cents for every degree below the min temp
    contract.maxPenaltyFactor = 0.1; // we reduce the price by 10 cents for every degree above the max temp

    // create the shipment
    var shipment = factory.newResource(NS, 'Shipment', 'SHIP_001');
    shipment.type = 'RADISHES';
    shipment.status = 'IN_TRANSIT';
    shipment.unitCount = 5000;
    shipment.contract = factory.newRelationship(NS, 'Contract', 'CON_001');
    return getParticipantRegistry(NS + '.Grower')
        .then(function (growerRegistry) {
            // add the growers
            return growerRegistry.addAll([grower]);
        })
        .then(function() {
            return getParticipantRegistry(NS + '.Importer');
        })
        .then(function(importerRegistry) {
            // add the importers
            return importerRegistry.addAll([importer]);
        })
        .then(function() {
            return getParticipantRegistry(NS + '.Shipper');
        })
        .then(function(shipperRegistry) {
            // add the shippers
            return shipperRegistry.addAll([shipper]);
        })
        .then(function() {
            return getAssetRegistry(NS + '.Contract');
        })
        .then(function(contractRegistry) {
            // add the contracts
            return contractRegistry.addAll([contract]);
        })
        .then(function() {
            return getAssetRegistry(NS + '.Shipment');
        })
        .then(function(shipmentRegistry) {
            // add the shipments
            return shipmentRegistry.addAll([shipment]);
        });
}