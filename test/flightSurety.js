
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
      let fifthAirline = accounts[6];
          
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
    let result2 = await config.flightSuretyData.canVoteStatus.call(secondAirline);
    let result3= await config.flightSuretyData.canVoteStatus.call(thirdAirline);
    let result4= await config.flightSuretyData.canVoteStatus.call(fourthAirline);
    let result5 = await config.flightSuretyData.isApprovedStatus.call(fifthAirline);
    let result = await config.flightSuretyData. getAirlineVoteCount.call(fifthAirline);      
    let result44 = await config.flightSuretyData. getTotalCanVoteAirlines.call(); 
    let result9 = await config.flightSuretyData.isApprovedStatus.call(fifthAirline);
  
    // ASSERT
    assert.equal( result5, true, " Airline is Not Approved");

  });
    
  
  it('(airline) Can Fund Account ', async () => {
    
    // ARRANGE
      // let newAirline = accounts[2];
    let secondAirline = accounts[3];   
    let fifthAirline = accounts[6];

    let seedPrice = web3.utils.toWei("10", "ether");
    
    // ACT
    try {

      await config.flightSuretyData.airlineFundInsurance({from: secondAirline, value:seedPrice})
      await config.flightSuretyData.airlineFundInsurance({ from: fifthAirline, value: seedPrice })    
      
    }
    catch(e) {
    }   
       
    let result = await config.flightSuretyData.isFunded.call(fifthAirline)
    
    //ASSERT
    assert.equal(result, true, "Airline should Not Be allowed to Register Flight If Not Funded ");

  });

  it('(airline) Register Flight ', async () => {
    
    // ARRANGE       
    let registered_airline = accounts[6];       
    // ACT
    try {

      await config.flightSuretyApp.registerFlight(registered_airline, 'Boeing404', 2345, {from:registered_airline});
      
    }
    catch(e) {
    }   
       
    let result = await config.flightSuretyData.checkFlightRegistrationStatus.call(registered_airline, 'Boeing404', 2345)
    
    //ASSERT
    assert.equal(result, true, "Only Registered and Funded Airlines Can Register Flight ");

  });
  
  
  it('(Passenger) Can Be Insured  ', async () => {
    
    // ARRANGE       
    let registered_airline = accounts[6];
    let passenger = accounts[9];   
    let insurancePrice = web3.utils.toWei("1", "ether");
    // ACT
    try {
      await config.flightSuretyData.buy(passenger,'Boeing404', 2345, registered_airline, {from: passenger, value:insurancePrice, gas: 6721975,
                gasPrice: 20000000000});      
    }
    catch (e) {
      
       console.log("error from Testing Passenger Can Be Insured ", e);
    }          
 
    //Insured Check InsuredAmount   
    let insuredAmount = await config.flightSuretyData.getInsuredAmount.call(passenger)
    console.log('Insured Amount in Ether '+insuredAmount);
 
    //ASSERT
    assert.equal(insuredAmount, 1, "Customer Must Pay 1 Ether to be Insured ");    

  });


    
  it('Can Credit Insuree  ', async () => {
    
    // ARRANGE       
    let registered_airline = accounts[6];
    let passenger = accounts[9];   
    let insurancePrice = web3.utils.toWei("1", "ether");
    const statusCode = 'STATUS_CODE_LATE_TECHNICAL';
    // ACT
    try {
      await config.flightSuretyData.updateFlightStatusCode(registered_airline,'Boeing404', 2345, 'STATUS_CODE_LATE_TECHNICAL');      
    }
    catch (e) {
      
       console.log("error from Testing Can Credit Insuree ", e);
    }          
 
    //Insured Check InsuredAmount   
    let compareStatus = await config.flightSuretyData.checkFlightStatusCode.call(registered_airline, 'Boeing404', 2345);
    if (statusCode === compareStatus) {
      await config.flightSuretyApp.creditInsuree(registered_airline, 'Boeing404', 2345)
    }
    let amount = await config.flightSuretyData.getAmountPayable.call(passenger);    
    let result =  insurancePrice * 1.5;
    //ASSERT
   assert.equal(amountPaid, result, "Passenger Credited");    

  });


  it('Can Withdraw Amount  ', async () => {
    
    // ARRANGE          
    let passenger = accounts[9];   
       
    let amount = await config.flightSuretyData.getAmountPayable.call(passenger); 

    await config.flightSuretyData.pay(passenger, amount);
    let newBalance = await config.flightSuretyData.getAmountPayable.call(passenger);
    let result = false;
    if (newBalance < amount) {
      result = true;
    }
    //ASSERT
   assert.equal(result, true, "Passenger Credited");    

  });
  
 

});
