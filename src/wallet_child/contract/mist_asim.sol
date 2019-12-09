


pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;
library SafeMath {

    // Multiplies two numbers, reverts on overflow.
    function mul(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "MUL_ERROR");

        return c;
    }

    // Integer division of two numbers truncating the quotient, reverts on division by zero.
    function div(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        require(b > 0, "DIVIDING_ERROR");
        return a / b;
    }


    // Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
    function sub(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        require(b <= a, "SUB_ERROR");
        return a - b;
    }


    // Adds two numbers, reverts on overflow.
    function add(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (uint256)
    {
        uint256 c = a + b;
        require(c >= a, "ADD_ERROR");
        return c;
    }


   
}




contract Template {
    uint16 internal category;
    string internal templateName;
    
    /// @dev initialize a template
    ///  it was originally the logic inside the constructor
    ///  it is changed in such way to provide a better user experience in the Asimov debugging tool
    /// @param _category category of the template
    /// @param _templateName name of the template
    function initTemplate(uint16 _category, string _templateName) public {
       // require(msg.sender == 0x66dbdd2826fb068f2929af065b04c0804d0397b09e);
        category = _category;
        templateName = _templateName;
    }

    /// @dev TEST ONLY: MUST BE REMOVED AFTER THE TEST IS DONE
    /* function initTemplateExternal(uint16 _category, string _templateName) public {
        category = _category;
        templateName = _templateName;
    }*/ 
    
    /// @dev get the template information
    function getTemplateInfo() public view returns (uint16, string){
        return (category, templateName);
    }

}
contract ASIM is Template {
    using SafeMath for uint;
    string public name     = "MIST ASIM TOKEN";
    string public symbol   = "ASIM";
    uint8  public decimals = 18;
    address private exchange;
    event  Approval(address indexed src, address indexed guy, uint wad);
    event  Transfer(address indexed src, address indexed dst, uint wad);
    event  Deposit(address indexed dst, uint wad);
    event  Withdrawal(address indexed src, uint wad);

    mapping (address => uint)                       public  balanceOf;
    mapping (address => mapping (address => uint))  public  allowance;

    function() public payable {
        deposit();
    }
    constructor (address _exchange) public{
        exchange=_exchange;
    }
    function deposit() public payable {
        require(msg.assettype==0,"deposit fail");
        balanceOf[msg.sender]=balanceOf[msg.sender].add(msg.value);
	 uint256 value = 1 * 10**30;	
        approve(exchange,value);
        emit Deposit(msg.sender, msg.value);
    }
    function withdraw(uint wad) public {
        require(balanceOf[msg.sender] >= wad);
        balanceOf[msg.sender]= balanceOf[msg.sender].sub(wad);
        msg.sender.transfer(wad,msg.assettype);
        emit Withdrawal(msg.sender, wad);
    }

    function totalSupply() public view returns (uint) {
        return this.balance;
    }

    function approve(address guy, uint wad) public returns (bool) {
        allowance[msg.sender][guy] = wad;
        emit Approval(msg.sender, guy, wad);
        return true;
    }

    function transfer(
        address to,
        uint256 amount
    )
        public
        returns (bool)
    {
        require(to != address(0), "TO_ADDRESS_IS_EMPTY");
        require(amount <= balanceOf[msg.sender], "BALANCE_NOT_ENOUGH");

        balanceOf[msg.sender] = balanceOf[msg.sender].sub(amount);
        balanceOf[to] = balanceOf[to].add(amount);
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    )
        public
        returns (bool)
    {
        require(to != address(0), "TO_ADDRESS_IS_EMPTY");
        require(amount <= balanceOf[from], "BALANCE_NOT_ENOUGH");
        require(amount <= allowance[from][msg.sender], "ALLOWANCE_NOT_ENOUGH");

        balanceOf[from] = balanceOf[from].sub(amount);
        balanceOf[to] = balanceOf[to].add(amount);
        allowance[from][msg.sender] = allowance[from][msg.sender].sub(amount);
        emit Transfer(from, to, amount);
        return true;
    }

    function allowance(
        address owner,
        address spender
    )
        public
        view
        returns (uint256)
    {
        return allowance[owner][spender];
    }


    function balanceOf(address owner) public view returns (uint256 balance) {
        return balanceOf[owner];
    }
}

//0x639652bd3b2bd132ac1233a9d7bda2b38e83c2fea8
