// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {TFHE} from "@fhevm/solidity/TFHE.sol";

/**
 * @title SecretNFTLaunchFHE
 * @dev A confidential NFT launch platform using FHEVM for true privacy
 * This version uses FHE operations for confidential price discovery and purchase records
 */
contract SecretNFTLaunchFHE is Ownable, ReentrancyGuard {
    constructor() Ownable(msg.sender) {}
    using SafeERC20 for IERC20;

    // Error definitions
    error LaunchNotActive();
    error LaunchEnded();
    error LaunchNotEnded();
    error InvalidAmount();
    error AlreadyParticipated();
    error NotEnoughTokens();
    error LaunchNotFinalized();
    error AlreadyFinalized();
    error InvalidTokenAddress();
    error InvalidPrice();
    error FHEOperationFailed();

    // Events
    event LaunchCreated(
        uint256 indexed launchId,
        address indexed nftContract,
        uint256 totalSupply,
        uint256 startTime,
        uint256 endTime,
        bytes encryptedPrice
    );
    event SecretPurchase(
        uint256 indexed launchId,
        address indexed buyer,
        bytes encryptedAmount
    );
    event LaunchFinalized(uint256 indexed launchId);
    event TokensClaimed(
        uint256 indexed launchId,
        address indexed buyer,
        uint256 amount
    );

    // Launch structure with FHE variables
    struct Launch {
        address nftContract;           // NFT contract address
        uint256 totalSupply;           // Total supply
        uint256 startTime;             // Start time
        uint256 endTime;               // End time
        euint32 secretPrice;           // Encrypted confidential price
        euint64 totalRaised;           // Encrypted total raised
        euint64 totalSold;             // Encrypted total sold
        bool isActive;                 // Whether active
        bool isFinalized;              // Whether finalized
        address paymentToken;          // Payment token address
        uint256 publicPrice;           // Public price (for reference only)
    }

    // User participation record with FHE variables
    struct UserParticipation {
        euint64 amountPaid;            // Encrypted payment amount
        euint32 tokensBought;          // Encrypted purchase amount
        bool hasClaimed;               // Whether claimed
    }

    // State variables
    uint256 public nextLaunchId = 0;
    uint256 public platformFee = 250; // 2.5% fee (250 basis points)
    
    // Mappings
    mapping(uint256 => Launch) public launches;
    mapping(uint256 => mapping(address => UserParticipation)) public participations;
    mapping(uint256 => address[]) public participants;
    mapping(address => address) public nftCollectionCreators; // NFT Collection address => creator address

    /**
     * @dev Register NFT Collection creator (can be called by anyone, but should be called by NFT Factory)
     * @param _nftContract NFT contract address
     * @param _creator Creator address
     */
    function registerNFTCollectionCreator(
        address _nftContract,
        address _creator
    ) external {
        if (_nftContract == address(0)) revert InvalidTokenAddress();
        if (_creator == address(0)) revert InvalidTokenAddress();
        
        nftCollectionCreators[_nftContract] = _creator;
    }

    /**
     * @dev Create a new NFT launch with encrypted price
     * @param _nftContract NFT contract address
     * @param _totalSupply Total supply
     * @param _startTime Start time
     * @param _endTime End time
     * @param _encryptedPrice Encrypted confidential price
     * @param _paymentToken Payment token address
     */
    function createLaunch(
        address _nftContract,
        uint256 _totalSupply,
        uint256 _startTime,
        uint256 _endTime,
        bytes calldata _encryptedPrice,
        address _paymentToken
    ) external {
        if (_nftContract == address(0)) revert InvalidTokenAddress();
        if (_startTime >= _endTime) revert InvalidPrice();
        if (_totalSupply == 0) revert InvalidAmount();
        
        // Check if caller is the creator of the NFT Collection or the contract owner
        address creator = nftCollectionCreators[_nftContract];
        if (creator == address(0)) {
            // If not registered, only owner can create launch
            if (msg.sender != owner()) revert InvalidTokenAddress();
        } else {
            // If registered, creator or owner can create launch
            if (msg.sender != creator && msg.sender != owner()) revert InvalidTokenAddress();
        }

        uint256 launchId = nextLaunchId++;
        
        Launch storage launch = launches[launchId];
        launch.nftContract = _nftContract;
        launch.totalSupply = _totalSupply;
        launch.startTime = _startTime;
        launch.endTime = _endTime;
        launch.secretPrice = TFHE.asEuint32(_encryptedPrice);
        launch.paymentToken = _paymentToken;
        launch.isActive = true;
        launch.totalRaised = TFHE.asEuint64(0);
        launch.totalSold = TFHE.asEuint64(0);
        launch.publicPrice = 0; // Not used in FHE version

        emit LaunchCreated(launchId, _nftContract, _totalSupply, _startTime, _endTime, _encryptedPrice);
    }

    /**
     * @dev Confidential purchase of NFT using FHE
     * @param _launchId Launch ID
     * @param _encryptedAmount Encrypted purchase amount
     */
    function secretPurchase(
        uint256 _launchId,
        bytes calldata _encryptedAmount
    ) external nonReentrant payable {
        Launch storage launch = launches[_launchId];
        if (!launch.isActive) revert LaunchNotActive();
        if (block.timestamp < launch.startTime || block.timestamp > launch.endTime) revert LaunchEnded();

        UserParticipation storage participation = participations[_launchId][msg.sender];
        if (participation.hasClaimed) revert AlreadyParticipated();

        // Convert encrypted amount to FHE type
        euint32 amount = TFHE.asEuint32(_encryptedAmount);
        
        // Verify amount is not zero using FHE comparison
        if (TFHE.isInitialized(amount) && TFHE.eq(amount, TFHE.asEuint32(0))) revert InvalidAmount();

        // Calculate payment amount using FHE operations
        euint64 amountPaid = TFHE.mul(launch.secretPrice, amount);
        
        // Verify payment amount (this would need to be done off-chain or with additional FHE operations)
        // For now, we'll use a simplified approach where the user sends the expected amount
        
        // Update user participation record using FHE operations
        participation.amountPaid = TFHE.add(participation.amountPaid, amountPaid);
        participation.tokensBought = TFHE.add(participation.tokensBought, amount);

        // Update launch statistics using FHE operations
        launch.totalRaised = TFHE.add(launch.totalRaised, amountPaid);
        launch.totalSold = TFHE.add(launch.totalSold, amount);

        // Record participant
        if (participants[_launchId].length == 0 || 
            participants[_launchId][participants[_launchId].length - 1] != msg.sender) {
            participants[_launchId].push(msg.sender);
        }

        emit SecretPurchase(_launchId, msg.sender, _encryptedAmount);
    }

    /**
     * @dev Finalize a launch
     * @param _launchId Launch ID
     */
    function finalizeLaunch(uint256 _launchId) external onlyOwner {
        Launch storage launch = launches[_launchId];
        if (!launch.isActive) revert LaunchNotActive();
        if (block.timestamp <= launch.endTime) revert LaunchNotEnded();
        if (launch.isFinalized) revert AlreadyFinalized();

        launch.isFinalized = true;
        launch.isActive = false;

        emit LaunchFinalized(_launchId);
    }

    /**
     * @dev Claim NFTs after launch finalization
     * @param _launchId Launch ID
     */
    function claimNFTs(uint256 _launchId) external nonReentrant {
        Launch storage launch = launches[_launchId];
        if (!launch.isFinalized) revert LaunchNotFinalized();

        UserParticipation storage participation = participations[_launchId][msg.sender];
        if (participation.hasClaimed) revert AlreadyParticipated();

        // Decrypt the tokens bought amount
        uint256 tokensToClaim = TFHE.decrypt(participation.tokensBought);
        if (tokensToClaim == 0) revert NotEnoughTokens();

        participation.hasClaimed = true;

        // For demo purposes, we just emit the event
        // In production, this would mint NFTs to the user
        emit TokensClaimed(_launchId, msg.sender, tokensToClaim);
    }

    /**
     * @dev Get launch information (public data only)
     * @param _launchId Launch ID
     */
    function getLaunch(uint256 _launchId) external view returns (
        address nftContract,
        uint256 totalSupply,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool isFinalized,
        address paymentToken
    ) {
        Launch storage launch = launches[_launchId];
        return (
            launch.nftContract,
            launch.totalSupply,
            launch.startTime,
            launch.endTime,
            launch.isActive,
            launch.isFinalized,
            launch.paymentToken
        );
    }

    /**
     * @dev Get user participation information (encrypted)
     * @param _launchId Launch ID
     * @param _user User address
     */
    function getUserParticipation(uint256 _launchId, address _user) external view returns (
        bytes memory encryptedAmountPaid,
        bytes memory encryptedTokensBought,
        bool hasClaimed
    ) {
        UserParticipation storage participation = participations[_launchId][_user];
        return (
            TFHE.encrypt(participation.amountPaid),
            TFHE.encrypt(participation.tokensBought),
            participation.hasClaimed
        );
    }

    /**
     * @dev Get all participants for a launch
     * @param _launchId Launch ID
     */
    function getParticipants(uint256 _launchId) external view returns (address[] memory) {
        return participants[_launchId];
    }

    /**
     * @dev Get encrypted launch statistics (for authorized parties)
     * @param _launchId Launch ID
     */
    function getEncryptedLaunchStats(uint256 _launchId) external view returns (
        bytes memory encryptedTotalRaised,
        bytes memory encryptedTotalSold
    ) {
        Launch storage launch = launches[_launchId];
        return (
            TFHE.encrypt(launch.totalRaised),
            TFHE.encrypt(launch.totalSold)
        );
    }

    /**
     * @dev Set platform fee (owner only)
     * @param _fee Fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        platformFee = _fee;
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            require(success, "Transfer failed");
        }
    }

    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            require(success, "Transfer failed");
        }
    }

    // Receive function to accept ETH
    receive() external payable {}
}
