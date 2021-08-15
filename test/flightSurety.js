
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();


    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          await config.flightSurety.setTestingMode(true);
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });

  it('(airline) Can Register ', async () => {
    
    // ARRANGE
      let newAirline = accounts[2];
      let secondAirline = accounts[3];
      let thirdAirline = accounts[4];
      let fourthAirline = accounts[5];
          
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline);
      
    }
    catch(e) {

    }   
        
      let result = await config.flightSuretyData.isAirline.call(newAirline);    

    // ASSERT
    assert.equal(result, true, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('( New Airline)Can Approve Airline ', async () => {
    
    // ARRANGE
      let newAirline = accounts[2];
      let secondAirline = accounts[3];
      let thirdAirline = accounts[4];
      let fourthAirline = accounts[5];
      let fifthAirline = accounts[5];
          
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline);
      await config.flightSuretyApp.registerAirline(secondAirline);
      await config.flightSuretyApp.registerAirline(thirdAirline);
      await config.flightSuretyApp.registerAirline(fourthAirline);
      await config.flightSuretyApp.registerAirline(fifthAirline);
    }
    catch(e) {

    }   
            
    await config.flightSuretyApp.approveAirlineRegistration(fifthAirline,  {from:newAirline})
    await config.flightSuretyApp.approveAirlineRegistration(fifthAirline, {from:secondAirline})


    let result1 = await config.flightSuretyData.canVoteStatus.call(newAirline);    
    console.log('Airline Can Vote Status for Airline 1 ' + result1);
    console.log("----------------------------------------------------------------------");
    
    let result2 = await config.flightSuretyData.canVoteStatus.call(secondAirline);
    console.log('Airline Can Vote Status for Airline 2 ' + result2);
    console.log("----------------------------------------------------------------------");
    
    let result3= await config.flightSuretyData.canVoteStatus.call(thirdAirline);
    console.log('Airline Can Vote Status for Airline 3 ' + result3);
   console.log("----------------------------------------------------------------------");
    
    let result4= await config.flightSuretyData.canVoteStatus.call(fourthAirline);
    console.log('Airline Can Vote Status for Airline 4 ' + result4);
     console.log("----------------------------------------------------------------------");
    
    let result5 = await config.flightSuretyData.isApprovedStatus.call(fifthAirline);
    console.log('Airline Can Vote Status for Airline 5 ' + result5);
    console.log("----------------------------------------------------------------------");
    
    let result = await config.flightSuretyData. getAirlineVoteCount.call(fifthAirline);      
    console.log('Voting Count ' + result);
    console.log("----------------------------------------------------------------------");
    

    let result44 = await config.flightSuretyData. getTotalCanVoteAirlines.call();      
    console.log('Total Airlines Can Vote  ' + result44);
    console.log("----------------------------------------------------------------------");
    
    let result9 = await config.flightSuretyData.isApprovedStatus.call(fifthAirline);
    console.log('Airline Can Vote Status for Airline 9 ' + result9);
    console.log("----------------------------------------------------------------------");
    
    // ASSERT
    //assert.equal(result, true, " Airline is Not Approved");

  });
    
    
  
 

});
