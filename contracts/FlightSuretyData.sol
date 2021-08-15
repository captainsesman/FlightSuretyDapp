pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    mapping(address => uint256) private votesCount;
    mapping(address => bool) authorizedCallers;

    //Airlines Data and Variables
    mapping(address => Airline) private airlines;
    uint256 airlinesTotalCount = 0;
    uint256 multiParty = 5;
    address[] airlinesCanVote = new address[](0);
    mapping(address => address[]) private airlineVoteCount;

    struct Airline {
        address account;
        bool isRegistered;
        bool isApproved;
        bool isFunded;
        bool canVote;
    }

    // CONSTANTS
    uint256 public constant INSURANCE_PRICE_LIMIT = 1 ether;
    uint256 public constant MIN_ANTE = 10 ether;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event airlineRegistered(address airline);
    event voteAirlineQueue(address airline);
    event AirlineApproved(address _airline);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address airline) public {
        contractOwner = msg.sender;

        airlines[airline] = Airline({
            account: contractOwner,
            isRegistered: true,
            isApproved: true,
            isFunded: true,
            canVote: true
        });

        // emit airlineRegistered(contractOwner);
        airlinesTotalCount = airlinesTotalCount.add(1);
    }

    //Add and disable an authorised caller. Can only be called from FlightSuretyApp contract

    function authorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = true;
    }

    function setIsAuthorizedCaller(address _address, bool authorized)
        public
        requireIsOperational
    {
        authorizedCallers[_address] = authorized;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Check is Airline is already Registered;
     *
     * @return A bool that shows the status of the Airline to be Registered
     */
    function isAirline(address airlineAccount) public view returns (bool) {
        require(
            airlineAccount != contractOwner,
            "'airlineAccount' must be a valid address."
        );
        return airlines[airlineAccount].isRegistered;
    }

    //Check If Airline is Approved

    function isApprovedStatus(address airlineAccount)
        public
        view
        returns (bool)
    {
        // require(
        //     airlineAccount != contractOwner,
        //     "'airlineAccount' must be a valid address."
        // );
        return airlines[airlineAccount].isApproved;
    }

    function canVoteStatus(address airlineAccount) public view returns (bool) {
        // require(
        //     airlineAccount != contractOwner,
        //     "'airlineAccount' must be a valid address."
        // );
        return airlines[airlineAccount].canVote;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    //Confirm Airline Registration
    function setisApproved(address _airline) returns (bool) {
        airlines[_airline].isApproved = true;
        emit AirlineApproved(_airline);
    }

    //List of airlines that can vote

    function getTotalAirlineCount() external returns (uint256) {
        return airlinesTotalCount;
    }

    function getTotalCanVoteAirlines() external returns (uint256) {
        return airlinesCanVote.length;
    }

    //Retrieves the total votes an Airline gets
    function getAirlineVoteCount(address _airline) external returns (uint256) {
        return airlineVoteCount[_airline].length;
    }

    //Resets and Removes Airline Once its Approved
    function resetAirlineVotes(address _airline) external returns (uint256) {
        delete (airlineVoteCount[_airline]);
    }

    //Checks Duplicate Voting
    function checkDoublevoting(address _airline, address _voter)
        private
        view
        returns (bool)
    {
        address[] memory votes = airlineVoteCount[_airline];
        bool isDuplicate = false;
        for (uint256 i = 0; i < votes.length; i++) {
            if (votes[i] == _voter) {
                return isDuplicate;
            }
        }
        return (!isDuplicate);
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address _airline) external requireIsOperational {
        if (airlinesTotalCount < multiParty) {
            airlines[_airline] = Airline({
                account: _airline,
                isRegistered: true,
                isApproved: true,
                isFunded: false,
                canVote: true
            });

            airlinesCanVote.push(_airline);
            emit airlineRegistered(_airline);
        } else {
            airlines[_airline] = Airline({
                account: _airline,
                isRegistered: true,
                isApproved: false,
                isFunded: false,
                canVote: false
            });

            emit voteAirlineQueue(_airline);
        }
        airlinesTotalCount = airlinesTotalCount.add(1);
    }

    function vote(address _airline, address _votingAirline)
        external
        requireIsOperational
    {
        require(
            checkDoublevoting(_airline, _votingAirline),
            "Airline Already Voted"
        );

        airlineVoteCount[_airline].push(_votingAirline);
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy() external payable {}

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external pure {}

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external pure {}

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {}

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        fund();
    }
}
