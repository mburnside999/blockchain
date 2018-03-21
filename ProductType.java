/**
  * A business network for shipping perishable goods
  * The cargo is temperature controlled and contracts
  * can be negociated based on the temperature
  * readings received for the cargo
  */

namespace org.acme.shipping.perishable

/**
 * The type of perishable product being shipped
 */
enum ProductType {
  o BANANAS
  o APPLES
  o PEARS
  o PEACHES
  o COFFEE
  o MANGOES
  o RADISHES
  o TURNIPS
  o BEETROOTS
}

/**
 * The status of a shipment
 */
enum ShipmentStatus {
  o CREATED
  o PACKED
  o IN_TRANSIT
  o ARRIVED
}

/**
 * An abstract transaction that is related to a Shipment
 */
abstract transaction ShipmentTransaction {
    --> Shipment shipment
}


event BasicEvent {
  o String arg1
  o String arg2
  
}


event ShipmentEvent {
  o String shipmentId
  o String shipmentStatus
  o String description  
}

/**
 * 
 */
transaction basicEventTransaction  {
  
}


/**
 * 
 */
transaction shipmentEventTransaction  {
  
}


/**
 * An temperature reading for a shipment. E.g. received from a
 * device within a temperature controlled shipping container
 */
transaction TemperatureReading extends ShipmentTransaction {
  o Double centigrade
}

/**
 * A notification that a shipment has been received by the
 * importer and that funds should be transferred from the importer
 * to the grower to pay for the shipment.
 */
transaction ShipmentReceived extends ShipmentTransaction {
}

/**
 * A notification that a shipment has been packed by the
 * shipper.
 */
transaction ShipmentPacked extends ShipmentTransaction {
}

/**
 * A notification that a shipment is now in transit.
 */
transaction ShipmentInTransit extends ShipmentTransaction {
}

/**
 * A shipment being tracked as an asset on the ledger
 */
asset Shipment identified by shipmentId {
  o String shipmentId
  o ProductType type
  o ShipmentStatus status
  o Long unitCount
  o TemperatureReading[] temperatureReadings optional
  --> Contract contract
}

/**
 * Defines a contract between a Grower and an Importer to ship using
 * a Shipper, paying a set unit price. The unit price is multiplied by
 * a penality factor proportional to the deviation from the min and max
 * negociated temperatures for the shipment.
 */
asset Contract identified by contractId {
  o String contractId
  --> Grower grower
  --> Shipper shipper
  --> Importer importer
  o DateTime arrivalDateTime
  o Double unitPrice
  o Double minTemperature
  o Double maxTemperature
  o Double minPenaltyFactor
  o Double maxPenaltyFactor
}

/**
 * A concept for a simple street address
 */
concept Address {
  o String city optional
  o String country
  o String street optional
  o String zip optional
}

/**
 * An abstract participant type in this business network
 */
abstract participant Business identified by accountPK {
  o String accountPK
  o String companyName
  o String email
  o Address address
  o Double accountBalance
}

/**
 * A Grower is a type of participant in the network
 */
participant Grower extends Business {
}

/**
 * A Shipper is a type of participant in the network
 */
participant Shipper extends Business {
}

/**
 * An Importer is a type of participant in the network
 */
participant Importer extends Business {
}

/**
 * JUST FOR INITIALIZING A DEMO
 */
transaction SetupDemo {
}
